<script lang="ts">
	import { Checkbox, Field, Flex, Icon, TextArea } from "@davidnet-net/svelte-ui";
	import * as styles from "./TrueOrFalse.css";

	let {
		question,
		onUpdate
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
	} = $props();

	// Hardcode the True and False options with specific colors (Blue and Red)
	const defaultOptions = [
		{
			id: "true",
			text: "True",
			isCorrect: false,
			color: "rgba(59, 130, 246, 1)",
			bg: "rgba(59, 130, 246, 0.25)"
		},
		{
			id: "false",
			text: "False",
			isCorrect: false,
			color: "rgba(239, 68, 68, 1)",
			bg: "rgba(239, 68, 68, 0.25)"
		}
	];

	// Guarantee the array structure and text always remains "True" and "False"
	// regardless of what the backend sends, while preserving the user's `isCorrect` choice.
	let options = $derived(
		Array.isArray(question?.options) && question.options.length === 2
			? [
					{ ...defaultOptions[0], isCorrect: question.options[0].isCorrect },
					{ ...defaultOptions[1], isCorrect: question.options[1].isCorrect }
				]
			: defaultOptions
	);

	function updateCorrectAnswer(index: number, isChecked: boolean) {
		const newOptions = [...options];

		if (isChecked) {
			// True/False is always single-select: uncheck the other option
			newOptions.forEach((opt, i) => {
				newOptions[i] = { ...opt, isCorrect: i === index };
			});
		} else {
			// Allow deselecting
			newOptions[index] = { ...newOptions[index], isCorrect: false };
		}

		// Pass isMultiSelect: false to ensure the sidebar tools don't override it
		onUpdate({ options: newOptions, isMultiSelect: false });
	}
</script>

<Flex
	direction="column"
	padding="medium"
	alignItems="center"
	gap="medium"
	justifyContent="spaceAround"
	style="width: 100%;">
	<div class={styles.questionContainer}>
		<Field label="Question" name="question" overidelabel style="width: 100%;">
			<TextArea
				value={question?.text || ""}
				oninput={(e) => onUpdate({ text: (e.target as HTMLTextAreaElement).value })}
				placeholder="Start typing your True or False question..."
				maxlength={250}
				headless
				style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
		</Field>
	</div>

	<div class={styles.imageContainer}><Icon icon="image" size="giant" /></div>

	<div class={styles.answerContainer}>
		{#each options as option, i}
			<button
				class={styles.answerBox}
				style="background-color: {option.bg}; border: 1px solid {option.color};"
				onclick={() => updateCorrectAnswer(i, !option.isCorrect)}>
				<div class={styles.checkboxWrapper} onclick={(e) => e.stopPropagation()}>
					<Checkbox
						checked={option.isCorrect}
						onchange={(e: Event) =>
							updateCorrectAnswer(i, (e.currentTarget as HTMLInputElement).checked)}
						title="Mark as correct answer" />
				</div>

				<span>{option.text}</span>
			</button>
		{/each}
	</div>
</Flex>
