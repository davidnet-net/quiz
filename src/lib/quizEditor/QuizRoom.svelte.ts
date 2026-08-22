import * as Y from "yjs";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

export function QuizRoom(getQuizId: () => string) {
	let doc = new Y.Doc();
	let loading = $state(true);
	let socket = $state<WebSocket | null>(null);

	// 1. Define Yjs Shared Types
	// quizMeta: Stores flat properties like name, status, time limits
	const quizMeta = doc.getMap<string>("quizMeta");
	// questionsArray: Stores an array of Y.Maps (each Y.Map represents a question)
	const questionsArray = doc.getArray<Y.Map<any>>("questions");

	// 2. Reactive Svelte states for the UI to consume
	let quizName = $state<string>("NAME");
	let questions = $state<any[]>([]);

	$effect(() => {
		const quizId = getQuizId();
		if (!quizId) return;

		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;

		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/${quizId}`;

		const ws = new WebSocket(wsUrl);
		ws.binaryType = "arraybuffer";
		socket = ws;

		ws.onopen = () => {
			console.log("[Quiz Editor] Connected to YJS room");
			loading = false;
		};

		ws.onmessage = (event) => {
			const update = new Uint8Array(event.data);
			Y.applyUpdate(doc, update);
		};

		const updateHandler = (update: Uint8Array) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(new Uint8Array(update));
			}
		};

		doc.on("update", updateHandler);

		// 3. Sync Yjs data to Svelte reactive state
		const syncState = () => {
			quizName = quizMeta.get("name") || "Untitled Quiz";
			// Convert the array of Y.Maps into a standard array of JS objects for Svelte to render
			questions = questionsArray.toArray().map((qMap) => qMap.toJSON());
		};

		// Observe changes to the metadata map and DEEP changes to the questions array
		quizMeta.observe(syncState);
		questionsArray.observeDeep(syncState);

		// Initial sync
		syncState();

		return () => {
			doc.off("update", updateHandler);
			ws.close();
		};
	});

	// --- MUTATION HELPERS ---

	function updateQuizName(newName: string) {
		quizMeta.set("name", newName);
	}

	function addQuestion(newQuestion: Record<string, any>) {
		doc.transact(() => {
			const qMap = new Y.Map();
			// Populate the Y.Map with the new question properties
			for (const [key, value] of Object.entries(newQuestion)) {
				qMap.set(key, value);
			}
			questionsArray.push([qMap]);
		});
	}

	function updateQuestion(questionId: string | number, updates: Record<string, any>) {
		doc.transact(() => {
			// Find the exact Y.Map for the target question
			const targetMap = questionsArray.toArray().find((q) => q.get("id") === questionId);
			if (targetMap) {
				// Apply specific field updates
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
		updateQuizName,
		addQuestion,
		updateQuestion,
		deleteQuestion
	};
}
