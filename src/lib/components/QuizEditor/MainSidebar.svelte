<script lang="ts">
	import { Button, Flex, IconButton } from "@davidnet-net/svelte-ui";
	import * as styles from "./Sidebar.css.ts";

	interface Question {
		id: number;
		title: string;
		text: string;
	}

	let {
		questions = [],
		activeQuestionId = 1,
		mainSidebarOpened = true,
		onToggle,
		onNewQuestion,
		onSelectQuestion
	}: {
		questions: Question[];
		activeQuestionId: number;
		mainSidebarOpened: boolean;
		onToggle: () => void;
		onNewQuestion: () => void;
		onSelectQuestion: (id: number) => void;
	} = $props();
</script>

{#if !mainSidebarOpened}
	<div class={styles.compactSidebar}>
		<Flex direction="column" gap="small" overflowY="scroll" style="padding: 0.2rem !important;">
			<!--Na 99 moet je .. laten zien omdat 3 digits niet past-->
			{#each questions as q, index}
				<Button
					selected={activeQuestionId === q.id}
					style="min-width: 2rem !important; max-width: 2rem !important; width: 2rem !important; margin: 0px; padding: 0rem;"
					onclick={() => onSelectQuestion(q.id)}>
					{index + 1}
				</Button>
			{/each}
		</Flex>
		<Flex
			height="fit-content"
			gap="small"
			direction="column"
			justifyContent="center"
			alignItems="center">
			<IconButton icon="add" appearance="primary" tip="Add question" onclick={onNewQuestion} />
			<IconButton icon="left_panel_open" tip="Open sidebar" onclick={onToggle} />
		</Flex>
	</div>
{:else}
	<div class={styles.sidebar}>
		<Flex direction="column" gap="small" overflowY="scroll">
			{#each questions as q, index}
				<button class={styles.questionCardItem} onclick={() => onSelectQuestion(q.id)}>
					<span class={styles.questionCardText}>Question {index + 1}</span>
					<p class={styles.questionCardTitle}>{q.text}</p>
				</button>
			{/each}
		</Flex>
		<Flex justifyContent="end" height="fit-content" gap="small">
			<Button
				iconbefore="add"
				appearance="primary"
				style="width: 81% !important;"
				onclick={onNewQuestion}>
				New question
			</Button>
			<IconButton icon="left_panel_close" tip="Close sidebar" onclick={onToggle} />
		</Flex>
	</div>
{/if}
