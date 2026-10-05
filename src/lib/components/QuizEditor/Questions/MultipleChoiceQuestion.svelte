<script lang="ts">
	import {
		Button,
		Checkbox,
		Field,
		Flex,
		Icon,
		ImageUpload,
		TextArea,
		TextField
	} from "@davidnet-net/svelte-ui";
	import * as styles from "./MultipleChoiceQuestion.css";
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

	async function handleImageUpload(file: File): Promise<string | null> {
		const url = await onUploadImage(question.id, file);
		if (url) onUpdate({ mediaUrl: url, mediaType: "image" });
		return url;
	}

	function clearMedia() {
		onUpdate({ mediaUrl: null, mediaType: null });
	}

	/**
	 * Updates an option payload and handles logical deselects for single-select mode.
	 */
	function updateOption(index: number, updates: Record<string, any>) {
		const newOptions = [...options];
		const nextText = updates.text !== undefined ? updates.text : newOptions[index].text;

		if (nextText.trim() === "") {
			updates.isCorrect = false;
		}

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

	<div class={styles.answerContainer}>
		{#each [[0, 1], [2, 3]] as rowIndices}
			<div class={styles.answerRow}>
				{#each rowIndices as i}
					<div
						class={styles.answerBox}
						style="background-color: {options[i].bg}; border: 1px solid {options[i]
							.color}; padding: 1rem; box-sizing: border-box;">
						<Field
							label={m.editor_answer_label({ num: i + 1 })}
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
											? m.editor_type_answer_first_tip()
											: m.common_mark_correct_tip()} />
								</div>

								<TextArea
									value={options[i].text}
									oninput={(e) =>
										updateOption(i, { text: (e.target as HTMLTextAreaElement).value })}
									placeholder={m.editor_answer_placeholder({ num: i + 1 })}
									maxlength={100}
									headless
									maxRows={4}
									style="background: transparent; border: none; outline: none; width: 100%; color: inherit; font-family: inherit; font-size: inherit; font-weight: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
							</div>
						</Field>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</Flex>
