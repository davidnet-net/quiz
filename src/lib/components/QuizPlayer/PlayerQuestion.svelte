<script lang="ts">
	import { Flex, Button } from "@davidnet-net/svelte-ui";
	import * as styles from "./PlayerQuestion.css";

	let { payload, onsubmit }: { payload: any; onsubmit: (ids: string[]) => void } = $props();

	let options = $derived(
		(payload?.options || []).filter((opt: any) => opt.text && opt.text.trim() !== "")
	);
	let isMultiSelect = $derived(payload?.question?.isMultiSelect || false);
	let isTrueFalse = $derived(payload?.question?.type === "true_false");

	let selectedIds = $state<string[]>([]);
	let submitted = $state(false);

	const defaultColors = [
		"rgba(239, 68, 68, 1)", // Red
		"rgba(59, 130, 246, 1)", // Blue
		"rgba(168, 85, 247, 1)", // Purple
		"rgba(34, 197, 94, 1)" // Green
	];

	function handleBlockClick(optionId: string) {
		if (submitted) return;

		if (isMultiSelect) {
			if (selectedIds.includes(optionId)) {
				selectedIds = selectedIds.filter((id) => id !== optionId);
			} else {
				selectedIds = [...selectedIds, optionId];
			}
		} else {
			selectedIds = [optionId];
			submitAnswer();
		}
	}

	function submitAnswer() {
		if (selectedIds.length === 0 || submitted) return;
		submitted = true;
		onsubmit(selectedIds);
	}
</script>

<Flex
	justifyContent="center"
	alignItems="center"
	direction="column"
	style="width: 100%; height: 100%;">
	<h1 style="margin-bottom: 2rem;">
		{isMultiSelect ? "Select all that apply" : "Select the correct answer"}
	</h1>

	<div
		class={styles.container}
		style={isTrueFalse
			? "display: flex; flex-direction: row; align-items: stretch; gap: 1rem; width: 100%; height: 60vh;"
			: "width: 100%; height: 60vh;"}>
		{#each options as option, i}
			<button
				class={styles.colorBlock}
				style="
                    flex: 1; 
                    background-color: {defaultColors[i] || option.color}; 
                    opacity: {isMultiSelect &&
				selectedIds.length > 0 &&
				!selectedIds.includes(option.id)
					? 0.6
					: 1};
                    transform: {selectedIds.includes(option.id) ? 'scale(0.95)' : 'none'};
                    border: {selectedIds.includes(option.id) ? '5px solid white' : 'none'};
                "
				onclick={() => handleBlockClick(option.id)}
				disabled={submitted}
				aria-label="Select answer">
			</button>
		{/each}
	</div>

	{#if isMultiSelect}
		<div style="margin-top: 2rem;">
			<Button
				appearance="primary"
				onclick={submitAnswer}
				disabled={selectedIds.length === 0 || submitted}>
				Submit Answer
			</Button>
		</div>
	{/if}
</Flex>
