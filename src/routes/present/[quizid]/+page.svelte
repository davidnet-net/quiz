<!-- src/routes/manage/[quizId]/present/+page.svelte -->
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

	const quizRoom = presentQuiz(() => page.params.quizid || "");

	let shareIcon: iconType = $state("share");
	let iconTimeout: ReturnType<typeof setTimeout>;

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
		<Button
			iconbefore="arrow_back"
			onclick={() => {
				navigateBack();
			}}>
			Back
		</Button>
	</Flex>
{:else if quizRoom.errorCode === "NO_QUESTIONS"}
	<Flex justifyContent="center" alignItems="center" direction="column" gap="medium" text="center">
		<Icon icon="quiz" color="danger" size="giant" />
		<p>
			This quiz has no questions.
			<br />
			Add some questions before presenting.
		</p>
		<Flex gap="medium" justifyContent="center" height="fit-content">
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
			<Button
				appearance="primary"
				iconbefore="edit"
				onclick={() => goto(`/manage/${page.params.quizid}/edit`)}>
				Edit Quiz
			</Button>
		</Flex>
	</Flex>
{:else if quizRoom.errorCode === "QUESTION_INVALID"}
	<Flex justifyContent="center" alignItems="center" direction="column" gap="medium" text="center">
		<Icon icon="quiz" color="danger" size="giant" />
		<p>
			One or more questions in this quiz are invalid.
			<br />
			Please fix them before presenting.
		</p>
		<Flex gap="medium" justifyContent="center" height="fit-content">
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
			<Button
				appearance="primary"
				iconbefore="edit"
				onclick={() => goto(`/manage/${page.params.quizid}/edit`)}>
				Edit Quiz
			</Button>
		</Flex>
	</Flex>
{:else}
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
			{#if quizRoom.locked}
				<p style="padding: 0px; margin: 0px; font-size: 2dvh;">
					No one can join anymore. The quiz is locked!
				</p>
			{:else}
				<p style="padding: 0px; margin: 0px; font-size: 2dvh;">
					Join the quiz using the pin on <b>quiz.davidnet.net/join</b>
					or scan the QRCode above.
				</p>
			{/if}
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
						tip="Remove player and block nickname" />
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
			<Button
				appearance="default"
				onclick={() => {
					quizRoom.stopPresentation();
					navigateBack();
				}}>
				Stop presenting
			</Button>
			<Button
				appearance="primary"
				disabled={quizRoom.players.length < 1}
				onclick={() => {
					showStartModal = !showStartModal;
				}}>
				Start quiz
			</Button>
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
	<Modal
		title="Start quiz?"
		onclose={() => {
			showStartModal = false;
		}}>
		Are you sure you want to start the quiz?
		{#snippet actions()}
			<Button
				onclick={() => {
					showStartModal = false;
				}}>
				Cancel
			</Button>
			<Button appearance="primary">Start quiz</Button>
		{/snippet}
	</Modal>
{/if}
