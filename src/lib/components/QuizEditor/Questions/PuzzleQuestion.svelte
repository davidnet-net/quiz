<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Icon,
		IconButton,
		ImageUpload,
		TextArea,
		TextField
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import * as styles from "./SharedQuestion.css";

	let {
		question,
		onUpdate,
		onUploadImage
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
		onUploadImage: (questionId: string, file: File) => Promise<string | null>;
	} = $props();

	const MIN_ITEMS = 2;
	const MAX_ITEMS = 6;

	function makeOption(): any {
		return { id: crypto.randomUUID(), text: "", isCorrect: true, color: "" };
	}

	let options = $derived(
		Array.isArray(question?.options) && question.options.length >= MIN_ITEMS
			? question.options
			: [makeOption(), makeOption()]
	);

	function updateOptionText(index: number, text: string) {
		const newOptions = [...options];
		newOptions[index] = { ...newOptions[index], text };
		onUpdate({ options: newOptions });
	}

	function addOption() {
		if (options.length >= MAX_ITEMS) return;
		onUpdate({ options: [...options, makeOption()] });
	}

	function removeOption(index: number) {
		if (options.length <= MIN_ITEMS) return;
		onUpdate({ options: options.filter((_: any, i: number) => i !== index) });
	}

	function moveOption(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= options.length) return;
		const newOptions = [...options];
		[newOptions[index], newOptions[target]] = [newOptions[target], newOptions[index]];
		onUpdate({ options: newOptions });
	}

	async function handleImageUpload(file: File): Promise<string | null> {
		const url = await onUploadImage(question.id, file);
		if (url) onUpdate({ mediaUrl: url, mediaType: "image" });
		return url;
	}

	function clearMedia() {
		onUpdate({ mediaUrl: null, mediaType: null });
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
				placeholder="Start typing your puzzle instructions..."
				maxlength={250}
				headless
				style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
		</Field>
	</div>

	<div class={styles.imageContainer}>
		{#if question?.mediaType === "image"}
			<Flex
				direction="column"
				gap="xsmall"
				style="width: 100%;"
				justifyContent="center"
				alignItems="center">
				<ImageUpload
					value={question?.mediaUrl || null}
					onUpload={handleImageUpload}
					onRemove={clearMedia} />
				{#if !question?.mediaUrl}
					<Button appearance="subtle" alignContent="left" iconbefore="close" onclick={clearMedia}>
						Cancel
					</Button>
				{/if}
			</Flex>
		{:else if question?.mediaType === "youtube"}
			<Flex
				direction="column"
				gap="xsmall"
				style="width: 100%;"
				justifyContent="center"
				alignItems="center">
				<TextField
					value={question?.mediaUrl || ""}
					oninput={(e) =>
						onUpdate({
							mediaUrl: (e.target as HTMLInputElement).value,
							mediaType: "youtube"
						})}
					placeholder="Paste a YouTube URL..." />
				<Button appearance="subtle" alignContent="left" iconbefore="close" onclick={clearMedia}>
					Remove video
				</Button>
			</Flex>
		{:else}
			<Flex gap="medium" justifyContent="center" alignItems="center" direction="column">
				<Icon icon="image" size="giant" />
				<Flex gap="small" justifyContent="center" alignItems="center" height="fit-content">
					<Button
						appearance="subtle"
						iconbefore="add_photo_alternate"
						onclick={() => onUpdate({ mediaType: "image", mediaUrl: null })}>
						Add image
					</Button>
					<Button
						appearance="subtle"
						iconbefore="smart_display"
						onclick={() => onUpdate({ mediaType: "youtube", mediaUrl: null })}>
						Embed YouTube
					</Button>
				</Flex>
			</Flex>
		{/if}
	</div>

	<p style="color: {token.theme.color.text.secondary};">
		List the items in the correct order. Players see them shuffled and must put them back in this
		order.
	</p>

	<div class={styles.listContainer}>
		{#each options as option, i (option.id)}
			<div class={styles.listItemRow}>
				<span style="font-weight: bold; width: 1.5rem; flex-shrink: 0; text-align: center;">
					{i + 1}
				</span>
				<TextField
					value={option.text}
					maxlength={100}
					placeholder={`Item ${i + 1}...`}
					oninput={(e) => updateOptionText(i, (e.target as HTMLInputElement).value)}
					style="width: 100%;" />
				<IconButton
					icon="arrow_upward"
					tip="Move up"
					disabled={i === 0}
					onclick={() => moveOption(i, -1)} />
				<IconButton
					icon="arrow_downward"
					tip="Move down"
					disabled={i === options.length - 1}
					onclick={() => moveOption(i, 1)} />
				<IconButton
					icon="close"
					tip="Remove item"
					disabled={options.length <= MIN_ITEMS}
					onclick={() => removeOption(i)} />
			</div>
		{/each}
		<Button
			iconbefore="add"
			appearance="default"
			disabled={options.length >= MAX_ITEMS}
			onclick={addOption}>
			Add item
		</Button>
	</div>
</Flex>
