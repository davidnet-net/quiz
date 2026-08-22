<script lang="ts">
	import {
		appState,
		authState,
		Button,
		Flex,
		Icon,
		LinkButton,
		Skeleton,
		useShortcut,
		VisuallyHidden,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import * as styles from "./page.css.ts";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import MainSidebar from "$lib/components/QuizEditor/MainSidebar.svelte";
	import QuestionSidebar from "$lib/components/QuizEditor/QuestionSidebar.svelte";
	import NewQuestionModal from "$lib/components/QuizEditor/NewQuestionModal.svelte";
	import MultipleChoice from "$lib/components/QuizEditor/Questions/MultipleChoiceQuestion.svelte";
	import LoadingQuestion from "$lib/components/QuizEditor/Questions/LoadingQuestion.svelte";
	import type { PageProps } from "./$types";
	import { QuizRoom } from "$lib/quizEditor/QuizRoom.svelte";
	import { page } from "$app/state";
	import { PUBLIC_ACCOUNT_FRONTEND_URL } from "$env/static/public";

	let { params }: PageProps = $props();

	let questionSidebarOpened = $state(true);
	let mainSidebarOpened = $state(true);
	let openDropdown = $state<string | null>(null);
	let showNewQuestionModal = $state(false);

	// 1. Initialize Room & Bind state
	const room = QuizRoom(() => (authState.isLoggedIn ? params.quizid : ""));
	let loading = $derived(room.loading || !authState.isLoggedIn);
	let questions = $derived(room.questions);
	let quizName = $derived(room.quizName);

	let activeQuestionId = $state<number | string | null>(null);

	// Derived state to find the data for the currently selected question
	let activeQuestionData = $derived(questions.find((q) => q.id === activeQuestionId) || null);

	$effect(() => {
		questionSidebarOpened = !appState.isMobile;
		mainSidebarOpened = !appState.isMobile;

		useShortcut("ctrl+]", () => (questionSidebarOpened = !questionSidebarOpened), {
			name: "Toggle right sidebar",
			description: "Toggle right sidebar.",
			preventDefault: true
		});
		useShortcut("ctrl+[", () => (mainSidebarOpened = !mainSidebarOpened), {
			name: "Toggle left sidebar",
			description: "Toggle left sidebar.",
			preventDefault: true
		});
		useShortcut("ctrl+shift+n", () => (showNewQuestionModal = true), {
			name: "Create new question",
			description: "Create new question.",
			preventDefault: true
		});
	});

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				window.location.href = `${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`;
			}
		})();
	});

	// Auto-select the first question if none is selected and data loads
	$effect(() => {
		if (!activeQuestionId && questions.length > 0) {
			activeQuestionId = questions[0].id;
		}
	});

	async function handleNewQuestionSelection(questiontype?: string) {
		showNewQuestionModal = false;
		if (!questiontype) return;

		const newId = crypto.randomUUID();
		room.addQuestion({
			id: newId,
			type: questiontype,
			title: "New Question",
			text: ""
		});

		// Immediately focus the new question
		activeQuestionId = newId;
	}
</script>

<Flex direction="column">
	<div class={styles.frostbar}>
		{#if loading}
			<Skeleton height="2rem" width="15rem" />
		{:else}
			<span class={styles.title}>{quizName} <VisuallyHidden>. quiz</VisuallyHidden></span>
		{/if}

		<Flex width="fit-content" height="fit-content" gap="small">
			<Button appearance="default" disabled {loading}>Manage quiz</Button>
			<Button appearance="default" disabled {loading}>Present quiz</Button>
			<LinkButton appearance="success" href="/manage">Exit</LinkButton>
		</Flex>
	</div>
	<Flex>
		<MainSidebar
			{questions}
			{activeQuestionId}
			{mainSidebarOpened}
			onToggle={() => (mainSidebarOpened = !mainSidebarOpened)}
			{loading}
			onNewQuestion={() => (showNewQuestionModal = true)}
			onSelectQuestion={(id) => (activeQuestionId = id)} />

		{#if loading}
			<LoadingQuestion />
		{:else if activeQuestionData}
			<!-- Pass down the current question data AND the update method -->
			<MultipleChoice
				question={activeQuestionData}
				onUpdate={(updates) => {
					if (activeQuestionId !== null) {
						room.updateQuestion(activeQuestionId, updates);
					}
				}} />
		{/if}

		{#if activeQuestionId}
			<QuestionSidebar
				{questionSidebarOpened}
				{loading}
				{openDropdown}
				onToggle={() => (questionSidebarOpened = !questionSidebarOpened)}
				onDropdownToggle={(name) => (openDropdown = name)} />
		{:else}
			<Flex
				justifyContent="center"
				alignItems="center"
				direction="column"
				gap="medium"
				text="center">
				<Icon icon="comments_disabled" size="giant" />
				<span
					style="font-size: {token.global.font.size.xlarge}; font-weight: {token.global.font.weight
						.medium}">
					Welcome to quiz '{quizName}'.
				</span>
				<span>Let's start by creating a new question!</span>
				<Button
					appearance="discover"
					iconbefore="add"
					onclick={() => {
						showNewQuestionModal = true;
					}}>
					Create new question
				</Button>
			</Flex>
		{/if}
	</Flex>

	<!-- New Question Modal -->
	{#if showNewQuestionModal}
		<NewQuestionModal {handleNewQuestionSelection} />
	{/if}
</Flex>
