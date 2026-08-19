<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_ACCOUNT_FRONTEND_URL } from "$env/static/public";
	import Card from "$lib/components/Card/Card.svelte";
	import {
		LinkButton,
		Flex,
		appState,
		getCurrentWorkspace,
		Skeleton,
		whenAuthReady,
		authState,
		IconButton,
		Button,
		Modal,
		Form,
		Field,
		TextField,
		toast
	} from "@davidnet-net/svelte-ui";
	import { onMount } from "svelte";
	import * as styles from "./page.css";
	import type { derived } from "svelte/store";
	import type { Quiz } from "$lib/types/quizes";
	const currentWorkspace = $derived(getCurrentWorkspace());

	async function loadData() {}

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				window.location.href = `${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`;
			}

			loadData();
		})();
	});

	onMount(() => {
		document.addEventListener("visibilitychange", async () => {
			if (document.visibilityState === "visible") {
				await loadData();
			}
		});
	});

	let newQuizName = $state("");
	const isQuizNameValid = $derived(newQuizName.length > 0 && newQuizName.length <= 30);

	let showNewQuizModal = $state(false);
	let quizCreating = $state(false);
	async function createQuiz() {
		quizCreating = true;
		if (!isQuizNameValid) {
			quizCreating = false;
			return;
		}
		toast(
			"Not allowed",
			"You are not allowed to quizes:create inside this workspace.",
			"rule",
			5000,
			"danger"
		);
		quizCreating = false;
		showNewQuizModal = false;
	}

	let quizes: Quiz[] = $state([]);
</script>

{#if currentWorkspace?.name}
	<Flex justifyContent="between" height="fit-content" alignItems="center" gap="small">
		<h1>{currentWorkspace?.name} quizes:</h1>
		<Button
			appearance="primary"
			iconbefore="add"
			onclick={() => {
				showNewQuizModal = true;
			}}>
			New quiz
		</Button>
	</Flex>
{:else}
	<Skeleton height="3rem" width="18rem" />
{/if}
<Flex flexWrap="wrap" gap="medium">
	{#if quizes.length > 0}
		{#each quizes as quiz (quiz.id)}
			<div class={styles.quizCard}>
				<Flex justifyContent="between" height="fit-content" alignItems="center" gap="small">
					<span class={styles.quizName}>{quiz.name}</span>
					<IconButton icon="more_vert" onclick={() => {}} tip="" disabled />
				</Flex>
				<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
					<LinkButton href="#" disabled>Edit quiz</LinkButton>
					<LinkButton href="#" appearance="primary" disabled>Present quiz</LinkButton>
				</Flex>
			</div>
		{/each}
	{:else if !currentWorkspace?.name}
		<Skeleton height="10rem" width="22rem" />
		<Skeleton height="10rem" width="22rem" />
		<Skeleton height="10rem" width="22rem" />
	{:else}
		<div class={styles.quizCard}>
			<Flex
				justifyContent="center"
				height="fit-content"
				direction="column"
				alignItems="start"
				gap="small">
				<span class={styles.quizName}>
					{currentWorkspace?.type === "personal" ? "You do" : `${currentWorkspace?.name} does`} not have
					any quizes yet.
				</span>
				<p>Start by creating one</p>
			</Flex>
			<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
				<Button
					appearance="primary"
					iconbefore="add"
					onclick={() => {
						showNewQuizModal = true;
					}}>
					New quiz
				</Button>
			</Flex>
		</div>
	{/if}
</Flex>

{#if showNewQuizModal}
	<Modal
		title="New quiz"
		onclose={() => {
			if (quizCreating) return;
			showNewQuizModal = false;
		}}>
		<Form id="new-quiz" onsubmit={createQuiz}>
			<Field label="Quiz name:" name="quizName">
				<TextField maxlength={30} bind:value={newQuizName} disabled={quizCreating} />
			</Field>
		</Form>
		<br />
		{#snippet actions()}
			<Button
				disabled={quizCreating}
				onclick={() => {
					showNewQuizModal = false;
				}}>
				Cancel
			</Button>
			<Button
				appearance="primary"
				disabled={!isQuizNameValid}
				loading={quizCreating}
				form="new-quiz"
				type="submit">
				New quiz
			</Button>
		{/snippet}
	</Modal>
{/if}
