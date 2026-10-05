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

	const defaultSettings = { min: 0, max: 100, step: 1, correctValue: 50, tolerance: 0 };

	let settings = $derived({ ...defaultSettings, ...(question?.settings || {}) });

	function updateSetting(key: string, raw: string) {
		const value = Number(raw);
		onUpdate({
			settings: {
				...settings,
				[key]: isNaN(value) ? settings[key as keyof typeof settings] : value
			}
		});
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
				placeholder={m.editor_slider_placeholder()}
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

	<div class={styles.settingsRow}>
		<Field label={m.editor_minimum_label()} name="slider_min">
			<TextField
				type="number"
				value={String(settings.min)}
				oninput={(e) => updateSetting("min", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label={m.editor_maximum_label()} name="slider_max">
			<TextField
				type="number"
				value={String(settings.max)}
				oninput={(e) => updateSetting("max", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label={m.editor_step_label()} name="slider_step">
			<TextField
				type="number"
				value={String(settings.step)}
				oninput={(e) => updateSetting("step", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label={m.editor_correct_value_label()} name="slider_correct">
			<TextField
				type="number"
				value={String(settings.correctValue)}
				oninput={(e) => updateSetting("correctValue", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label={m.editor_tolerance_label()} name="slider_tolerance">
			<TextField
				type="number"
				value={String(settings.tolerance)}
				oninput={(e) => updateSetting("tolerance", (e.target as HTMLInputElement).value)} />
		</Field>
	</div>
</Flex>
