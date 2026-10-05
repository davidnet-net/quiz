<script lang="ts">
	import { Icon, IconButton, YoutubeEmbed } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import * as styles from "./PresenterQuestion.css";
	import * as m from "$lib/paraglide/messages.js";

	let {
		payload,
		showResults = false,
		resultsBreakdown = {}
	}: { payload: any; showResults?: boolean; resultsBreakdown?: Record<string, number> } = $props();

	let type = $derived(payload?.question?.type || "quiz");
	let options = $derived(
		(payload?.options || []).filter((opt: any) => opt.text && opt.text.trim() !== "")
	);
	let isTrueFalse = $derived(type === "true_false");
	let isOptionsType = $derived(type === "quiz" || isTrueFalse || type === "poll");

	let mediaType = $derived(payload?.question?.mediaType);
	let mediaUrl = $derived(payload?.question?.mediaUrl);

	const REVEAL_CLASSES: Record<string, string> = {
		fade: styles.revealFade,
		blur: styles.revealBlur,
		slide: styles.revealSlide
	};
	let revealClass = $derived(REVEAL_CLASSES[payload?.question?.revealMode] ?? "");

	let videoMuted = $state(true);
	$effect(() => {
		payload?.question?.id;
		// Reset to muted for every new question, matching browser autoplay requirements.
		videoMuted = true;
	});

	const defaultColors = [
		{ color: "rgba(239, 68, 68, 1)", bg: "rgba(239, 68, 68, 0.25)" },
		{ color: "rgba(59, 130, 246, 1)", bg: "rgba(59, 130, 246, 0.25)" },
		{ color: "rgba(168, 85, 247, 1)", bg: "rgba(168, 85, 247, 0.25)" },
		{ color: "rgba(34, 197, 94, 1)", bg: "rgba(34, 197, 94, 0.25)" },
		{ color: "rgba(245, 158, 11, 1)", bg: "rgba(245, 158, 11, 0.25)" },
		{ color: "rgba(236, 72, 153, 1)", bg: "rgba(236, 72, 153, 0.25)" }
	];

	let rowIndexGroups = $derived(
		Array.from({ length: Math.ceil(options.length / 2) }, (_, r) => [r * 2, r * 2 + 1])
	);

	let scaleSettings = $derived(payload?.question?.settings || { min: 1, max: 10 });
	let sliderSettings = $derived(payload?.question?.settings || { min: 0, max: 100 });

	let scaleValues = $derived(
		Array.from(
			{ length: Math.max(0, scaleSettings.max - scaleSettings.min + 1) },
			(_, i) => scaleSettings.min + i
		)
	);
	let maxScaleCount = $derived(
		Math.max(1, ...scaleValues.map((v) => resultsBreakdown[String(v)] || 0))
	);

	let sliderEntries = $derived(
		Object.entries(resultsBreakdown)
			.map(([value, count]) => ({ value: Number(value), count }))
			.sort((a, b) => a.value - b.value)
	);
	let maxSliderCount = $derived(Math.max(1, ...sliderEntries.map((e) => e.count)));

	let textEntries = $derived(Object.entries(resultsBreakdown).sort((a, b) => b[1] - a[1]));
	let maxWordCount = $derived(Math.max(1, ...textEntries.map(([, count]) => count)));

	let optionsById = $derived(
		Object.fromEntries((payload?.options || []).map((o: any) => [o.id, o]))
	);
	let correctOrderItems = $derived(
		(payload?.correctOrder || []).map((id: string) => optionsById[id]).filter(Boolean)
	);
	let puzzleCorrectCount = $derived(resultsBreakdown["correct"] || 0);
	let puzzleIncorrectCount = $derived(resultsBreakdown["incorrect"] || 0);
</script>

<div class={styles.container} style="width: 100%;">
	<div class={styles.questionContainer}>
		<div class={styles.questionText}>
			{payload?.question?.text || "..."}
		</div>
	</div>

	{#if !showResults && mediaType === "image" && mediaUrl}
		<div class={styles.imageContainer}>
			<img class="{styles.mediaImage} {revealClass}" src={mediaUrl} alt="" />
		</div>
	{:else if !showResults && mediaType === "youtube" && mediaUrl}
		<div class={styles.videoContainer}>
			<div class={styles.videoWrapper}>
				<YoutubeEmbed url={mediaUrl} autoplay bind:muted={videoMuted} />
				{#if videoMuted}
					<div class={styles.unmuteOverlay}>
						<IconButton
							icon="volume_off"
							appearance="default"
							tip={m.presenter_unmute_tip()}
							onclick={() => (videoMuted = false)} />
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if isOptionsType}
		<div
			class={styles.answerContainer}
			style={isTrueFalse ? "flex-direction: row; align-items: stretch;" : ""}>
			{#if isTrueFalse}
				{#each options as option, i}
					<div
						class={styles.answerBox}
						style="
                        flex: 1;
                        background-color: {defaultColors[i]?.bg || 'rgba(255,255,255,0.1)'};
                        border: 2px solid {defaultColors[i]?.color || '#fff'};
                        opacity: {showResults && !option.isCorrect ? 0.3 : 1};
                        position: relative;
                    ">
						<span>{option.text}</span>
						{#if showResults}
							<div
								style="position: absolute; bottom: 10px; right: 10px; font-size: 1.5rem; font-weight: bold;">
								{resultsBreakdown[option.id] || 0}
							</div>
							{#if option.isCorrect}
								<div
									style="position: absolute; top: -10px; right: -10px; background: var(--color-success); border-radius: 50%; padding: 5px;">
									<Icon icon="check" color="default" />
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			{:else}
				{#each rowIndexGroups as rowIndices}
					<div class={styles.answerRow}>
						{#each rowIndices as i}
							{#if options[i]}
								<div
									class={styles.answerBox}
									style="
                                    background-color: {defaultColors[i % defaultColors.length].bg};
                                    border: 2px solid {defaultColors[i % defaultColors.length]
										.color};
                                    opacity: {showResults &&
									type === 'quiz' &&
									!options[i].isCorrect
										? 0.3
										: 1};
                                    position: relative;
                                ">
									<span>{options[i].text}</span>
									{#if showResults}
										<div
											style="position: absolute; bottom: 10px; right: 10px; font-size: 1.5rem; font-weight: bold;">
											{resultsBreakdown[options[i].id] || 0}
										</div>
										{#if type === "quiz" && options[i].isCorrect}
											<div
												style="position: absolute; top: -10px; right: -10px; background: var(--color-success); border-radius: 50%; padding: 5px;">
												<Icon icon="check" color="default" />
											</div>
										{/if}
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	{:else if type === "scale"}
		{#if !showResults}
			<p style="color: {token.theme.color.text.secondary}; font-size: 1.5rem;">
				{m.presenter_rate_from({
					min: `${scaleSettings.min}${scaleSettings.minLabel ? ` (${scaleSettings.minLabel})` : ''}`,
					max: `${scaleSettings.max}${scaleSettings.maxLabel ? ` (${scaleSettings.maxLabel})` : ''}`
				})}
			</p>
		{:else}
			<div class={styles.histogramContainer}>
				{#each scaleValues as value}
					{@const count = resultsBreakdown[String(value)] || 0}
					<div class={styles.histogramBarWrap}>
						<span>{count}</span>
						<div
							class={styles.histogramBar}
							style="height: {Math.max(4, (count / maxScaleCount) * 100)}%;">
						</div>
						<span>{value}</span>
					</div>
				{/each}
			</div>
		{/if}
	{:else if type === "slider"}
		{#if !showResults}
			<p style="color: {token.theme.color.text.secondary}; font-size: 1.5rem;">
				{m.presenter_slider_dragging({ min: sliderSettings.min, max: sliderSettings.max })}
			</p>
		{:else}
			<p style="font-size: 1.25rem;">
				{m.presenter_correct_value_label()} <b>{sliderSettings.correctValue}</b>
				{#if sliderSettings.tolerance}{m.presenter_tolerance_suffix({ tolerance: sliderSettings.tolerance })}{/if}
			</p>
			<div class={styles.histogramContainer}>
				{#each sliderEntries as entry}
					<div class={styles.histogramBarWrap}>
						<span>{entry.count}</span>
						<div
							class={styles.histogramBar}
							style="height: {Math.max(4, (entry.count / maxSliderCount) * 100)}%;">
						</div>
						<span>{entry.value}</span>
					</div>
				{/each}
			</div>
		{/if}
	{:else if type === "type_answer"}
		{#if !showResults}
			<p style="color: {token.theme.color.text.secondary}; font-size: 1.5rem;">
				{m.presenter_typing_answer()}
			</p>
		{:else}
			<p style="font-size: 1.1rem;">
				{m.presenter_accepted_answers_label()} <b>{options.map((o: any) => o.text).join(", ")}</b>
			</p>
			<div class={styles.answerContainer}>
				{#each textEntries as [text, count]}
					<div class={styles.listRow}>
						<span style="flex: 1;">{text}</span>
						<span style="font-weight: bold;">{count}</span>
					</div>
				{/each}
			</div>
		{/if}
	{:else if type === "word_cloud"}
		{#if !showResults}
			<p style="color: {token.theme.color.text.secondary}; font-size: 1.5rem;">
				{m.presenter_submitting_words()}
			</p>
		{:else}
			<div class={styles.wordCloudContainer}>
				{#each textEntries as [word, count]}
					<span style="font-size: {1 + (count / maxWordCount) * 2.5}rem; font-weight: bold;">
						{word}
					</span>
				{/each}
			</div>
		{/if}
	{:else if type === "puzzle"}
		{#if !showResults}
			<div class={styles.answerContainer}>
				{#each options as item}
					<div class={styles.listRow}>
						<span>{item.text}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p style="font-size: 1.1rem;">{m.presenter_correct_order_label()}</p>
			<div class={styles.answerContainer}>
				{#each correctOrderItems as item, i}
					<div class={styles.listRow}>
						<span style="font-weight: bold; width: 1.5rem;">{i + 1}</span>
						<span style="flex: 1;">{item.text}</span>
					</div>
				{/each}
			</div>
			<p style="font-size: 1.1rem;">
				<span style="color: var(--color-success); font-weight: bold;">{puzzleCorrectCount}</span>
				{m.presenter_correct_word()} ·
				<span style="color: var(--color-danger); font-weight: bold;">{puzzleIncorrectCount}</span>
				{m.presenter_incorrect_word()}
			</p>
		{/if}
	{/if}
</div>
