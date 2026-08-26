<script lang="ts">
	import { Checkbox, Field, Flex, TextArea } from "@davidnet-net/svelte-ui";
	import * as styles from "./MultipleChoiceQuestion.css";

	let {
		question,
		onUpdate
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
	} = $props();

	const defaultOptions = [
		{
			id: "1",
			text: "",
			isCorrect: false,
			color: "rgba(239, 68, 68, 1)",
			bg: "rgba(239, 68, 68, 0.25)"
		},
		{
			id: "2",
			text: "",
			isCorrect: false,
			color: "rgba(59, 130, 246, 1)",
			bg: "rgba(59, 130, 246, 0.25)"
		},
		{
			id: "3",
			text: "",
			isCorrect: false,
			color: "rgba(168, 85, 247, 1)",
			bg: "rgba(168, 85, 247, 0.25)"
		},
		{
			id: "4",
			text: "",
			isCorrect: false,
			color: "rgba(34, 197, 94, 1)",
			bg: "rgba(34, 197, 94, 0.25)"
		}
	];

	let options = $derived(
		Array.isArray(question?.options) && question.options.length === 4
			? question.options
			: defaultOptions
	);

	let isMultiSelect = $derived(!!question?.isMultiSelect);

	function updateOption(index: number, updates: Record<string, any>) {
		const newOptions = [...options];

		// Block empty answers from being correct
		const nextText = updates.text !== undefined ? updates.text : newOptions[index].text;

		if (nextText.trim() === "") {
			updates.isCorrect = false;
		}

		// Handle single-select / multi-select logic
		if (updates.isCorrect && !isMultiSelect) {
			newOptions.forEach((opt, i) => {
				newOptions[i] = { ...opt, isCorrect: i === index };
			});
			newOptions[index] = { ...newOptions[index], ...updates };
		} else {
			newOptions[index] = { ...newOptions[index], ...updates };
		}

		onUpdate({ options: newOptions });
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
				placeholder="Start typing your question..."
				maxlength={250}
				headless
				style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
		</Field>
	</div>
	<div class={styles.imageContainer}></div>

	<div class={styles.answerContainer}>
		<!-- First Row (Options 0 and 1) -->
		<div class={styles.answerRow}>
			{#each [0, 1] as i}
				<div
					class={styles.answerBox}
					style="background-color: {options[i].bg}; border: 1px solid {options[i]
						.color}; padding: 1rem; box-sizing: border-box;">
					<Field
						label={`Answer ${i + 1}`}
						name={`answer_${i}`}
						overidelabel
						style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
						<div style="display: flex; align-items: flex-start; gap: 0.75rem; width: 100%;">
							<div style="padding-top: 2px; flex-shrink: 0;">
								<Checkbox
									checked={options[i].isCorrect}
									disabled={options[i].text.trim() === ""}
									onchange={(e: Event) =>
										updateOption(i, { isCorrect: (e.currentTarget as HTMLInputElement).checked })}
									title={options[i].text.trim() === ""
										? "Type an answer first"
										: "Mark as correct answer"} />
							</div>

							<TextArea
								value={options[i].text}
								oninput={(e) => updateOption(i, { text: (e.target as HTMLTextAreaElement).value })}
								placeholder={`Add answer ${i + 1}...`}
								maxlength={100}
								headless
								maxRows={4}
								style="background: transparent; border: none; outline: none; width: 100%; color: inherit; font-family: inherit; font-size: inherit; font-weight: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
						</div>
					</Field>
				</div>
			{/each}
		</div>

		<!-- Second Row (Options 2 and 3) -->
		<div class={styles.answerRow}>
			{#each [2, 3] as i}
				<div
					class={styles.answerBox}
					style="background-color: {options[i].bg}; border: 1px solid {options[i]
						.color}; padding: 1rem; box-sizing: border-box;">
					<Field
						label={`Answer ${i + 1}`}
						name={`answer_${i}`}
						overidelabel
						style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
						<div style="display: flex; align-items: flex-start; gap: 0.75rem; width: 100%;">
							<div style="padding-top: 2px; flex-shrink: 0;">
								<Checkbox
									checked={options[i].isCorrect}
									disabled={options[i].text.trim() === ""}
									onchange={(e: Event) =>
										updateOption(i, { isCorrect: (e.currentTarget as HTMLInputElement).checked })}
									title={options[i].text.trim() === ""
										? "Type an answer first"
										: "Mark as correct answer"} />
							</div>

							<TextArea
								value={options[i].text}
								oninput={(e) => updateOption(i, { text: (e.target as HTMLTextAreaElement).value })}
								placeholder={`Add answer ${i + 1}...`}
								maxlength={100}
								headless
								maxRows={4}
								style="background: transparent; border: none; outline: none; width: 100%; color: inherit; font-family: inherit; font-size: inherit; font-weight: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
						</div>
					</Field>
				</div>
			{/each}
		</div>
	</div>
</Flex>
