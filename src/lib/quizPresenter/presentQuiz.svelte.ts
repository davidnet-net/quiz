// src/lib/quizPresenter/presentQuiz.svelte.ts
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
	let hostConnectionId = $state<string | null>(null);
	let isIntentionallyClosed = false;

	$effect(() => {
		const quizId = getQuizId();
		if (!quizId) return;

		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;
		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";

		const httpUrl = `${PUBLIC_BACKEND_URL}/websockets/quiz/present/${quizId}`;
		const wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/present/${quizId}`;

		let reconnectTimeout: ReturnType<typeof setTimeout>;
		let reconnectAttempts = 0;

		fetch(httpUrl, { credentials: "include" })
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
				connectWebSocket();
			})
			.catch((err) => {
				console.error("[Quiz Presenter] Pre-flight fetch error:", err);
				if (err?.status) throw err;
				connectWebSocket();
			});

		function connectWebSocket() {
			if (isIntentionallyClosed) return;

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
						ws.send(JSON.stringify({ type: "PONG", connectionId: hostConnectionId }));
						return;
					}

					if (message.type === "SESSION_INFO") {
						if (message.payload.pinCode) pinCode = message.payload.pinCode;
						if (typeof message.payload.locked === "boolean") locked = message.payload.locked;
						if (message.payload.sessionId) sessionId = message.payload.sessionId;
						if (message.payload.connectionId) hostConnectionId = message.payload.connectionId;
						if (Array.isArray(message.payload.players)) {
							players = message.payload.players;
						}
					} else if (message.type === "PLAYER_JOINED") {
						if (!players.some((p) => p.id === message.payload.id)) {
							players = [...players, message.payload];
						}
					} else if (message.type === "PLAYER_LEFT") {
						players = players.filter((p) => p.id !== message.payload.id);
					} else if (message.type === "PLAYER_HEALTH_UPDATE") {
						players = players.map((p) =>
							p.id === message.payload.id
								? { ...p, failingHeartbeat: message.payload.failingHeartbeat }
								: p
						);
					}
				} catch (e) {
					console.error("[Quiz Presenter] Failed to parse message:", e);
				}
			};

			ws.onclose = (event) => {
				if (isIntentionallyClosed) return;

				if (event.code === 4003 || event.reason.includes("403")) {
					return goto(`/manage/${quizId}/no_access`);
				}
				if (event.code === 4004 || event.reason.includes("404")) {
					throw error(404, "Quiz not found");
				}

				loading = true;
				const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
				reconnectAttempts++;
				console.log(`[Quiz Presenter] Connection lost. Reconnecting in ${delay}ms...`);
				reconnectTimeout = setTimeout(connectWebSocket, delay);
			};
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				if (!socket || socket.readyState !== WebSocket.OPEN) {
					connectWebSocket();
				}
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
		const type = locked ? "UNLOCK_SESSION" : "LOCK_SESSION";
		socket.send(JSON.stringify({ type }));
	}

	function removePlayer(playerId: string) {
		players = players.filter((p) => p.id !== playerId);
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: "REMOVE_PLAYER", payload: { playerId } }));
		}
	}

	function stopPresentation() {
		isIntentionallyClosed = true;
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: "STOP_SESSION" }));
			socket.close(1000, "Intentional Stop");
		}
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
		toggleLock,
		removePlayer,
		stopPresentation
	};
}
