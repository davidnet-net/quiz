<script lang="ts">
	import {
		appState,
		Button,
		currentTheme,
		Flex,
		Modal,
		useShortcut,
		VisuallyHidden
	} from "@davidnet-net/svelte-ui";
	import * as styles from "./page.css.ts";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import MainSidebar from "$lib/components/QuizEditor/MainSidebar.svelte";
	import QuestionSidebar from "$lib/components/QuizEditor/QuestionSidebar.svelte";

	// SVGs
	import multipleChoiceDark from "$lib/assets/quizimages/multiple-choice-dark.svg";
	import multipleChoiceLight from "$lib/assets/quizimages/multiple-choice-light.svg";
	import trueFalseDark from "$lib/assets/quizimages/true-false-dark.svg";
	import trueFalseLight from "$lib/assets/quizimages/true-false-light.svg";
	import sliderDark from "$lib/assets/quizimages/slider-dark.svg";
	import sliderLight from "$lib/assets/quizimages/slider-light.svg";
	import puzzleDark from "$lib/assets/quizimages/puzzle-dark.svg";
	import puzzleLight from "$lib/assets/quizimages/puzzle-light.svg";
	import typeAnswerDark from "$lib/assets/quizimages/type-answer-dark.svg";
	import typeAnswerLight from "$lib/assets/quizimages/type-answer-light.svg";
	import pollDark from "$lib/assets/quizimages/poll-dark.svg";
	import pollLight from "$lib/assets/quizimages/poll-light.svg";
	import wordCloudDark from "$lib/assets/quizimages/word-cloud-dark.svg";
	import wordCloudLight from "$lib/assets/quizimages/word-cloud-light.svg";
	import scaleDark from "$lib/assets/quizimages/scale-dark.svg";
	import scaleLight from "$lib/assets/quizimages/scale-light.svg";
	import informationDark from "$lib/assets/quizimages/information-dark.svg";
	import informationLight from "$lib/assets/quizimages/information-light.svg";

	let questionSidebarOpened = $state(true);
	let mainSidebarOpened = $state(true);
	let openDropdown = $state<string | null>(null);
	let showNewQuestionModal = $state(false);

	const isDarkTheme = $derived(
		currentTheme?.themeName === "dark" || currentTheme?.themeName === "contrast"
	);

	const questionTypes = [
		{
			id: "quiz",
			name: "Multiple choice",
			desc: "Classic multi-option question",
			dark: multipleChoiceDark,
			light: multipleChoiceLight
		},
		{
			id: "true_false",
			name: "True / False",
			desc: "Simple binary choice",
			dark: trueFalseDark,
			light: trueFalseLight
		},
		{
			id: "slider",
			name: "Slider",
			desc: "Numeric sliding scale",
			dark: sliderDark,
			light: sliderLight
		},
		{
			id: "puzzle",
			name: "Puzzle",
			desc: "Order or sequence items",
			dark: puzzleDark,
			light: puzzleLight
		},
		{
			id: "type_answer",
			name: "Type answer",
			desc: "Short text input match",
			dark: typeAnswerDark,
			light: typeAnswerLight
		},
		{
			id: "poll",
			name: "Poll",
			desc: "Gather feedback or votes",
			dark: pollDark,
			light: pollLight
		},
		{
			id: "word_cloud",
			name: "Word cloud",
			desc: "Open text aggregation",
			dark: wordCloudDark,
			light: wordCloudLight
		},
		{
			id: "scale",
			name: "Scale",
			desc: "Rating scale evaluation",
			dark: scaleDark,
			light: scaleLight
		},
		{
			id: "information",
			name: "Information",
			desc: "Display info slide",
			dark: informationDark,
			light: informationLight
		}
	];

	let questions = $state([
		{ id: 1, title: "Quiz", text: "Welke quiz app is de beste app?" },
		{ id: 2, title: "Quiz", text: "Is honing giftig?" },
		{
			id: 3,
			title: "Quiz",
			text: "67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 "
		}
	]);
	let activeQuestionId = $state(1);

	$effect(() => {
		(async () => {
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
		})();
	});
</script>

<Flex direction="column">
	<div class={styles.frostbar}>
		<span class={styles.title}>NAME <VisuallyHidden>. quiz</VisuallyHidden></span>
		<Flex width="fit-content" height="fit-content" gap="small">
			<Button appearance="default">Manage quiz</Button>
			<Button appearance="success">Exit</Button>
		</Flex>
	</div>
	<Flex>
		<!-- Linker Sidebar Component -->
		<MainSidebar
			{questions}
			{activeQuestionId}
			{mainSidebarOpened}
			onToggle={() => (mainSidebarOpened = !mainSidebarOpened)}
			onNewQuestion={() => (showNewQuestionModal = true)}
			onSelectQuestion={(id) => (activeQuestionId = id)} />

		<!-- Canvas / Midden -->
		<Flex direction="column" padding="medium" alignItems="center" gap="medium" style="width: 100%;">
			<div class={styles.questionContainer}>
				<span class={styles.question}>Welke quiz app is de beste app?</span>
			</div>
			<div class={styles.imageContainer}></div>

			<div class={styles.answerContainer}>
				<div class={styles.answerRow}>
					<button
						class={styles.answerBox}
						style="background-color: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239, 68, 68, 0.4);">
						Davidnet Quiz
					</button>
					<button
						class={styles.answerBox}
						style="background-color: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.4);">
						Kahoot
					</button>
				</div>
				<div class={styles.answerRow}>
					<button
						class={styles.answerBox}
						style="background-color: rgba(168, 85, 247, 0.25); border: 1px solid rgba(168, 85, 247, 0.4);">
						Antwoord C
					</button>
					<button
						class={styles.answerBox}
						style="background-color: rgba(34, 197, 94, 0.25); border: 1px solid rgba(34, 197, 94, 0.4);">
						Antwoord D
					</button>
				</div>
			</div>
		</Flex>

		<!-- Rechter Sidebar Component -->
		<QuestionSidebar
			{questionSidebarOpened}
			{openDropdown}
			onToggle={() => (questionSidebarOpened = !questionSidebarOpened)}
			onDropdownToggle={(name) => (openDropdown = name)} />
	</Flex>

	<!-- New Question Modal -->
	{#if showNewQuestionModal}
		<Modal title="Choose question type" onclose={() => (showNewQuestionModal = false)}>
			<Flex flexWrap="wrap" gap="medium" justifyContent="center" overflowY="scroll">
				{#each questionTypes as type}
					<button
						style="background: {token.theme.color.surface.raised
							.normal}; border: 1px solid var(--border-default, #334155); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; text-align: left; transition: all 0.2s;"
						onclick={() => {
							console.log(`Creating ${type.name}`);
							showNewQuestionModal = false;
						}}>
						<img
							src={isDarkTheme ? type.light : type.dark}
							alt={type.name}
							style="width: 100%; height: auto; border-radius: 4px;" />
						<div style="width: 100%;">
							<span
								style="font-size: 0.9rem; display: block; color: {token.theme.color.text
									.default}; font-weight: {token.global.font.weight.medium}">
								{type.name}
							</span>
							<span
								style="font-size: {token.global.font.size
									.small}; opacity: 0.7; display: block; color: {token.theme.color.text
									.secondary};">
								{type.desc}
							</span>
						</div>
					</button>
				{/each}
			</Flex>
			{#snippet actions()}
				<Button onclick={() => (showNewQuestionModal = false)}>Cancel</Button>
			{/snippet}
		</Modal>
	{/if}
</Flex>
