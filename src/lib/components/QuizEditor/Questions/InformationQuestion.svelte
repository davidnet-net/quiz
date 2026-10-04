<script lang="ts">
	import { Field, Flex, Icon, TextArea } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import * as styles from "./SharedQuestion.css";

	let {
		question,
		onUpdate
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
	} = $props();
</script>

<Flex
	direction="column"
	padding="medium"
	alignItems="center"
	gap="medium"
	justifyContent="spaceAround"
	style="width: 100%;">
	<div class={styles.questionContainer}>
		<Field label="Slide content" name="question" overidelabel style="width: 100%;">
			<TextArea
				value={question?.text || ""}
				oninput={(e) => onUpdate({ text: (e.target as HTMLTextAreaElement).value })}
				placeholder="Write what you want to show the players..."
				maxlength={250}
				headless
				style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit; resize: none; word-break: break-word; overflow-wrap: break-word;" />
		</Field>
	</div>

	<div class={styles.imageContainer}><Icon icon="image" size="giant" /></div>

	<p style="color: {token.theme.color.text.secondary};">
		This is an information slide. No answers are collected — players just read along until the host
		moves on.
	</p>
</Flex>
