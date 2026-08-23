<script lang="ts">
	import { appState, Button, currentTheme, Flex, Modal } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

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

	const isDarkTheme = $derived(
		currentTheme?.themeName === "dark" || currentTheme?.themeName === "contrast"
	);
	let {
		handleNewQuestionSelection
	}: {
		handleNewQuestionSelection: (questiontype?: string) => void;
	} = $props();

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
</script>

<Modal title="Choose question type" onclose={handleNewQuestionSelection}>
	<span style="color: red;">Alleen MULTIPLE CHOICE (QUIZ) is momenteel ondersteund!</span>
	<Flex flexWrap="wrap" gap="medium" justifyContent="center" overflowY="scroll">
		{#each questionTypes as type}
			<button
				style="background: {token.theme.color.surface.raised
					.normal}; border: 1px solid var(--border-default, #334155); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; text-align: left; transition: all 0.2s;"
				onclick={() => {
					console.log(`Creating ${type.name}`);
					// FIXED: Now sending type.id ("quiz") instead of type.name ("Multiple choice")
					handleNewQuestionSelection(type.id);
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
							.small}; opacity: 0.7; display: block; color: {token.theme.color.text.secondary};">
						{type.desc}
					</span>
				</div>
			</button>
		{/each}
	</Flex>
	{#snippet actions()}
		<Button
			onclick={() => {
				handleNewQuestionSelection();
			}}>
			Cancel
		</Button>
	{/snippet}
</Modal>
