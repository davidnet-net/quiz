<script lang="ts">
	import { Icon, IconButton, YoutubeEmbed } from "@davidnet-net/svelte-ui";
	import * as styles from "./PresenterQuestion.css";

	let {
		payload,
		showResults = false,
		resultsBreakdown = {}
	}: { payload: any; showResults?: boolean; resultsBreakdown?: Record<string, number> } = $props();

	let options = $derived(
		(payload?.options || []).filter((opt: any) => opt.text && opt.text.trim() !== "")
	);
	let isTrueFalse = $derived(payload?.question?.type === "true_false");

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
		{ color: "rgba(34, 197, 94, 1)", bg: "rgba(34, 197, 94, 0.25)" }
	];
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
							tip="Unmute"
							onclick={() => (videoMuted = false)} />
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<div
		class={styles.answerContainer}
		style={isTrueFalse
			? "display: flex; flex-direction: row; align-items: stretch; gap: 1rem; width: 100%;"
			: "width: 100%;"}>
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
			{#each [[0, 1], [2, 3]] as rowIndices}
				<div class={styles.answerRow}>
					{#each rowIndices as i}
						{#if options[i]}
							<div
								class={styles.answerBox}
								style="
                                    background-color: {defaultColors[i].bg}; 
                                    border: 2px solid {defaultColors[i].color};
                                    opacity: {showResults && !options[i].isCorrect ? 0.3 : 1};
                                    position: relative;
                                ">
								<span>{options[i].text}</span>
								{#if showResults}
									<div
										style="position: absolute; bottom: 10px; right: 10px; font-size: 1.5rem; font-weight: bold;">
										{resultsBreakdown[options[i].id] || 0}
									</div>
									{#if options[i].isCorrect}
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
</div>
