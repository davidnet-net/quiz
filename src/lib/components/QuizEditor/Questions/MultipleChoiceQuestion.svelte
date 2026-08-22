<script lang="ts">
	import { Flex } from "@davidnet-net/svelte-ui";
	import * as styles from "./MultipleChoiceQuestion.css";

	// Define the expected props passed down from +page.svelte
	let {
		question,
		onUpdate
	}: {
		question: any;
		onUpdate: (updates: Record<string, any>) => void;
	} = $props();
</script>

<Flex direction="column" padding="medium" alignItems="center" gap="medium" style="width: 100%;">
	<div class={styles.questionContainer}>
		<!-- 
            Transform the static span into a borderless input field. 
            When the user types, it fires the onUpdate callback, syncing with Yjs instantly.
        -->
		<input
			class={styles.question}
			value={question?.text || ""}
			oninput={(e) => onUpdate({ text: e.currentTarget.value })}
			placeholder="Start typing your question..."
			style="background: transparent; border: none; text-align: center; width: 100%; outline: none; color: inherit; font-family: inherit; font-size: inherit;" />
	</div>
	<div class={styles.imageContainer}></div>

	<div class={styles.answerContainer}>
		<!-- 
            Note: You can apply the exact same <input> logic to these buttons in the future 
            to allow users to edit the answers collaboratively!
        -->
		<div class={styles.answerRow}>
			<button
				class={styles.answerBox}
				style="background-color: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239, 68, 68, 0.4);">
				Davidnet Quiz
			</button>
			<button
				class={styles.answerBox}
				style="background-color: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.4);">
				Kahoot
			</button>
		</div>
		<div class={styles.answerRow}>
			<button
				class={styles.answerBox}
				style="background-color: rgba(168, 85, 247, 0.25); border: 1px solid rgba(168, 85, 247, 0.4);">
				Antwoord C
			</button>
			<button
				class={styles.answerBox}
				style="background-color: rgba(34, 197, 94, 0.25); border: 1px solid rgba(34, 197, 94, 0.4);">
				Antwoord D
			</button>
		</div>
	</div>
</Flex>
