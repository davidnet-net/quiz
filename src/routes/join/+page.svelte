<!-- src/routes/join/+page.svelte -->
<script lang="ts">
	import {
		appState,
		Button,
		Flex,
		Field,
		TextField,
		navigateBack,
		toast,
		type iconType
	} from "@davidnet-net/svelte-ui";
	import CodeInput from "$lib/components/CodeInput/CodeInput.svelte";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import PlayerQuestion from "$lib/components/QuizPlayer/PlayerQuestion.svelte";

	let step = $state<"pin" | "nickname" | "waiting" | "preview" | "active">("pin");
	let pinCode = $state("");
	let nickname = $state("");
	let loading = $state(false);
	let socket = $state<WebSocket | null>(null);

	let reconnectAttempts = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout>;
	let isIntentionallyClosed = false;
	let participantId = $state<string | null>(null);

	// Track active game payloads and times
	let currentQuestionPayload = $state<any>(null);
	let timerServerTime = $state(0);
	let timerDurationMs = $state(0);
	let remainingTimeMs = $state(0);

	// Player Server-relative timer sync
	$effect(() => {
		if (step === "preview" || step === "active") {
			const networkDelay = Math.max(0, Date.now() - timerServerTime);
			const target = Date.now() + (timerDurationMs - networkDelay);

			let frame: number;
			const update = () => {
				remainingTimeMs = Math.max(0, target - Date.now());
				if (remainingTimeMs > 0) frame = requestAnimationFrame(update);
			};

			update();
			return () => cancelAnimationFrame(frame);
		}
	});

	$effect(() => {
		if (pinCode.length === 6 && step === "pin" && !loading) {
			verifyPin(pinCode);
		}
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
					if (!socket || socket.readyState !== WebSocket.OPEN) {
						connectAndJoin(true);
					}
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
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
					"Invalid PIN",
					data.error || "Please check the code and try again.",
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
			toast("Connection Error", "Failed to connect to server.", "wifi_off", 5000, "danger");
			pinCode = "";
		} finally {
			loading = false;
		}
	}

	function resetToPinState(message: string, icon: iconType = "error") {
		toast("Disconnected", message, icon, 5000, "danger");
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
		) {
			return;
		}

		clearTimeout(reconnectTimeout);

		const trimmedNickname = nickname.trim();
		if (!trimmedNickname && !isReconnect) {
			toast("Missing Nickname", "Please enter a nickname to join.", "person", 4000, "danger");
			return;
		}
		if (trimmedNickname.length > 35) {
			toast("Too Long", "Nickname cannot exceed 35 characters.", "warning", 4000, "danger");
			return;
		}

		isIntentionallyClosed = false;
		const rawUrl = PUBLIC_BACKEND_URL.includes("://")
			? PUBLIC_BACKEND_URL
			: `http://${PUBLIC_BACKEND_URL}`;
		const parsedUrl = new URL(rawUrl);
		const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";

		let wsUrl = `${wsProtocol}//${parsedUrl.host}/websockets/quiz/play/${pinCode}`;
		if (participantId) {
			wsUrl += `?participantId=${encodeURIComponent(participantId)}`;
		}

		const ws = new WebSocket(wsUrl);
		socket = ws;

		ws.onopen = () => {
			clearTimeout(reconnectTimeout);
			reconnectAttempts = 0;
			ws.send(
				JSON.stringify({
					type: "JOIN_NICKNAME",
					nickname: trimmedNickname,
					participantId: participantId
				})
			);
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
					resetToPinState(message.message || "You have been removed by the host.", "block");
				} else if (message.type === "ERROR") {
					toast("Error", message.message, "error", 5000, "danger");
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
				}
			} catch (e) {
				console.error("WS error:", e);
			}
		};

		ws.onclose = (event) => {
			if (isIntentionallyClosed) return;

			if (event.code === 4000 || event.code === 4001) {
				resetToPinState("You were removed or joined from another tab.", "block");
				return;
			}

			if (step !== "pin" && step !== "nickname") {
				if (reconnectAttempts >= 15) {
					resetToPinState("Lost connection to the session completely.");
					return;
				}
				const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 5000);
				reconnectAttempts++;
				toast(
					"Connection Lost",
					`Reconnecting... (Attempt ${reconnectAttempts})`,
					"sync",
					3000,
					"warning"
				);
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

		if (socket) {
			socket.close(1000, "Intentional Leave");
		}

		if (idToLeave) {
			try {
				const rawUrl = PUBLIC_BACKEND_URL.includes("://")
					? PUBLIC_BACKEND_URL
					: `http://${PUBLIC_BACKEND_URL}`;
				await fetch(`${rawUrl}/websockets/quiz/play/leave/${idToLeave}`, {
					method: "POST"
				});
			} catch (e) {
				console.error("Failed to notify server of leave:", e);
			}
		}
	}
</script>

<Flex
	justifyContent="center"
	alignItems="center"
	direction="column"
	gap="medium"
	text="center"
	padding={step === "active" ? "none" : "giant"}
	style={step === "active" ? "height: 100dvh;" : ""}>
	{#if step === "pin"}
		<div>
			<h1>Join quiz</h1>
			<p style="color: {token.theme.color.text.secondary}">
				Enter the pin displayed on the host screen.
			</p>
		</div>
		<CodeInput bind:value={pinCode} />
		<Button iconbefore="arrow_back" onclick={() => navigateBack()}>Back</Button>
	{:else if step === "nickname"}
		<Flex
			width="fit-content"
			height="fit-content"
			direction="column"
			gap="medium"
			text="left"
			padding="giant">
			<div>
				<h1>Choose a nickname</h1>
				<p style="color: {token.theme.color.text.secondary}">How should others see you?</p>
			</div>
			<div style="width: 280px; max-width: 100%;">
				<Field label="Nickname" name="nickname" required>
					<TextField bind:value={nickname} placeholder="Your nickname..." maxlength={35} />
				</Field>
			</div>
			<Flex gap="small" width="fit-content" justifyContent="end">
				<Button appearance="primary" onclick={() => connectAndJoin(false)} {loading}>Join</Button>
				<Button
					appearance="default"
					onclick={() => {
						step = "pin";
						pinCode = "";
					}}>
					Back
				</Button>
			</Flex>
		</Flex>
	{:else if step === "waiting"}
		<div>
			<h1>You're in!</h1>
			<h2 style="color: {token.theme.color.text.secondary}">
				Waiting for the host to start the quiz...
			</h2>
		</div>
		<p style="font-weight: bold; font-size: 1.25rem;">Nickname: {nickname}</p>
		<Button appearance="danger" onclick={leaveSession}>Leave quiz</Button>
	{:else if step === "preview"}
		<h1 style="font-size: 4rem; margin: 0;">Look at the board!</h1>
		<h2 style="font-size: 6rem; margin: 0; color: {token.theme.color.text.primary}">
			{Math.ceil(remainingTimeMs / 1000)}s
		</h2>
	{:else if step === "active"}
		<!-- Timer bar at top for active state -->
		<div style="width: 100%; padding: 1rem; box-sizing: border-box; ">
			<h2 style="margin: 0; font-size: 2rem;">
				Time left: <span style="color: {token.theme.color.text.primary}">
					{Math.ceil(remainingTimeMs / 1000)}s
				</span>
			</h2>
		</div>

		<Flex style="flex: 1; width: 100%;" alignItems="stretch">
			{#if currentQuestionPayload}
				<PlayerQuestion payload={currentQuestionPayload} />
			{/if}
		</Flex>
	{/if}
</Flex>
