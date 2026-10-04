// QuizRoom.svelte.ts
import { error } from "@sveltejs/kit";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";

import { goto } from "$app/navigation";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

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

const LOADING_UI_DELAY_MS = 5000;

export function QuizRoom(getQuizId: () => string) {
	const doc = new Y.Doc();
	// Raw connection state is tracked separately from `showLoading` (the only
	// one actually exposed): once the room has connected at least once, a
	// disconnect/reconnect only flips `showLoading` on if it's still ongoing
	// after LOADING_UI_DELAY_MS, so brief reconnects don't blank the page --
	// the already-synced Yjs doc keeps rendering while it reconnects quietly.
	let showLoading = $state(true);
	let socket = $state<WebSocket | null>(null);

	const awareness = new awarenessProtocol.Awareness(doc);
	const quizMeta = doc.getMap<string>("quizMeta");
	const questionsArray = doc.getArray<Y.Map<any>>("questions");

	let quizName = $state("NAME");
	let quizTeamId = $state<string | undefined>(undefined);
	let quizWorkspaceId = $state<string | undefined>(undefined);
	let questions = $state<any[]>([]);
	let activeUsers = $state(new Map());

	$effect(() => {
		const quizId = getQuizId();
		if (!quizId) return;

		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;
		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";

		const httpUrl = `${PUBLIC_BACKEND_URL}/websockets/quiz/edit/${quizId}`;
		const wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/edit/${quizId}`;

		let isIntentionallyClosed = false;
		let reconnectTimeout: ReturnType<typeof setTimeout>;
		let reconnectAttempts = 0;

		let isConnected = false;
		let hasLoadedOnce = false;
		let loadingDelayTimer: ReturnType<typeof setTimeout> | null = null;

		function setConnected(connected: boolean) {
			isConnected = connected;

			if (connected) {
				hasLoadedOnce = true;
				if (loadingDelayTimer) {
					clearTimeout(loadingDelayTimer);
					loadingDelayTimer = null;
				}
				showLoading = false;
				return;
			}

			if (!hasLoadedOnce) {
				// Nothing cached to fall back on yet: show loading right away.
				showLoading = true;
				return;
			}

			if (!loadingDelayTimer) {
				loadingDelayTimer = setTimeout(() => {
					loadingDelayTimer = null;
					if (!isConnected) showLoading = true;
				}, LOADING_UI_DELAY_MS);
			}
		}

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
				setConnected(true);
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

				setConnected(false);
				const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
				reconnectAttempts++;
				console.log(`[Quiz Editor] Connection lost. Reconnecting in ${delay}ms...`);
				reconnectTimeout = setTimeout(connectWebSocket, delay);
			};

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

			ws.addEventListener("close", () => {
				doc.off("update", docUpdateHandler);
				awareness.off("update", awarenessUpdateHandler);
			});
		}

		const syncState = () => {
			quizName = quizMeta.get("name") || "Loading...";
			quizTeamId = quizMeta.get("teamId") || undefined;
			quizWorkspaceId = quizMeta.get("workspaceId") || undefined;
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
			if (loadingDelayTimer) clearTimeout(loadingDelayTimer);
			doc.off("update", syncState);
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

	/**
	 * Moves a question to `newIndex`, interpreted as its desired index in the
	 * resulting array (i.e. after the question has been removed from its old slot).
	 *
	 * A Y type can only ever be integrated into the document once, so the old
	 * Y.Map can't be deleted and then re-inserted — that silently empties it.
	 * Instead, clone its entries into a fresh Y.Map and swap that in.
	 */
	function moveQuestion(questionId: string | number, newIndex: number) {
		doc.transact(() => {
			const arr = questionsArray.toArray();
			const fromIndex = arr.findIndex((q) => q.get("id") === questionId);
			if (fromIndex === -1) return;

			const clampedIndex = Math.max(0, Math.min(newIndex, arr.length - 1));
			if (clampedIndex === fromIndex) return;

			const oldMap = arr[fromIndex];
			const newMap = new Y.Map();
			oldMap.forEach((value, key) => {
				newMap.set(key, value);
			});

			questionsArray.delete(fromIndex, 1);
			questionsArray.insert(clampedIndex, [newMap]);
		});
	}

	return {
		get doc() {
			return doc;
		},
		get loading() {
			return showLoading;
		},
		get socket() {
			return socket;
		},
		get quizName() {
			return quizName;
		},
		get quizTeamId() {
			return quizTeamId;
		},
		get quizWorkspaceId() {
			return quizWorkspaceId;
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
		deleteQuestion,
		moveQuestion
	};
}
