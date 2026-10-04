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

	let {
		question,
		onUpdate,
		onUploadImage
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
		onUploadImage: (questionId: string, file: File) => Promise<string | null>;
	} = $props();

	const defaultSettings = { min: 1, max: 10, minLabel: "", maxLabel: "" };

	let settings = $derived({ ...defaultSettings, ...(question?.settings || {}) });

	function updateNumberSetting(key: "min" | "max", raw: string) {
		const value = Number(raw);
		onUpdate({ settings: { ...settings, [key]: isNaN(value) ? settings[key] : value } });
	}

	function updateTextSetting(key: "minLabel" | "maxLabel", value: string) {
		onUpdate({ settings: { ...settings, [key]: value } });
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
				placeholder="Start typing your rating question..."
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

	<div class={styles.settingsRow}>
		<Field label="Minimum" name="scale_min">
			<TextField
				type="number"
				value={String(settings.min)}
				oninput={(e) => updateNumberSetting("min", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="Maximum" name="scale_max">
			<TextField
				type="number"
				value={String(settings.max)}
				oninput={(e) => updateNumberSetting("max", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="Low label" name="scale_min_label">
			<TextField
				value={settings.minLabel}
				maxlength={50}
				placeholder="e.g. Not great"
				oninput={(e) => updateTextSetting("minLabel", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="High label" name="scale_max_label">
			<TextField
				value={settings.maxLabel}
				maxlength={50}
				placeholder="e.g. Amazing"
				oninput={(e) => updateTextSetting("maxLabel", (e.target as HTMLInputElement).value)} />
		</Field>
	</div>
</Flex>
