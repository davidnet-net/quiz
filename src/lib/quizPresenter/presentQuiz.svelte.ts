import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { goto } from "$app/navigation";
import { error } from "@sveltejs/kit";

export function presentQuiz(getQuizId: () => string) {
	let loading = $state(true);
	let errorCode = $state<string | null>(null);
	let socket = $state<WebSocket | null>(null);
	let quizName = $state<string>("Test quiz");
	let pinCode = $state<string>("000000");
	let locked = $state<boolean>(false);
	let sessionId = $state<string | null>(null);
	let players = $state<Array<{ id: string; nickname: string; failingHeartbeat?: boolean }>>([]);
	let isIntentionallyClosed = false;

	let gameState = $state<"lobby" | "preview" | "active" | "results" | "leaderboard" | "finished">(
		"lobby"
	);
	let currentQuestionPayload = $state<any>(null);
	let timerServerTime = $state(0);
	let timerDurationMs = $state(0);
	let responseCount = $state(0);
	let resultsBreakdown = $state<Record<string, number>>({});
	let leaderboardData = $state<Array<{ id: string; nickname: string; score: number }>>([]);

	let autoMode = $state(false);
	let autoTimerRemaining = $state(0);

	$effect(() => {
		if (!autoMode) {
			autoTimerRemaining = 0;
			return;
		}

		let duration = 0;
		if (gameState === "results") {
			duration = 7000;
		} else if (gameState === "leaderboard") {
			duration = 10000;
		} else if (gameState === "finished") {
			autoMode = false;
			return;
		}

		if (duration === 0) return;

		const target = Date.now() + duration;
		let frame: number;
		let triggered = false;

		const update = () => {
			autoTimerRemaining = Math.max(0, target - Date.now());
			if (autoTimerRemaining > 0) {
				frame = requestAnimationFrame(update);
			} else if (!triggered) {
				triggered = true;
				nextPhase();
			}
		};

		update();

		return () => {
			cancelAnimationFrame(frame);
			autoTimerRemaining = 0;
		};
	});

	$effect(() => {
		const quizId = getQuizId();
		if (!quizId) return;

		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;
		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
		let reconnectTimeout: ReturnType<typeof setTimeout>;
		let reconnectAttempts = 0;

		fetch(`${PUBLIC_BACKEND_URL}/websockets/quiz/present/${quizId}`, { credentials: "include" })
			.then(async (res) => {
				if (res.status === 403) return goto(`/manage/${quizId}/no_access`);
				if (res.status === 404) return goto(`/manage/${quizId}/not_found`, { replaceState: true });
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					if (data.code === "NO_QUESTIONS" || data.code === "QUESTION_INVALID") {
						errorCode = data.code;
						loading = false;
						return;
					}
					throw error(res.status, data.error || "Failed to start presentation");
				}
				const data = await res.json();
				sessionId = data.sessionId;
				if (data.pinCode) pinCode = data.pinCode;
				if (data.quizName) quizName = data.quizName;
				connectWebSocket();
			})
			.catch((err) => {
				console.error("[Quiz Presenter] Pre-flight fetch error:", err);
				if (!err?.status) connectWebSocket();
			});

		function connectWebSocket() {
			if (isIntentionallyClosed) return;
			if (
				socket &&
				(socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)
			)
				return;

			let wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/present/${quizId}`;
			if (sessionId) wsUrl += `?sessionId=${encodeURIComponent(sessionId)}`;
			const ws = new WebSocket(wsUrl);
			socket = ws;

			ws.onopen = () => {
				console.log("[Quiz Presenter] Connected to presentation room");
				loading = false;
				reconnectAttempts = 0;
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					if (message.type === "PING") {
						ws.send(JSON.stringify({ type: "PONG" }));
						return;
					}

					if (message.type === "SESSION_INFO") {
						if (message.payload.pinCode) pinCode = message.payload.pinCode;
						if (typeof message.payload.locked === "boolean") locked = message.payload.locked;
						if (message.payload.sessionId) sessionId = message.payload.sessionId;
						if (message.payload.quizName) quizName = message.payload.quizName;
						if (Array.isArray(message.payload.players)) players = message.payload.players;
					} else if (message.type === "PLAYER_JOINED") {
						if (!players.some((p) => p.id === message.payload.id))
							players = [...players, message.payload];
					} else if (message.type === "PLAYER_LEFT") {
						players = players.filter((p) => p.id !== message.payload.id);
					} else if (message.type === "PLAYER_HEALTH_UPDATE") {
						players = players.map((p) =>
							p.id === message.payload.id
								? { ...p, failingHeartbeat: message.payload.failingHeartbeat }
								: p
						);
					} else if (message.type === "QUESTION_PREVIEW") {
						gameState = "preview";
						currentQuestionPayload = message.payload;
						timerServerTime = message.serverTime;
						timerDurationMs = message.durationMs;
						responseCount = 0;
						resultsBreakdown = {};
					} else if (message.type === "QUESTION_ACTIVE") {
						gameState = "active";
						currentQuestionPayload = message.payload;
						timerServerTime = message.serverTime;
						timerDurationMs = message.durationMs;
					} else if (message.type === "RESPONSES_UPDATE") {
						responseCount = message.count;
					} else if (message.type === "RESULTS") {
						gameState = "results";
						resultsBreakdown = message.breakdown || {};
						currentQuestionPayload = message.payload;
					} else if (message.type === "LEADERBOARD") {
						gameState = "leaderboard";
						leaderboardData = message.payload;
					} else if (message.type === "FINISHED") {
						gameState = "finished";
						leaderboardData = message.payload;
					} else if (message.type === "SYNC_STATE") {
						gameState = message.phase;
						currentQuestionPayload = message.payload;
						if (message.resultsBreakdown) resultsBreakdown = message.resultsBreakdown;
						if (message.leaderboard) leaderboardData = message.leaderboard;
						if (message.responseCount) responseCount = message.responseCount;
					}
				} catch (e) {
					console.error("[Quiz Presenter] Failed to parse message:", e);
				}
			};

			ws.onclose = (event) => {
				if (isIntentionallyClosed) return;
				if (event.code === 4003 || event.reason.includes("403"))
					return goto(`/manage/${quizId}/no_access`);
				if (event.code === 4004 || event.reason.includes("404")) throw error(404, "Quiz not found");

				loading = true;
				const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
				reconnectAttempts++;
				console.log(`[Quiz Presenter] Connection lost. Reconnecting in ${delay}ms...`);
				reconnectTimeout = setTimeout(connectWebSocket, delay);
			};
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				if (
					!socket ||
					socket.readyState === WebSocket.CLOSED ||
					socket.readyState === WebSocket.CLOSING
				)
					connectWebSocket();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			isIntentionallyClosed = true;
			clearTimeout(reconnectTimeout);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (socket) socket.close();
		};
	});

	function toggleLock() {
		if (!socket || socket.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({ type: locked ? "UNLOCK_SESSION" : "LOCK_SESSION" }));
	}
	function removePlayer(playerId: string) {
		players = players.filter((p) => p.id !== playerId);
		if (socket && socket.readyState === WebSocket.OPEN)
			socket.send(JSON.stringify({ type: "REMOVE_PLAYER", payload: { playerId } }));
	}
	function startQuiz() {
		if (socket && socket.readyState === WebSocket.OPEN)
			socket.send(JSON.stringify({ type: "START_SESSION" }));
	}
	function nextPhase() {
		if (socket && socket.readyState === WebSocket.OPEN)
			socket.send(JSON.stringify({ type: "NEXT_PHASE" }));
	}
	function stopPresentation() {
		isIntentionallyClosed = true;
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: "STOP_SESSION" }));
			socket.close(1000, "Intentional Stop");
		}
	}
	function toggleAutoMode() {
		autoMode = !autoMode;
	}

	return {
		get loading() {
			return loading;
		},
		get errorCode() {
			return errorCode;
		},
		get pinCode() {
			return pinCode;
		},
		get locked() {
			return locked;
		},
		get sessionId() {
			return sessionId;
		},
		get quizName() {
			return quizName;
		},
		get players() {
			return players;
		},
		get gameState() {
			return gameState;
		},
		get currentQuestionPayload() {
			return currentQuestionPayload;
		},
		get timerServerTime() {
			return timerServerTime;
		},
		get timerDurationMs() {
			return timerDurationMs;
		},
		get responseCount() {
			return responseCount;
		},
		get resultsBreakdown() {
			return resultsBreakdown;
		},
		get leaderboardData() {
			return leaderboardData;
		},
		get autoMode() {
			return autoMode;
		},
		get autoTimerRemaining() {
			return autoTimerRemaining;
		},
		toggleLock,
		removePlayer,
		startQuiz,
		nextPhase,
		stopPresentation,
		toggleAutoMode
	};
}
