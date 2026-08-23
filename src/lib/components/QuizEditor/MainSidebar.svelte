<script lang="ts">
	import { Button, Flex, IconButton, Skeleton } from "@davidnet-net/svelte-ui";
	import * as styles from "./Sidebar.css.ts";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	interface Option {
		id: string;
		text: string;
		isCorrect: boolean;
	}

	interface Question {
		id: string | number;
		title?: string;
		text: string;
		isMultiSelect?: boolean;
		options?: Option[];
	}

	let {
		questions = [],
		activeQuestionId = null,
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

	// Helper function to check if a question is invalid
	function isQuestionInvalid(q: Question): boolean {
		// 1. Check if the question text/title is empty
		if (!q.text || q.text.trim() === "") {
			return true;
		}

		const options = Array.isArray(q.options) ? q.options : [];
		const correctCount = options.filter((opt) => opt.isCorrect).length;

		// 2. Single select mode requires EXACTLY 1 correct answer
		if (!q.isMultiSelect && correctCount !== 1) {
			return true;
		}

		// 3. Multi select mode requires AT LEAST 2 correct answers
		if (q.isMultiSelect && correctCount < 2) {
			return true;
		}

		return false;
	}
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
					{@const invalid = isQuestionInvalid(q)}
					<Button
						selected={activeQuestionId === q.id}
						style="min-width: 2rem !important; max-width: 2rem !important; width: 2rem !important; margin: 0px; padding: 0rem; {invalid
							? 'border: 1px solid ' + token.theme.color.text.danger + ' !important;'
							: ''}"
						onclick={() => onSelectQuestion(q.id)}>
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
					{@const invalid = isQuestionInvalid(q)}
					<button
						class={styles.questionCardItem}
						style="{activeQuestionId === q.id
							? 'opacity: 1; border: 1px solid rgba(255,255,255,0.2);'
							: 'opacity: 0.7;'} {invalid
							? 'border-color: rgb(239, 68, 68) !important; box-shadow: 0 0 0 1px rgb(239, 68, 68);'
							: ''}"
						onclick={() => onSelectQuestion(q.id)}>
						<span class={styles.questionCardText}>Question {index + 1}</span>
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
