<script lang="ts">
	import { Field, Flex, Icon, TextArea, TextField } from "@davidnet-net/svelte-ui";

	import * as styles from "./SharedQuestion.css";

	let {
		question,
		onUpdate
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
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
				placeholder="Start typing your slider question..."
				maxlength={250}
				headless
				style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
		</Field>
	</div>

	<div class={styles.imageContainer}><Icon icon="image" size="giant" /></div>

	<div class={styles.settingsRow}>
		<Field label="Minimum" name="slider_min">
			<TextField
				type="number"
				value={String(settings.min)}
				oninput={(e) => updateSetting("min", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="Maximum" name="slider_max">
			<TextField
				type="number"
				value={String(settings.max)}
				oninput={(e) => updateSetting("max", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="Step" name="slider_step">
			<TextField
				type="number"
				value={String(settings.step)}
				oninput={(e) => updateSetting("step", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="Correct value" name="slider_correct">
			<TextField
				type="number"
				value={String(settings.correctValue)}
				oninput={(e) => updateSetting("correctValue", (e.target as HTMLInputElement).value)} />
		</Field>
		<Field label="Tolerance (+/-)" name="slider_tolerance">
			<TextField
				type="number"
				value={String(settings.tolerance)}
				oninput={(e) => updateSetting("tolerance", (e.target as HTMLInputElement).value)} />
		</Field>
	</div>
</Flex>
