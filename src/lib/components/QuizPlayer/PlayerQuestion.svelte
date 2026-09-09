<script lang="ts">
	import { Flex } from "@davidnet-net/svelte-ui";
	import * as styles from "./PlayerQuestion.css";

	let { payload }: { payload: any } = $props();

	const defaultColors = [
		"rgba(239, 68, 68, 1)", // Red
		"rgba(59, 130, 246, 1)", // Blue
		"rgba(168, 85, 247, 1)", // Purple
		"rgba(34, 197, 94, 1)" // Green
	];

	function handleBlockClick(optionId: string) {
		console.log("Clicked option:", optionId);
	}
</script>

<Flex justifyContent="center" alignItems="center" direction="column">
	<h1>Select the correct answer.</h1>
	<div class={styles.container}>
		{#each payload?.options || [] as option, i}
			<button
				class={styles.colorBlock}
				style="background-color: {defaultColors[i] || option.color};"
				onclick={() => handleBlockClick(option.id)}
				aria-label="Select answer">
			</button>
		{/each}
	</div>
</Flex>
