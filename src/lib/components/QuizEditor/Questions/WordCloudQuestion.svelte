<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Icon,
		ImageUpload,
		TextArea,
		TextField
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

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
				placeholder={m.editor_wordcloud_placeholder()}
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

	<p style="color: {token.theme.color.text.secondary}; text-align: center; max-width: 30rem;">
		{m.editor_wordcloud_note()}
	</p>
</Flex>
