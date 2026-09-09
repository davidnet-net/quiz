<script lang="ts">
	import { Icon } from "@davidnet-net/svelte-ui";
	import * as styles from "./PresenterQuestion.css";

	let { payload }: { payload: any } = $props();

	let options = $derived(payload?.options || []);

	const defaultColors = [
		{ color: "rgba(239, 68, 68, 1)", bg: "rgba(239, 68, 68, 0.25)" },
		{ color: "rgba(59, 130, 246, 1)", bg: "rgba(59, 130, 246, 0.25)" },
		{ color: "rgba(168, 85, 247, 1)", bg: "rgba(168, 85, 247, 0.25)" },
		{ color: "rgba(34, 197, 94, 1)", bg: "rgba(34, 197, 94, 0.25)" }
	];
</script>

<div class={styles.container}>
	<div class={styles.questionContainer}>
		<div class={styles.questionText}>
			{payload?.question?.text || "..."}
		</div>
	</div>

	<div class={styles.imageContainer}>
		<Icon icon="image" size="giant" />
	</div>

	<div class={styles.answerContainer}>
		{#each [[0, 1], [2, 3]] as rowIndices}
			<div class={styles.answerRow}>
				{#each rowIndices as i}
					{#if options[i]}
						<div
							class={styles.answerBox}
							style="background-color: {defaultColors[i].bg}; border: 1px solid {defaultColors[i]
								.color};">
							<span>{options[i].text}</span>
						</div>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>
