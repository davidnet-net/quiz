<!-- src/routes/present/[quizid]/+page.svelte -->
<script lang="ts">
	import {
		appState,
		authState,
		Button,
		Divider,
		Flex,
		Icon,
		IconButton,
		whenAuthReady,
		toast,
		type iconType,
		navigateBack,
		Modal
	} from "@davidnet-net/svelte-ui";
	import * as styles from "./page.css";
	import QRCode from "@castlenine/svelte-qrcode";
	import { PUBLIC_ACCOUNT_FRONTEND_URL } from "$env/static/public";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { presentQuiz } from "$lib/quizPresenter/presentQuiz.svelte";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import PresenterQuestion from "$lib/components/QuizPresenter/PresenterQuestion.svelte";

	const quizRoom = presentQuiz(() => page.params.quizid || "");

	let shareIcon: iconType = $state("share");
	let iconTimeout: ReturnType<typeof setTimeout>;

	let remainingTimeMs = $state(0);
	let isFullscreen = $state(false);

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
			isFullscreen = true;
		} else {
			document.exitFullscreen().catch(() => {});
			isFullscreen = false;
		}
	}

	$effect(() => {
		if (quizRoom.gameState === "preview" || quizRoom.gameState === "active") {
			const networkDelay = Math.max(0, Date.now() - quizRoom.timerServerTime);
			const target = Date.now() + (quizRoom.timerDurationMs - networkDelay);
			let frame: number;
			const update = () => {
				remainingTimeMs = Math.max(0, target - Date.now());
				if (
					remainingTimeMs > 0 &&
					(quizRoom.gameState === "active" || quizRoom.gameState === "preview")
				) {
					frame = requestAnimationFrame(update);
				}
			};
			update();
			return () => cancelAnimationFrame(frame);
		}
	});

	async function handleShare() {
		const url = `https://quiz.davidnet.net/join?pin=${quizRoom.pinCode}`;
		try {
			await navigator.clipboard.writeText(url);
			shareIcon = "check";
			toast("Copied", "Link copied to clipboard!", "check", 3000, "success");
		} catch (err) {
			shareIcon = "error";
			toast("Error", "Failed to copy link.", "error", 3000, "danger");
		}
		clearTimeout(iconTimeout);
		iconTimeout = setTimeout(() => {
			shareIcon = "share";
		}, 2500);
	}

	$effect(() => {
		(async () => {
			appState.hideNavigation = true;
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				window.location.href = `${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`;
			}
		})();
	});

	let showStartModal = $state(false);
</script>

{#if appState.isMobile}
	<Flex justifyContent="center" alignItems="center" direction="column" gap="medium" text="center">
		<Icon icon="screenshot_monitor" color="danger" size="giant" />
		<p>Screen size is too small to present quiz.</p>
		<Button iconbefore="arrow_back" onclick={() => navigateBack()}>Back</Button>
	</Flex>
{:else if quizRoom.errorCode === "NO_QUESTIONS" || quizRoom.errorCode === "QUESTION_INVALID"}
	<Flex justifyContent="center" alignItems="center" direction="column" gap="medium" text="center">
		<Icon icon="quiz" color="danger" size="giant" />
		<p>
			{quizRoom.errorCode === "NO_QUESTIONS"
				? "This quiz has no questions."
				: "One or more questions are invalid."}
			<br />
			Please fix them before presenting.
		</p>
		<Flex gap="medium" justifyContent="center" height="fit-content">
			<Button iconbefore="arrow_back" onclick={() => navigateBack()}>Back</Button>
			<Button
				appearance="primary"
				iconbefore="edit"
				onclick={() => goto(`/manage/${page.params.quizid}/edit`)}>
				Edit Quiz
			</Button>
		</Flex>
	</Flex>
{:else}
	{#if quizRoom.gameState === "lobby"}
		<Flex
			justifyContent="start"
			alignItems="center"
			direction="column"
			gap="medium"
			style="padding-bottom: 60px;">
			<div class={styles.banner}>
				<Flex justifyContent="spaceBetween" alignItems="start" padding="medium">
					<div style="position: relative; z-index: 1;">
						<h1 style="padding: 0px; margin: 0px; font-size: 5dvh;">{quizRoom.quizName}</h1>
						<span style="padding: 0px; margin: 0px; font-size: 8dvh;">
							PIN: <b>{quizRoom.locked ? "Locked" : quizRoom.pinCode}</b>
						</span>
					</div>
					<Flex height="17dvh" width="17dvh" justifyContent="center" alignItems="center">
						{#if quizRoom.locked}
							<div
								style="height: 100%; width: 100%; border-radius: {token.global.radius
									.huge}; background-color: {token.theme.color.surface.overlay
									.normal}; display: flex; justify-content: center; align-items: center;">
								<Icon icon="lock" size="giant" />
							</div>
						{:else}
							{#key quizRoom.pinCode}
								<QRCode
									data={`https://quiz.davidnet.net/join?pin=${quizRoom.pinCode}`}
									haveBackgroundRoundedEdges
									isResponsive
									shape="square" />
							{/key}
						{/if}
					</Flex>
				</Flex>
			</div>

			<Flex height="fit-content" justifyContent="center" alignItems="center" gap="medium">
				<p style="padding: 0px; margin: 0px; font-size: 2dvh;">
					{quizRoom.locked
						? "No one can join anymore. The quiz is locked!"
						: "Join the quiz using the pin on quiz.davidnet.net/join or scan the QRCode above."}
				</p>
			</Flex>
			<Divider color="tertiary" thickness="thick" />

			<Flex width="80%" height="fit-content" gap="medium" flexWrap="wrap">
				{#each quizRoom.players as player (player.id)}
					<span class={styles.nickname}>
						{#if player.failingHeartbeat}
							<Icon icon="android_wifi_3_bar_alert" color="danger" />
						{/if}
						{player.nickname}
						<IconButton
							icon="delete_forever"
							onclick={() => quizRoom.removePlayer(player.id)}
							tip="Remove player" />
					</span>
				{/each}
				{#if quizRoom.players.length < 1}
					<Flex height="fit-content" justifyContent="center" alignItems="center">
						<p style="padding: 0px; margin: 0px; font-size: 2dvh;">
							No one has joined this quiz yet.
						</p>
					</Flex>
				{/if}
			</Flex>
		</Flex>
	{:else if quizRoom.gameState === "preview"}
		<Flex
			justifyContent="center"
			alignItems="center"
			direction="column"
			gap="large"
			padding="giant"
			style="padding-bottom: 80px; min-height: 100dvh; box-sizing: border-box;">
			<h1 style="font-size: 5rem; text-align: center; margin: 0;">
				{quizRoom.currentQuestionPayload?.question?.text}
			</h1>
			<div style="font-size: 15rem; font-weight: bold; color: {token.theme.color.text.primary};">
				{Math.ceil(remainingTimeMs / 1000)}
			</div>
			{#if quizRoom.currentQuestionPayload?.question?.pointsMultiplier > 1}
				<h2 class="pop-animation" style="color: var(--color-danger); font-size: 4rem; margin: 0;">
					2X POINTS!
				</h2>
			{/if}
		</Flex>
	{:else if quizRoom.gameState === "active"}
		<Flex
			justifyContent="start"
			alignItems="center"
			direction="column"
			gap="large"
			padding="giant"
			style="padding-bottom: 80px; min-height: 100dvh; box-sizing: border-box;">
			<div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
				<h1 style="font-size: 4dvh; margin: 0;">
					{Math.ceil(remainingTimeMs / 1000)}s
				</h1>
				{#if quizRoom.currentQuestionPayload?.question?.pointsMultiplier > 1}
					<h2 class="pop-animation" style="color: var(--color-danger); margin: 0;">2X POINTS</h2>
				{/if}
				<div style="font-size: 2rem; font-weight: bold;">
					{quizRoom.responseCount} Answers
				</div>
			</div>

			{#if quizRoom.currentQuestionPayload}
				<Flex justifyContent="center" alignItems="center" style="width: 100%;">
					<PresenterQuestion payload={quizRoom.currentQuestionPayload} showResults={false} />
				</Flex>
			{/if}
		</Flex>
	{:else if quizRoom.gameState === "results"}
		<Flex
			justifyContent="start"
			alignItems="center"
			direction="column"
			gap="large"
			padding="giant"
			style="padding-bottom: 80px; min-height: 100dvh; box-sizing: border-box;">
			<div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
				<h1 style="font-size: 4dvh; margin: 0;">Results</h1>
				{#if quizRoom.autoMode}
					<div
						style="font-size: 2rem; font-weight: bold; color: {token.theme.color.text.secondary};">
						Auto-skip in {Math.ceil(quizRoom.autoTimerRemaining / 1000)}s
					</div>
				{/if}
			</div>
			<PresenterQuestion
				payload={quizRoom.currentQuestionPayload}
				showResults={true}
				resultsBreakdown={quizRoom.resultsBreakdown} />
		</Flex>
	{:else if quizRoom.gameState === "leaderboard"}
		<Flex
			justifyContent="center"
			alignItems="center"
			direction="column"
			gap="large"
			padding="giant"
			style="padding-bottom: 80px; min-height: 100dvh; box-sizing: border-box;">
			<div
				style="display: flex; justify-content: space-between; width: 60%; align-items: center; margin-bottom: 2rem;">
				<h1 style="font-size: 4rem; margin: 0;">Top 5</h1>
				{#if quizRoom.autoMode}
					<div
						style="font-size: 2rem; font-weight: bold; color: {token.theme.color.text.secondary};">
						Next in {Math.ceil(quizRoom.autoTimerRemaining / 1000)}s
					</div>
				{/if}
			</div>
			{#each quizRoom.leaderboardData as p, i}
				<div
					style="display: flex; justify-content: space-between; width: 60%; font-size: 2rem; background: var(--color-surface-raised-normal); padding: 1rem; border-radius: 8px; margin-bottom: 10px;">
					<span>
						<b>{i + 1}.</b>
						{p.nickname}
					</span>
					<span>{p.score}</span>
				</div>
			{/each}
		</Flex>
	{:else if quizRoom.gameState === "finished"}
		<Flex
			justifyContent="center"
			alignItems="center"
			direction="column"
			gap="large"
			padding="giant"
			style="padding-bottom: 80px; min-height: 100dvh; box-sizing: border-box;">
			<h1 style="font-size: 5rem;">Final Podium</h1>
			<div
				style="display: flex; gap: 2rem; align-items: flex-end; height: 300px; margin-top: 2rem;">
				<!-- 2nd Place -->
				{#if quizRoom.leaderboardData[1]}
					<div style="display: flex; flex-direction: column; align-items: center;">
						<span style="font-size: 2rem; font-weight: bold;">
							{quizRoom.leaderboardData[1].nickname}
						</span>
						<span style="margin-bottom: 1rem;">{quizRoom.leaderboardData[1].score} pts</span>
						<div
							style="width: 100px; height: 150px; background: silver; display: flex; justify-content: center; font-size: 3rem; font-weight: bold; color: white;">
							2
						</div>
					</div>
				{/if}
				<!-- 1st Place -->
				{#if quizRoom.leaderboardData[0]}
					<div style="display: flex; flex-direction: column; align-items: center;">
						<span style="font-size: 2.5rem; font-weight: bold;">
							{quizRoom.leaderboardData[0].nickname}
						</span>
						<span style="margin-bottom: 1rem;">{quizRoom.leaderboardData[0].score} pts</span>
						<div
							style="width: 120px; height: 220px; background: gold; display: flex; justify-content: center; font-size: 4rem; font-weight: bold; color: white;">
							1
						</div>
					</div>
				{/if}
				<!-- 3rd Place -->
				{#if quizRoom.leaderboardData[2]}
					<div style="display: flex; flex-direction: column; align-items: center;">
						<span style="font-size: 1.5rem; font-weight: bold;">
							{quizRoom.leaderboardData[2].nickname}
						</span>
						<span style="margin-bottom: 1rem;">{quizRoom.leaderboardData[2].score} pts</span>
						<div
							style="width: 100px; height: 100px; background: #cd7f32; display: flex; justify-content: center; font-size: 3rem; font-weight: bold; color: white;">
							3
						</div>
					</div>
				{/if}
			</div>
		</Flex>
	{/if}

	<!-- PERSISTENT FROSTBAR FOR ALL GAME STATES -->
	<div class={styles.frostbar}>
		<div style="font-size: 1.25rem; font-weight: bold;">
			PIN: {quizRoom.locked ? "Locked" : quizRoom.pinCode}
		</div>
		<Flex
			height="fit-content"
			justifyContent="center"
			alignItems="center"
			width="fit-content"
			gap="medium">
			{#if quizRoom.gameState !== "lobby" && quizRoom.gameState !== "finished" && quizRoom.gameState !== "preview"}
				<Button
					appearance={quizRoom.autoMode ? "primary" : "default"}
					onclick={() => quizRoom.toggleAutoMode()}>
					{quizRoom.autoMode ? "Disable auto" : "Enable auto"}
				</Button>

				<Button appearance="primary" onclick={() => quizRoom.nextPhase()}>
					{quizRoom.gameState === "active"
						? "Skip / Show Results"
						: quizRoom.gameState === "results"
							? "Next (Leaderboard)"
							: "Next Question"}
				</Button>
			{/if}

			<IconButton
				onclick={() => quizRoom.toggleLock()}
				tip={quizRoom.locked ? "Unlock presentation." : "Lock presentation."}
				appearance="default"
				icon={quizRoom.locked ? "lock_open" : "lock"} />
			<IconButton
				appearance="default"
				icon={shareIcon}
				onclick={handleShare}
				tip="Copy share link" />
			<IconButton
				appearance="default"
				icon={isFullscreen ? "fullscreen_exit" : "fullscreen"}
				onclick={toggleFullscreen}
				tip={isFullscreen ? "Exit fullscreen" : "Fullscreen"} />

			<Button
				appearance="default"
				onclick={() => {
					quizRoom.stopPresentation();
					navigateBack();
				}}>
				Stop presenting
			</Button>

			{#if quizRoom.gameState === "lobby"}
				<Button
					appearance="primary"
					disabled={quizRoom.players.length < 1}
					onclick={() => (showStartModal = true)}>
					Start quiz
				</Button>
			{/if}

			<Flex
				height="fit-content"
				justifyContent="center"
				alignItems="center"
				width="fit-content"
				gap="xsmall">
				<Icon icon="contacts_product" />
				<span style="font-weight: bold; font-size: 1.25rem;">{quizRoom.players.length}</span>
			</Flex>
		</Flex>
	</div>
{/if}

{#if showStartModal}
	<Modal title="Start quiz?" onclose={() => (showStartModal = false)}>
		Are you sure you want to start the quiz?
		{#snippet actions()}
			<Button onclick={() => (showStartModal = false)}>Cancel</Button>
			<Button
				appearance="primary"
				onclick={() => {
					showStartModal = false;
					quizRoom.startQuiz();
				}}>
				Start quiz
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	@keyframes pulse-pop {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.15);
			opacity: 0.9;
			text-shadow: 0 0 20px var(--color-danger);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	.pop-animation {
		animation: pulse-pop 1s ease-in-out infinite;
	}
</style>
