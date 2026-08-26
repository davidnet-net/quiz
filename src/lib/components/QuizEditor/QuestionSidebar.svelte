<script lang="ts">
	import { Button, Divider, Dropdown, Flex, Icon, IconButton } from "@davidnet-net/svelte-ui";
	import * as styles from "./Sidebar.css.ts";

	let {
		question,
		questionSidebarOpened = true,
		openDropdown = null,
		loading,
		onToggle,
		onDropdownToggle,
		onUpdate,
		onDelete,
		onDuplicate
	}: {
		question: any;
		questionSidebarOpened: boolean;
		openDropdown: string | null;
		loading: boolean;
		onToggle: () => void;
		onDropdownToggle: (name: string | null) => void;
		onUpdate: (updates: Record<string, any>) => void;
		onDelete: () => void;
		onDuplicate: () => void;
	} = $props();

	// Derived states for UI display
	let timeLimitDisplay = $derived(
		question?.timeLimit ? `${question.timeLimit} seconds` : "20 seconds"
	);
	let pointsDisplay = $derived(question?.pointsMultiplier === 2 ? "Double points" : "Standard");
	let answerOptionsDisplay = $derived(question?.isMultiSelect ? "Multi select" : "Single select");

	// Helper function to safely switch to single select and uncheck extra correct answers
	function setSingleSelect() {
		const currentOptions = Array.isArray(question?.options) ? question.options : [];
		let firstCorrectFound = false;

		// Map over options: keep the first one that is correct, uncheck the rest
		const sanitizedOptions = currentOptions.map((opt: any) => {
			if (opt.isCorrect) {
				if (!firstCorrectFound) {
					firstCorrectFound = true;
					return { ...opt };
				}
				return { ...opt, isCorrect: false }; // Uncheck extra correct answers
			}
			return { ...opt };
		});

		// Save both the toggle state AND the cleaned-up options simultaneously
		onUpdate({
			isMultiSelect: false,
			options: sanitizedOptions
		});

		onDropdownToggle(null);
	}
</script>

{#if !questionSidebarOpened}
	<div class={styles.compactSidebar}>
		<!-- Swapped to native div to secure scrolling geometry -->
		<div
			style="display: flex; flex-direction: column; gap: 8px; align-items: center; flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 8px;">
			<Dropdown isOpen={openDropdown === "compact-time-limit"}>
				{#snippet trigger()}
					<IconButton
						{loading}
						icon="schedule"
						appearance="default"
						tip={`Time limit (${timeLimitDisplay})`}
						onclick={() =>
							onDropdownToggle(
								openDropdown === "compact-time-limit" ? null : "compact-time-limit"
							)} />
				{/snippet}
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 10 });
						onDropdownToggle(null);
					}}>
					10 seconds
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 20 });
						onDropdownToggle(null);
					}}>
					20 seconds
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 30 });
						onDropdownToggle(null);
					}}>
					30 seconds
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 60 });
						onDropdownToggle(null);
					}}>
					60 seconds
				</Button>
			</Dropdown>

			<Dropdown isOpen={openDropdown === "compact-points"}>
				{#snippet trigger()}
					<IconButton
						{loading}
						icon="workspace_premium"
						appearance="default"
						tip={`Points (${pointsDisplay})`}
						onclick={() =>
							onDropdownToggle(openDropdown === "compact-points" ? null : "compact-points")} />
				{/snippet}
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ pointsMultiplier: 1 });
						onDropdownToggle(null);
					}}>
					Standard
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ pointsMultiplier: 2 });
						onDropdownToggle(null);
					}}>
					Double points
				</Button>
			</Dropdown>

			<Dropdown isOpen={openDropdown === "compact-answer-options"}>
				{#snippet trigger()}
					<IconButton
						{loading}
						icon="view_cozy"
						appearance="default"
						tip={`Answer options (${answerOptionsDisplay})`}
						onclick={() =>
							onDropdownToggle(
								openDropdown === "compact-answer-options" ? null : "compact-answer-options"
							)} />
				{/snippet}
				<Button {loading} appearance="subtle" alignContent="left" onclick={setSingleSelect}>
					Single select
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ isMultiSelect: true });
						onDropdownToggle(null);
					}}>
					Multi select
				</Button>
			</Dropdown>
			<br />
			<br />
			<IconButton
				{loading}
				icon="control_point_duplicate"
				appearance="default"
				tip="Duplicate"
				onclick={onDuplicate} />
			<IconButton
				{loading}
				icon="delete_forever"
				appearance="default"
				tip="Delete question"
				onclick={onDelete} />
		</div>
		<IconButton icon="right_panel_open" tip="Open sidebar" onclick={onToggle} />
	</div>
{:else}
	<div class={styles.sidebar}>
		<div
			style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start; width: 100%; flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 8px;">
			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="schedule" />
				<span>Time limit</span>
			</Flex>
			<Dropdown isOpen={openDropdown === "time-limit"} stretchWidthTrigger>
				{#snippet trigger()}
					<Button
						{loading}
						alignContent="left"
						stretchwidth
						appearance="default"
						onclick={() => onDropdownToggle(openDropdown === "time-limit" ? null : "time-limit")}>
						{timeLimitDisplay}
					</Button>
				{/snippet}
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 10 });
						onDropdownToggle(null);
					}}>
					10 seconds
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 20 });
						onDropdownToggle(null);
					}}>
					20 seconds
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 30 });
						onDropdownToggle(null);
					}}>
					30 seconds
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ timeLimit: 60 });
						onDropdownToggle(null);
					}}>
					60 seconds
				</Button>
			</Dropdown>

			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="workspace_premium" />
				<span>Points</span>
			</Flex>
			<Dropdown isOpen={openDropdown === "points"} stretchWidthTrigger>
				{#snippet trigger()}
					<Button
						{loading}
						alignContent="left"
						stretchwidth
						appearance="default"
						onclick={() => onDropdownToggle(openDropdown === "points" ? null : "points")}>
						{pointsDisplay}
					</Button>
				{/snippet}
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ pointsMultiplier: 1 });
						onDropdownToggle(null);
					}}>
					Standard
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ pointsMultiplier: 2 });
						onDropdownToggle(null);
					}}>
					Double points
				</Button>
			</Dropdown>

			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="view_cozy" />
				<span>Answer options</span>
			</Flex>
			<Dropdown isOpen={openDropdown === "answer-options"} stretchWidthTrigger>
				{#snippet trigger()}
					<Button
						{loading}
						alignContent="left"
						stretchwidth
						appearance="default"
						onclick={() =>
							onDropdownToggle(openDropdown === "answer-options" ? null : "answer-options")}>
						{answerOptionsDisplay}
					</Button>
				{/snippet}
				<Button {loading} appearance="subtle" alignContent="left" onclick={setSingleSelect}>
					Single select
				</Button>
				<Button
					{loading}
					appearance="subtle"
					alignContent="left"
					onclick={() => {
						onUpdate({ isMultiSelect: true });
						onDropdownToggle(null);
					}}>
					Multi select
				</Button>
			</Dropdown>

			<br />
			<Divider color="tertiary" />
			<br />
			<Button {loading} alignContent="left" stretchwidth appearance="default" onclick={onDuplicate}>
				Duplicate
			</Button>
			<Button {loading} alignContent="left" stretchwidth appearance="default" onclick={onDelete}>
				Delete question
			</Button>
		</div>
		<div>
			<IconButton icon="right_panel_close" tip="Close sidebar" onclick={onToggle} />
		</div>
	</div>
{/if}
