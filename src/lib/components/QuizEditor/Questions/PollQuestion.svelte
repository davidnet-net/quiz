<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Icon,
		IconButton,
		TextArea,
		TextField
	} from "@davidnet-net/svelte-ui";
	import * as styles from "./SharedQuestion.css";

	let {
		question,
		onUpdate
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
	} = $props();

	const MIN_OPTIONS = 2;
	const MAX_OPTIONS = 6;

	const COLORS = [
		"rgba(239, 68, 68, 1)",
		"rgba(59, 130, 246, 1)",
		"rgba(168, 85, 247, 1)",
		"rgba(34, 197, 94, 1)",
		"rgba(245, 158, 11, 1)",
		"rgba(236, 72, 153, 1)"
	];

	function makeOption(index: number): any {
		return {
			id: crypto.randomUUID(),
			text: "",
			isCorrect: false,
			color: COLORS[index % COLORS.length]
		};
	}

	let options = $derived(
		Array.isArray(question?.options) && question.options.length >= MIN_OPTIONS
			? question.options
			: [makeOption(0), makeOption(1)]
	);

	function updateOptionText(index: number, text: string) {
		const newOptions = [...options];
		newOptions[index] = { ...newOptions[index], text };
		onUpdate({ options: newOptions });
	}

	function addOption() {
		if (options.length >= MAX_OPTIONS) return;
		onUpdate({ options: [...options, makeOption(options.length)] });
	}

	function removeOption(index: number) {
		if (options.length <= MIN_OPTIONS) return;
		onUpdate({ options: options.filter((_: any, i: number) => i !== index) });
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
				placeholder="Start typing your poll question..."
				maxlength={250}
				headless
				style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
		</Field>
	</div>

	<div class={styles.imageContainer}><Icon icon="image" size="giant" /></div>

	<div class={styles.listContainer}>
		{#each options as option, i (option.id)}
			<div class={styles.listItemRow}>
				<div
					style="width: 1rem; height: 1rem; border-radius: 4px; flex-shrink: 0; background-color: {option.color};">
				</div>
				<TextField
					value={option.text}
					maxlength={100}
					placeholder={`Option ${i + 1}...`}
					oninput={(e) => updateOptionText(i, (e.target as HTMLInputElement).value)}
					style="width: 100%;" />
				<IconButton
					icon="close"
					tip="Remove option"
					disabled={options.length <= MIN_OPTIONS}
					onclick={() => removeOption(i)} />
			</div>
		{/each}
		<Button
			iconbefore="add"
			appearance="default"
			disabled={options.length >= MAX_OPTIONS}
			onclick={addOption}>
			Add option
		</Button>
	</div>
</Flex>
