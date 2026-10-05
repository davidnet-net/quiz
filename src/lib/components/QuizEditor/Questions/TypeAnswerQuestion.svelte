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

	const MAX_ANSWERS = 5;

	function makeOption(): any {
		return { id: crypto.randomUUID(), text: "", isCorrect: true, color: "" };
	}

	let options = $derived(
		Array.isArray(question?.options) && question.options.length > 0
			? question.options
			: [makeOption()]
	);

	function updateOptionText(index: number, text: string) {
		const newOptions = [...options];
		newOptions[index] = { ...newOptions[index], text };
		onUpdate({ options: newOptions });
	}

	function addOption() {
		if (options.length >= MAX_ANSWERS) return;
		onUpdate({ options: [...options, makeOption()] });
	}

	function removeOption(index: number) {
		if (options.length <= 1) return;
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
				placeholder={m.editor_generic_question_placeholder()}
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
				<TextField
					value={option.text}
					maxlength={100}
					placeholder={m.editor_accepted_answer_placeholder({ num: i + 1 })}
					oninput={(e) => updateOptionText(i, (e.target as HTMLInputElement).value)}
					style="width: 100%;" />
				<IconButton
					icon="close"
					tip={m.editor_remove_answer_tip()}
					disabled={options.length <= 1}
					onclick={() => removeOption(i)} />
			</div>
		{/each}
		<Button
			iconbefore="add"
			appearance="default"
			disabled={options.length >= MAX_ANSWERS}
			onclick={addOption}>
			{m.editor_add_accepted_answer()}
		</Button>
	</div>
</Flex>
