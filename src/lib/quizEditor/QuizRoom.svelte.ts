import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { goto } from "$app/navigation";
import { error } from "@sveltejs/kit";

const USER_COLORS = [
	"#f43f5e",
	"#ec4899",
	"#d946ef",
	"#a855f7",
	"#8b5cf6",
	"#6366f1",
	"#3b82f6",
	"#0ea5e9",
	"#06b6d4",
	"#14b8a6",
	"#10b981",
	"#84cc16"
];

function getRandomUserColor() {
	return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

export function QuizRoom(getQuizId: () => string) {
	let doc = new Y.Doc();
	let loading = $state(true);
	let socket = $state<WebSocket | null>(null);

	const awareness = new awarenessProtocol.Awareness(doc);
	const quizMeta = doc.getMap<string>("quizMeta");
	const questionsArray = doc.getArray<Y.Map<any>>("questions");

	let quizName = $state<string>("NAME");
	let questions = $state<any[]>([]);
	let activeUsers = $state<Map<number, any>>(new Map());

	$effect(() => {
		const quizId = getQuizId();
		if (!quizId) return;

		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;
		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";

		const httpUrl = `${PUBLIC_BACKEND_URL}/websockets/quiz/${quizId}`;
		const wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/${quizId}`;

		let isIntentionallyClosed = false;
		let reconnectTimeout: ReturnType<typeof setTimeout>;
		let reconnectAttempts = 0;

		fetch(httpUrl, { credentials: "include" })
			.then((res) => {
				if (res.status === 403) return goto(`/manage/${quizId}/no_access`);
				if (res.status === 404) return goto(`/manage/${quizId}/not_found`, { replaceState: true });
				connectWebSocket();
			})
			.catch((err) => {
				console.error("[Quiz Editor] Pre-flight fetch error:", err);
				connectWebSocket();
			});

		function connectWebSocket() {
			if (isIntentionallyClosed) return;

			const ws = new WebSocket(wsUrl);
			ws.binaryType = "arraybuffer";
			socket = ws;

			ws.onopen = () => {
				console.log("[Quiz Editor] Connected to YJS room");
				loading = false;
				reconnectAttempts = 0;

				const currentState = awareness.getLocalState() || {};
				if (!currentState?.user?.userId) {
					awareness.setLocalState({
						...currentState,
						user: {
							name: "User_" + Math.floor(Math.random() * 899 + 100),
							color: getRandomUserColor(),
							userId: null,
							avatarUrl: null
						},
						activeQuestionId: null,
						focusedField: null,
						cursor: null,
						isFocused: document.hasFocus()
					});
				}

				const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, [doc.clientID]);
				const message = new Uint8Array(1 + awarenessUpdate.length);
				message[0] = 1;
				message.set(awarenessUpdate, 1);
				ws.send(message);
			};

			ws.onmessage = (event) => {
				const data = new Uint8Array(event.data);
				if (data.length === 0) return;

				const messageType = data[0];
				const payload = data.subarray(1);

				if (messageType === 0) {
					Y.applyUpdate(doc, payload);
				} else if (messageType === 1) {
					awarenessProtocol.applyAwarenessUpdate(awareness, payload, "remote");
				} else if (messageType === 2) {
					// 2 = Ping from server, reply with 3 = Pong
					ws.send(new Uint8Array([3]));
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

				// Exponential backoff reconnect
				loading = true;
				const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
				reconnectAttempts++;
				console.log(`[Quiz Editor] Connection lost. Reconnecting in ${delay}ms...`);
				reconnectTimeout = setTimeout(connectWebSocket, delay);
			};

			// Bind doc and awareness updates specifically to THIS active websocket
			const docUpdateHandler = (update: Uint8Array) => {
				if (ws.readyState === WebSocket.OPEN) {
					const message = new Uint8Array(1 + update.length);
					message[0] = 0;
					message.set(update, 1);
					ws.send(message);
				}
			};

			const awarenessUpdateHandler = ({ added, updated, removed }: any) => {
				const changedClients = [...added, ...updated, ...removed];
				const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);

				if (ws.readyState === WebSocket.OPEN) {
					const message = new Uint8Array(1 + awarenessUpdate.length);
					message[0] = 1;
					message.set(awarenessUpdate, 1);
					ws.send(message);
				}
			};

			doc.on("update", docUpdateHandler);
			awareness.on("update", awarenessUpdateHandler);

			// Internal cleanup to unbind events when this specific WS closes
			ws.addEventListener("close", () => {
				doc.off("update", docUpdateHandler);
				awareness.off("update", awarenessUpdateHandler);
			});
		}

		const syncState = () => {
			quizName = quizMeta.get("name") || "Untitled Quiz";
			questions = questionsArray.toArray().map((qMap) => qMap.toJSON());
		};

		quizMeta.observe(syncState);
		questionsArray.observeDeep(syncState);
		syncState();

		const syncAwarenessState = () => {
			activeUsers = new Map(awareness.getStates() as Map<number, any>);
		};
		awareness.on("change", syncAwarenessState);

		return () => {
			isIntentionallyClosed = true;
			clearTimeout(reconnectTimeout);
			doc.off("update", syncState);
			awareness.off("update", syncAwarenessState);
			awareness.off("change", syncAwarenessState);
			awarenessProtocol.removeAwarenessStates(awareness, [doc.clientID], "client closed");
			if (socket) socket.close();
		};
	});

	function updatePresence(updates: Record<string, any>) {
		const currentState = awareness.getLocalState() || {};
		awareness.setLocalState({
			...currentState,
			...updates
		});
	}

	function updateQuizName(newName: string) {
		quizMeta.set("name", newName);
	}

	function addQuestion(newQuestion: Record<string, any>) {
		doc.transact(() => {
			const qMap = new Y.Map();
			for (const [key, value] of Object.entries(newQuestion)) {
				qMap.set(key, value);
			}
			questionsArray.push([qMap]);
		});
	}

	function updateQuestion(questionId: string | number, updates: Record<string, any>) {
		doc.transact(() => {
			const targetMap = questionsArray.toArray().find((q) => q.get("id") === questionId);
			if (targetMap) {
				for (const [key, value] of Object.entries(updates)) {
					targetMap.set(key, value);
				}
			}
		});
	}

	function deleteQuestion(questionId: string | number) {
		doc.transact(() => {
			const targetIndex = questionsArray.toArray().findIndex((q) => q.get("id") === questionId);
			if (targetIndex !== -1) {
				questionsArray.delete(targetIndex, 1);
			}
		});
	}

	return {
		get doc() {
			return doc;
		},
		get loading() {
			return loading;
		},
		get socket() {
			return socket;
		},
		get quizName() {
			return quizName;
		},
		get questions() {
			return questions;
		},
		get activeUsers() {
			return activeUsers;
		},
		get awareness() {
			return awareness;
		},
		updatePresence,
		updateQuizName,
		addQuestion,
		updateQuestion,
		deleteQuestion
	};
}
