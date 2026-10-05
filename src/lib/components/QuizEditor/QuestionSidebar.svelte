<script lang="ts">
	import { Button, Divider, Dropdown, Flex, Icon, IconButton } from "@davidnet-net/svelte-ui";

	import * as styles from "./Sidebar.css.ts";
	import * as m from "$lib/paraglide/messages.js";

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

	let timeLimitDisplay = $derived(
		m.sidebar_seconds_option({ num: question?.timeLimit ? question.timeLimit : 20 })
	);
	let pointsDisplay = $derived(
		question?.pointsMultiplier === 2 ? m.sidebar_double_points() : m.sidebar_standard_points()
	);
	let answerOptionsDisplay = $derived(
		question?.isMultiSelect ? m.sidebar_multi_select() : m.sidebar_single_select()
	);
	let showAnswerOptionsControl = $derived(question?.type === "quiz" || question?.type === "poll");

	const REVEAL_MODE_LABELS: Record<string, string> = {
		instant: m.sidebar_reveal_instant(),
		fade: m.sidebar_reveal_fade(),
		blur: m.sidebar_reveal_blur(),
		slide: m.sidebar_reveal_slide()
	};
	let revealModeDisplay = $derived(REVEAL_MODE_LABELS[question?.revealMode] ?? m.sidebar_reveal_instant());
	let hasImage = $derived(question?.mediaType === "image");

	/**
	 * Reverts question format to single-select, ensuring only the first
	 * marked correct answer remains selected.
	 */
	function setSingleSelect() {
		const currentOptions = Array.isArray(question?.options) ? question.options : [];
		let firstCorrectFound = false;

		const sanitizedOptions = currentOptions.map((opt: any) => {
			if (opt.isCorrect) {
				if (!firstCorrectFound) {
					firstCorrectFound = true;
					return { ...opt };
				}
				return { ...opt, isCorrect: false };
			}
			return { ...opt };
		});

		onUpdate({
			isMultiSelect: false,
			options: sanitizedOptions
		});

		onDropdownToggle(null);
	}
</script>

{#if !questionSidebarOpened}
	<div class={styles.compactSidebar}>
		<div
			style="display: flex; flex-direction: column; gap: 8px; align-items: center; flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 8px;">
			<Dropdown isOpen={openDropdown === "compact-time-limit"}>
				{#snippet trigger()}
					<IconButton
						{loading}
						icon="schedule"
						appearance="default"
						tip={m.sidebar_time_limit_tip({ display: timeLimitDisplay })}
						onclick={() =>
							onDropdownToggle(
								openDropdown === "compact-time-limit" ? null : "compact-time-limit"
							)} />
				{/snippet}
				{#each [10, 20, 30, 60] as time}
					<Button
						{loading}
						appearance="subtle"
						alignContent="left"
						onclick={() => {
							onUpdate({ timeLimit: time });
							onDropdownToggle(null);
						}}>
						{m.sidebar_seconds_option({ num: time })}
					</Button>
				{/each}
			</Dropdown>

			<Dropdown isOpen={openDropdown === "compact-points"}>
				{#snippet trigger()}
					<IconButton
						{loading}
						icon="workspace_premium"
						appearance="default"
						tip={m.sidebar_points_tip({ display: pointsDisplay })}
						onclick={() =>
							onDropdownToggle(openDropdown === "compact-points" ? null : "compact-points")} />
				{/snippet}
				{#each [{ label: m.sidebar_standard_points(), value: 1 }, { label: m.sidebar_double_points(), value: 2 }] as point}
					<Button
						{loading}
						appearance="subtle"
						alignContent="left"
						onclick={() => {
							onUpdate({ pointsMultiplier: point.value });
							onDropdownToggle(null);
						}}>
						{point.label}
					</Button>
				{/each}
			</Dropdown>

			{#if hasImage}
				<Dropdown isOpen={openDropdown === "compact-reveal-mode"}>
					{#snippet trigger()}
						<IconButton
							{loading}
							icon="animation"
							appearance="default"
							tip={m.sidebar_reveal_mode_tip({ display: revealModeDisplay })}
							onclick={() =>
								onDropdownToggle(
									openDropdown === "compact-reveal-mode" ? null : "compact-reveal-mode"
								)} />
					{/snippet}
					{#each Object.entries(REVEAL_MODE_LABELS) as [value, label]}
						<Button
							{loading}
							appearance="subtle"
							alignContent="left"
							onclick={() => {
								onUpdate({ revealMode: value });
								onDropdownToggle(null);
							}}>
							{label}
						</Button>
					{/each}
				</Dropdown>
			{/if}

			{#if showAnswerOptionsControl}
				<Dropdown isOpen={openDropdown === "compact-answer-options"}>
					{#snippet trigger()}
						<IconButton
							{loading}
							icon="view_cozy"
							appearance="default"
							tip={m.sidebar_answer_options_tip({ display: answerOptionsDisplay })}
							onclick={() =>
								onDropdownToggle(
									openDropdown === "compact-answer-options" ? null : "compact-answer-options"
								)} />
					{/snippet}
					<Button {loading} appearance="subtle" alignContent="left" onclick={setSingleSelect}>
						{m.sidebar_single_select()}
					</Button>
					<Button
						{loading}
						appearance="subtle"
						alignContent="left"
						onclick={() => {
							onUpdate({ isMultiSelect: true });
							onDropdownToggle(null);
						}}>
						{m.sidebar_multi_select()}
					</Button>
				</Dropdown>
			{/if}
			<br />
			<br />
			<IconButton
				{loading}
				icon="control_point_duplicate"
				appearance="default"
				tip={m.sidebar_duplicate()}
				onclick={onDuplicate} />
			<IconButton
				{loading}
				icon="delete_forever"
				appearance="default"
				tip={m.sidebar_delete_question()}
				onclick={onDelete} />
		</div>
		<IconButton icon="right_panel_open" tip={m.sidebar_open_tip()} onclick={onToggle} />
	</div>
{:else}
	<div class={styles.sidebar}>
		<div
			style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start; width: 100%; flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 8px;">
			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="schedule" />
				<span>{m.sidebar_time_limit_label()}</span>
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
				{#each [10, 20, 30, 60] as time}
					<Button
						{loading}
						appearance="subtle"
						alignContent="left"
						onclick={() => {
							onUpdate({ timeLimit: time });
							onDropdownToggle(null);
						}}>
						{m.sidebar_seconds_option({ num: time })}
					</Button>
				{/each}
			</Dropdown>

			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="workspace_premium" />
				<span>{m.sidebar_points_label()}</span>
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
				{#each [{ label: m.sidebar_standard_points(), value: 1 }, { label: m.sidebar_double_points(), value: 2 }] as point}
					<Button
						{loading}
						appearance="subtle"
						alignContent="left"
						onclick={() => {
							onUpdate({ pointsMultiplier: point.value });
							onDropdownToggle(null);
						}}>
						{point.label}
					</Button>
				{/each}
			</Dropdown>

			{#if hasImage}
				<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
					<Icon icon="animation" />
					<span>{m.sidebar_reveal_mode_label()}</span>
				</Flex>
				<Dropdown isOpen={openDropdown === "reveal-mode"} stretchWidthTrigger>
					{#snippet trigger()}
						<Button
							{loading}
							alignContent="left"
							stretchwidth
							appearance="default"
							onclick={() =>
								onDropdownToggle(openDropdown === "reveal-mode" ? null : "reveal-mode")}>
							{revealModeDisplay}
						</Button>
					{/snippet}
					{#each Object.entries(REVEAL_MODE_LABELS) as [value, label]}
						<Button
							{loading}
							appearance="subtle"
							alignContent="left"
							onclick={() => {
								onUpdate({ revealMode: value });
								onDropdownToggle(null);
							}}>
							{label}
						</Button>
					{/each}
				</Dropdown>
			{/if}

			{#if showAnswerOptionsControl}
				<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
					<Icon icon="view_cozy" />
					<span>{m.sidebar_answer_options_label()}</span>
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
						{m.sidebar_single_select()}
					</Button>
					<Button
						{loading}
						appearance="subtle"
						alignContent="left"
						onclick={() => {
							onUpdate({ isMultiSelect: true });
							onDropdownToggle(null);
						}}>
						{m.sidebar_multi_select()}
					</Button>
				</Dropdown>
			{/if}

			<br />
			<Divider color="tertiary" />
			<br />
			<Button {loading} alignContent="left" stretchwidth appearance="default" onclick={onDuplicate}>
				{m.sidebar_duplicate()}
			</Button>
			<Button {loading} alignContent="left" stretchwidth appearance="default" onclick={onDelete}>
				{m.sidebar_delete_question()}
			</Button>
		</div>
		<div>
			<IconButton icon="right_panel_close" tip={m.sidebar_close_tip()} onclick={onToggle} />
		</div>
	</div>
{/if}
