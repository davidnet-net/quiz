<!-- src/routes/join/+page.svelte -->
<script lang="ts">
	import {
		appState,
		Button,
		Field,
		Flex,
		type iconType,
		navigateBack,
		TextField,
		toast
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import CodeInput from "$lib/components/CodeInput/CodeInput.svelte";
	import PlayerQuestion from "$lib/components/QuizPlayer/PlayerQuestion.svelte";
	import * as m from "$lib/paraglide/messages.js";

	let step = $state<
		| "pin"
		| "nickname"
		| "waiting"
		| "preview"
		| "active"
		| "answered"
		| "results"
		| "leaderboard"
		| "finished"
	>("pin");
	let pinCode = $state("");
	let nickname = $state("");
	let loading = $state(false);
	let socket = $state<WebSocket | null>(null);

	let reconnectAttempts = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout>;
	let isIntentionallyClosed = false;
	let participantId = $state<string | null>(null);

	let currentQuestionPayload = $state<any>(null);
	let timerServerTime = $state(0);
	let timerDurationMs = $state(0);
	let remainingTimeMs = $state(0);

	let personalResult = $state<{ correct: boolean; pointsEarned: number } | null>(null);
	let currentLeaderboard = $state<any[]>([]);

	$effect(() => {
		if (step === "preview" || step === "active") {
			const networkDelay = Math.max(0, Date.now() - timerServerTime);
			const target = Date.now() + (timerDurationMs - networkDelay);
			let frame: number;
			const update = () => {
				remainingTimeMs = Math.max(0, target - Date.now());
				if (remainingTimeMs > 0 && step === "active") {
					frame = requestAnimationFrame(update);
				} else if (remainingTimeMs === 0 && step === "active") {
					step = "answered";
				}
			};
			update();
			return () => cancelAnimationFrame(frame);
		}
	});

	$effect(() => {
		if (pinCode.length === 6 && step === "pin" && !loading) verifyPin(pinCode);
	});

	$effect(() => {
		appState.hideNavigation = true;
		const queryPin = page.url.searchParams.get("pin") || page.url.searchParams.get("code");
		if (queryPin && queryPin.length === 6 && step === "pin") {
			pinCode = queryPin;
			verifyPin(queryPin);
		}
	});

	$effect(() => {
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible") {
				if (step !== "pin" && step !== "nickname" && pinCode.length === 6) {
					if (!socket || socket.readyState !== WebSocket.OPEN) connectAndJoin(true);
				}
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	});

	async function verifyPin(code: string) {
		if (code.length !== 6) return;
		loading = true;
		try {
			const rawUrl = PUBLIC_BACKEND_URL.includes("://")
				? PUBLIC_BACKEND_URL
				: `http://${PUBLIC_BACKEND_URL}`;
			const res = await fetch(`${rawUrl}/websockets/quiz/play/${code}`);
			const data = await res.json();
			if (!res.ok) {
				toast(
					m.page_join_toast_invalid_pin_title(),
					data.error || m.page_join_toast_invalid_pin_content(),
					"warning",
					5000,
					"danger"
				);
				loading = false;
				pinCode = "";
				return;
			}
			pinCode = code;
			step = "nickname";
		} catch (e) {
			toast(
				m.page_join_toast_connection_error_title(),
				m.page_join_toast_connection_error_content(),
				"wifi_off",
				5000,
				"danger"
			);
			pinCode = "";
		} finally {
			loading = false;
		}
	}

	function resetToPinState(message: string, icon: iconType = "error") {
		toast(m.page_join_toast_disconnected_title(), message, icon, 5000, "danger");
		isIntentionallyClosed = true;
		if (socket) socket.close();
		step = "pin";
		pinCode = "";
		nickname = "";
		participantId = null;
	}

	function connectAndJoin(isReconnect = false) {
		if (
			socket &&
			(socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)
		)
			return;
		clearTimeout(reconnectTimeout);

		const trimmedNickname = nickname.trim();
		if (!trimmedNickname && !isReconnect) {
			toast(
				m.page_join_toast_missing_nickname_title(),
				m.page_join_toast_missing_nickname_content(),
				"person",
				4000,
				"danger"
			);
			return;
		}

		isIntentionallyClosed = false;
		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;
		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";

		let wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/play/${pinCode}`;
		if (participantId) wsUrl += `?participantId=${encodeURIComponent(participantId)}`;

		const ws = new WebSocket(wsUrl);
		socket = ws;

		ws.onopen = () => {
			clearTimeout(reconnectTimeout);
			reconnectAttempts = 0;
			ws.send(JSON.stringify({ type: "JOIN_NICKNAME", nickname: trimmedNickname, participantId }));
		};

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				if (message.type === "PING") {
					ws.send(JSON.stringify({ type: "PONG" }));
				} else if (message.type === "JOINED_SUCCESS") {
					participantId = message.payload.id;
					if (step === "nickname") step = "waiting";
				} else if (message.type === "KICKED" || message.type === "SESSION_TERMINATED") {
					resetToPinState(message.message || m.page_join_toast_kicked_message(), "block");
				} else if (message.type === "ERROR") {
					toast(m.common_error_title(), message.message, "error", 5000, "danger");
					ws.close();
				} else if (message.type === "QUESTION_PREVIEW") {
					step = "preview";
					currentQuestionPayload = message.payload;
					timerServerTime = message.serverTime;
					timerDurationMs = message.durationMs;
				} else if (message.type === "QUESTION_ACTIVE") {
					step = "active";
					currentQuestionPayload = message.payload;
					timerServerTime = message.serverTime;
					timerDurationMs = message.durationMs;
				} else if (message.type === "ANSWER_ACK") {
					step = "answered";
				} else if (message.type === "RESULTS") {
					step = "results";
					personalResult = message.payload;
				} else if (message.type === "LEADERBOARD") {
					step = "leaderboard";
					currentLeaderboard = message.payload;
				} else if (message.type === "FINISHED") {
					step = "finished";
					currentLeaderboard = message.payload;
				}
			} catch (e) {
				console.error("WS error:", e);
			}
		};

		ws.onclose = (event) => {
			if (isIntentionallyClosed) return;
			if (event.code === 4000 || event.code === 4001)
				return resetToPinState(m.page_join_toast_removed_other_tab(), "block");

			if (step !== "pin" && step !== "nickname") {
				if (reconnectAttempts >= 15) return resetToPinState(m.page_join_toast_lost_connection());
				const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 5000);
				reconnectAttempts++;
				toast(m.page_join_toast_connection_lost_title(), m.page_join_toast_reconnecting(), "sync", 3000, "warning");
				clearTimeout(reconnectTimeout);
				reconnectTimeout = setTimeout(() => connectAndJoin(true), delay);
			}
		};
	}

	async function leaveSession() {
		isIntentionallyClosed = true;
		clearTimeout(reconnectTimeout);
		const idToLeave = participantId;
		step = "pin";
		pinCode = "";
		nickname = "";
		participantId = null;
		if (socket) socket.close(1000, "Intentional Leave");
		if (idToLeave) {
			try {
				const rawUrl = PUBLIC_BACKEND_URL.includes("://")
					? PUBLIC_BACKEND_URL
					: `http://${PUBLIC_BACKEND_URL}`;
				await fetch(`${rawUrl}/websockets/quiz/play/leave/${idToLeave}`, { method: "POST" });
			} catch (e) {
				console.error("Failed to notify server of leave:", e);
			}
		}
	}

	function handlePlayerSubmit(answer: Record<string, any>) {
		if (socket && socket.readyState === WebSocket.OPEN && step === "active") {
			socket.send(JSON.stringify({ type: "SUBMIT_ANSWER", ...answer }));
		}
	}

	const NEUTRAL_RESULT_TYPES = new Set(["poll", "scale", "word_cloud", "information"]);
	let isNeutralResultType = $derived(
		NEUTRAL_RESULT_TYPES.has(currentQuestionPayload?.question?.type)
	);
</script>

<Flex
	justifyContent="center"
	alignItems="center"
	direction="column"
	gap="medium"
	text="center"
	padding={step === "active" ? "none" : "giant"}
	style={step === "active" ||
	step === "answered" ||
	step === "results" ||
	step === "leaderboard" ||
	step === "finished"
		? "height: 100dvh;"
		: ""}>
	{#if step === "pin"}
		<div>
			<h1>{m.page_join_heading()}</h1>
			<p style="color: {token.theme.color.text.secondary}">
				{m.page_join_pin_instructions()}
			</p>
		</div>
		<CodeInput bind:value={pinCode} />
		<Button iconbefore="arrow_back" onclick={() => navigateBack()}>{m.common_back()}</Button>
	{:else if step === "nickname"}
		<Flex
			width="fit-content"
			height="fit-content"
			direction="column"
			gap="medium"
			text="left"
			padding="giant">
			<div>
				<h1>{m.page_join_nickname_heading()}</h1>
				<p style="color: {token.theme.color.text.secondary}">{m.page_join_nickname_subheading()}</p>
			</div>
			<div style="width: 280px; max-width: 100%;">
				<Field label={m.page_join_nickname_label()} name="nickname" required>
					<TextField
						bind:value={nickname}
						placeholder={m.page_join_nickname_placeholder()}
						maxlength={35} />
				</Field>
			</div>
			<Flex gap="small" width="fit-content" justifyContent="end">
				<Button appearance="primary" onclick={() => connectAndJoin(false)} {loading}
					>{m.page_join_join_button()}</Button>
				<Button
					appearance="default"
					onclick={() => {
						step = "pin";
						pinCode = "";
					}}>
					{m.common_back()}
				</Button>
			</Flex>
		</Flex>
	{:else if step === "waiting"}
		<div>
			<h1>{m.page_join_waiting_heading()}</h1>
			<h2 style="color: {token.theme.color.text.secondary}">
				{m.page_join_waiting_subheading()}
			</h2>
		</div>
		<p style="font-weight: bold; font-size: 1.25rem;">{m.page_join_nickname_display({ nickname })}</p>
		<Button appearance="danger" onclick={leaveSession}>{m.page_join_leave_quiz()}</Button>
	{:else if step === "preview"}
		<h1 style="font-size: 4rem; margin: 0;">{m.page_join_preview_heading()}</h1>
		{#if currentQuestionPayload?.question?.pointsMultiplier > 1}
			<h2 style="color: var(--color-danger); font-size: 2rem;">{m.page_join_double_points()}</h2>
		{/if}
	{:else if step === "active"}
		<div style="width: 100%; padding: 1rem; box-sizing: border-box; ">
			<h2 style="margin: 0; font-size: 2rem;">
				{m.page_join_time_left()} <span style="color: {token.theme.color.text.primary}">
					{Math.ceil(remainingTimeMs / 1000)}s
				</span>
			</h2>
		</div>
		<Flex style="flex: 1; width: 100%;" alignItems="stretch">
			{#if currentQuestionPayload}
				<PlayerQuestion payload={currentQuestionPayload} onsubmit={handlePlayerSubmit} />
			{/if}
		</Flex>
	{:else if step === "answered"}
		<h1 style="font-size: 3rem;">
			{currentQuestionPayload?.question?.type === "information"
				? m.page_join_answered_information()
				: m.page_join_answered_default()}
		</h1>
		<h2 style="color: {token.theme.color.text.secondary}">{m.page_join_waiting_others()}</h2>
	{:else if step === "results"}
		{#if isNeutralResultType}
			<div
				style="width: 100%; height: 100%; background-color: {token.theme.color.surface.raised
					.normal}; display: flex; flex-direction: column; justify-content: center; align-items: center;">
				<h1 style="font-size: 3rem; margin: 0;">{m.page_join_results_thanks()}</h1>
				<h2 style="color: {token.theme.color.text.secondary}; margin: 10px 0;">
					{m.page_join_results_look_at_screen()}
				</h2>
			</div>
		{:else}
			<div
				style="width: 100%; height: 100%; background-color: {personalResult?.correct
					? 'var(--color-success)'
					: 'var(--color-danger)'}; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white;">
				<h1 style="font-size: 4rem; margin: 0;">
					{personalResult?.correct ? m.page_join_results_correct() : m.page_join_results_incorrect()}
				</h1>
				{#if personalResult?.correct}
					<h2 style="font-size: 2rem; margin: 10px 0;">
						{m.page_join_results_points({ points: personalResult.pointsEarned })}
					</h2>
				{/if}
			</div>
		{/if}
	{:else if step === "leaderboard"}
		{@const myRankIndex = currentLeaderboard.findIndex((p) => p.id === participantId)}
		<h1 style="font-size: 3rem;">{m.page_join_leaderboard_heading()}</h1>
		<h2 style="color: {token.theme.color.text.secondary}">
			{myRankIndex >= 0
				? m.page_join_leaderboard_rank({
						rank: myRankIndex + 1,
						ordinal: myRankIndex === 0 ? "st" : myRankIndex === 1 ? "nd" : myRankIndex === 2 ? "rd" : "th"
					})
				: m.page_join_leaderboard_not_top5()}
		</h2>
	{:else if step === "finished"}
		{@const finalRankIndex = currentLeaderboard.findIndex((p) => p.id === participantId)}
		<h1 style="font-size: 4rem;">{m.page_join_finished_heading()}</h1>
		<h2 style="color: {token.theme.color.text.primary}">
			{finalRankIndex >= 0
				? m.page_join_finished_rank({
						rank: finalRankIndex + 1,
						ordinal:
							finalRankIndex === 0 ? "st" : finalRankIndex === 1 ? "nd" : finalRankIndex === 2 ? "rd" : "th"
					})
				: ""}
		</h2>
		<Button appearance="primary" onclick={leaveSession}>{m.page_join_leave_quiz_caps()}</Button>
	{/if}
</Flex>
