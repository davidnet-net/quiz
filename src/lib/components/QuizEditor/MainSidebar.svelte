<script lang="ts">
	import { Button, Flex, IconButton, Skeleton } from "@davidnet-net/svelte-ui";
	import * as styles from "./Sidebar.css.ts";

	interface Question {
		id: string | number; // Updated to support UUIDs from crypto.randomUUID()
		title: string;
		text: string;
	}

	let {
		questions = [],
		activeQuestionId = null, // Default to null instead of 1
		mainSidebarOpened = true,
		loading,
		onToggle,
		onNewQuestion,
		onSelectQuestion
	}: {
		questions: Question[];
		activeQuestionId: string | number | null;
		mainSidebarOpened: boolean;
		loading: boolean;
		onToggle: () => void;
		onNewQuestion: () => void;
		onSelectQuestion: (id: string | number) => void;
	} = $props();
</script>

{#if !mainSidebarOpened}
	<div class={styles.compactSidebar}>
		<Flex direction="column" gap="small" overflowY="scroll" style="padding: 0.2rem !important;">
			{#if loading}
				<Skeleton height="2rem" width="2rem" />
				<Skeleton height="2rem" width="2rem" />
				<Skeleton height="2rem" width="2rem" />
				<Skeleton height="2rem" width="2rem" />
			{:else}
				{#each questions as q, index}
					<Button
						selected={activeQuestionId === q.id}
						style="min-width: 2rem !important; max-width: 2rem !important; width: 2rem !important; margin: 0px; padding: 0rem;"
						onclick={() => onSelectQuestion(q.id)}>
						<!-- Automatically shows ".." if the index exceeds 98 (question 100+) -->
						{index > 98 ? ".." : index + 1}
					</Button>
				{/each}
			{/if}
		</Flex>
		<Flex
			height="fit-content"
			gap="small"
			direction="column"
			justifyContent="center"
			alignItems="center">
			<IconButton
				{loading}
				icon="add"
				appearance="primary"
				tip="Add question"
				onclick={onNewQuestion} />
			<IconButton icon="left_panel_open" tip="Open sidebar" onclick={onToggle} />
		</Flex>
	</div>
{:else}
	<div class={styles.sidebar}>
		<Flex direction="column" gap="small" overflowY="scroll">
			{#if loading}
				<Skeleton height="4rem" width="100%" />
				<Skeleton height="4rem" width="100%" />
				<Skeleton height="4rem" width="100%" />
				<Skeleton height="4rem" width="100%" />
			{:else}
				{#each questions as q, index}
					<!-- Highlight the active card using an inline style or data-attribute if it matches activeQuestionId -->
					<button
						class={styles.questionCardItem}
						style={activeQuestionId === q.id
							? "opacity: 1; border: 1px solid rgba(255,255,255,0.2);"
							: "opacity: 0.7;"}
						onclick={() => onSelectQuestion(q.id)}>
						<span class={styles.questionCardText}>Question {index + 1}</span>
						<!-- Display the actual real-time synced text, or a placeholder if empty -->
						<p class={styles.questionCardTitle}>{q.text || "Empty question..."}</p>
					</button>
				{/each}
			{/if}
		</Flex>
		<Flex justifyContent="end" height="fit-content" gap="small">
			<Button
				iconbefore="add"
				appearance="primary"
				style="width: 81% !important;"
				{loading}
				onclick={onNewQuestion}>
				New question
			</Button>
			<IconButton icon="left_panel_close" tip="Close sidebar" onclick={onToggle} />
		</Flex>
	</div>
{/if}
