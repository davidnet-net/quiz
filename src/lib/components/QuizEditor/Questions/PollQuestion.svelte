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

	import * as styles from "./SharedQuestion.css";
	import * as m from "$lib/paraglide/messages.js";

	let {
		question,
		onUpdate,
		onUploadImage
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
		onUploadImage: (questionId: string, file: File) => Promise<string | null>;
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
		<Field label={m.editor_question_label()} name="question" overidelabel style="width: 100%;">
			<TextArea
				value={question?.text || ""}
				oninput={(e) => onUpdate({ text: (e.target as HTMLTextAreaElement).value })}
				placeholder={m.editor_poll_placeholder()}
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
						{m.common_cancel()}
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
					placeholder={m.editor_media_youtube_placeholder()} />
				<Button appearance="subtle" alignContent="left" iconbefore="close" onclick={clearMedia}>
					{m.editor_media_remove_video()}
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
						{m.editor_media_add_image()}
					</Button>
					<Button
						appearance="subtle"
						iconbefore="smart_display"
						onclick={() => onUpdate({ mediaType: "youtube", mediaUrl: null })}>
						{m.editor_media_embed_youtube()}
					</Button>
				</Flex>
			</Flex>
		{/if}
	</div>

	<div class={styles.listContainer}>
		{#each options as option, i (option.id)}
			<div class={styles.listItemRow}>
				<div
					style="width: 1rem; height: 1rem; border-radius: 4px; flex-shrink: 0; background-color: {option.color};">
				</div>
				<TextField
					value={option.text}
					maxlength={100}
					placeholder={m.editor_option_placeholder({ num: i + 1 })}
					oninput={(e) => updateOptionText(i, (e.target as HTMLInputElement).value)}
					style="width: 100%;" />
				<IconButton
					icon="close"
					tip={m.editor_remove_option_tip()}
					disabled={options.length <= MIN_OPTIONS}
					onclick={() => removeOption(i)} />
			</div>
		{/each}
		<Button
			iconbefore="add"
			appearance="default"
			disabled={options.length >= MAX_OPTIONS}
			onclick={addOption}>
			{m.editor_add_option()}
		</Button>
	</div>
</Flex>
