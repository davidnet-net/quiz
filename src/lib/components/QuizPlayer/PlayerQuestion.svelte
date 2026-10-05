<script lang="ts">
	import { Button, Flex, IconButton, TextField } from "@davidnet-net/svelte-ui";

	import * as styles from "./PlayerQuestion.css";
	import * as m from "$lib/paraglide/messages.js";

	let { payload, onsubmit }: { payload: any; onsubmit: (answer: Record<string, any>) => void } =
		$props();

	let type = $derived(payload?.question?.type || "quiz");
	let options = $derived(
		(payload?.options || []).filter((opt: any) => opt.text && opt.text.trim() !== "")
	);
	let isMultiSelect = $derived(payload?.question?.isMultiSelect || false);
	let isTrueFalse = $derived(type === "true_false");
	let isPoll = $derived(type === "poll");

	let selectedIds = $state<string[]>([]);
	let submitted = $state(false);
	let textValue = $state("");
	let sliderValue = $state(0);
	let puzzleOrder = $state<any[]>([]);

	const defaultColors = [
		"rgba(239, 68, 68, 1)", // Red
		"rgba(59, 130, 246, 1)", // Blue
		"rgba(168, 85, 247, 1)", // Purple
		"rgba(34, 197, 94, 1)", // Green
		"rgba(245, 158, 11, 1)", // Amber
		"rgba(236, 72, 153, 1)" // Pink
	];

	$effect(() => {
		if (type === "puzzle") puzzleOrder = options;
	});

	$effect(() => {
		if (type === "slider") {
			const settings = payload?.question?.settings;
			sliderValue = typeof settings?.min === "number" ? settings.min : 0;
		}
	});

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
			submitSelection();
		}
	}

	function submitSelection() {
		if (selectedIds.length === 0 || submitted) return;
		submitted = true;
		onsubmit({ optionIds: selectedIds });
	}

	function submitScale(value: number) {
		if (submitted) return;
		submitted = true;
		onsubmit({ value });
	}

	function submitSlider() {
		if (submitted) return;
		submitted = true;
		onsubmit({ value: sliderValue });
	}

	function submitText() {
		if (!textValue.trim() || submitted) return;
		submitted = true;
		onsubmit({ text: textValue.trim() });
	}

	function movePuzzleItem(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= puzzleOrder.length) return;
		const newOrder = [...puzzleOrder];
		[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
		puzzleOrder = newOrder;
	}

	function submitPuzzle() {
		if (submitted) return;
		submitted = true;
		onsubmit({ order: puzzleOrder.map((o) => o.id) });
	}
</script>

{#if type === "quiz" || isTrueFalse || isPoll}
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="column"
		style="width: 100%; height: 100%;">
		<h1 style="margin-bottom: 2rem;">
			{isMultiSelect ? m.player_select_all_that_apply() : m.player_select_correct_answer()}
		</h1>

		<div
			class={isTrueFalse || isPoll ? styles.wrapContainer : styles.container}
			style={isTrueFalse
				? "flex-direction: row; align-items: stretch; height: 60vh;"
				: isPoll
					? "height: 60vh;"
					: "width: 100%; height: 60vh;"}>
			{#each options as option, i}
				<button
					class={styles.colorBlock}
					style="
                    flex: 1;
                    {isPoll ? 'min-width: 40%;' : ''}
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
					aria-label={m.player_select_answer_alt()}>
				</button>
			{/each}
		</div>

		{#if isMultiSelect}
			<div style="margin-top: 2rem;">
				<Button
					appearance="primary"
					onclick={submitSelection}
					disabled={selectedIds.length === 0 || submitted}>
					{m.player_submit_answer()}
				</Button>
			</div>
		{/if}
	</Flex>
{:else if type === "scale"}
	{@const settings = payload?.question?.settings || { min: 1, max: 10 }}
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="column"
		style="width: 100%; height: 100%;">
		<h1 style="margin-bottom: 2rem;">{m.player_pick_rating()}</h1>
		<div class={styles.wrapContainer} style="height: auto; justify-content: center;">
			{#each Array.from({ length: settings.max - settings.min + 1 }, (_, i) => settings.min + i) as value}
				<Button
					appearance={selectedIds[0] === String(value) ? "primary" : "default"}
					disabled={submitted}
					onclick={() => {
						selectedIds = [String(value)];
						submitScale(value);
					}}>
					{value}
				</Button>
			{/each}
		</div>
	</Flex>
{:else if type === "slider"}
	{@const settings = payload?.question?.settings || { min: 0, max: 100, step: 1 }}
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="column"
		style="width: 100%; height: 100%;">
		<h1>{m.player_drag_to_answer()}</h1>
		<h2 style="font-size: 3rem; margin: 1rem 0;">{sliderValue}</h2>
		<input
			type="range"
			min={settings.min}
			max={settings.max}
			step={settings.step || 1}
			value={sliderValue}
			disabled={submitted}
			oninput={(e) => (sliderValue = Number((e.target as HTMLInputElement).value))}
			style="width: 80%;" />
		<div style="margin-top: 2rem;">
			<Button appearance="primary" onclick={submitSlider} disabled={submitted}>
				{m.player_submit_answer()}
			</Button>
		</div>
	</Flex>
{:else if type === "type_answer" || type === "word_cloud"}
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="column"
		style="width: 100%; height: 100%;">
		<h1 style="margin-bottom: 1rem;">
			{type === "word_cloud" ? m.player_type_word_or_phrase() : m.player_type_your_answer()}
		</h1>
		<div class={styles.inputContainer}>
			<TextField
				bind:value={textValue}
				disabled={submitted}
				maxlength={type === "word_cloud" ? 40 : 200}
				placeholder={m.player_answer_placeholder()} />
			<Button appearance="primary" onclick={submitText} disabled={!textValue.trim() || submitted}>
				{m.player_submit_answer()}
			</Button>
		</div>
	</Flex>
{:else if type === "puzzle"}
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="column"
		style="width: 100%; height: 100%;">
		<h1 style="margin-bottom: 1rem;">{m.player_put_in_order()}</h1>
		<div class={styles.inputContainer}>
			{#each puzzleOrder as item, i (item.id)}
				<div class={styles.puzzleRow}>
					<span style="font-weight: bold; width: 1.5rem; text-align: center;">{i + 1}</span>
					<span style="flex: 1;">{item.text}</span>
					<IconButton
						icon="arrow_upward"
						tip={m.common_move_up_tip()}
						disabled={submitted || i === 0}
						onclick={() => movePuzzleItem(i, -1)} />
					<IconButton
						icon="arrow_downward"
						tip={m.common_move_down_tip()}
						disabled={submitted || i === puzzleOrder.length - 1}
						onclick={() => movePuzzleItem(i, 1)} />
				</div>
			{/each}
			<Button appearance="primary" onclick={submitPuzzle} disabled={submitted}
				>{m.player_submit_order()}</Button>
		</div>
	</Flex>
{:else if type === "information"}
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="column"
		style="width: 100%; height: 100%;"
		text="center">
		<h1>{m.player_take_a_look()}</h1>
		<p>{m.player_no_answer_needed()}</p>
	</Flex>
{/if}
