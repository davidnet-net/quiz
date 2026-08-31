<script lang="ts">
	import { Avatar, Button, Flex, IconButton, Skeleton } from "@davidnet-net/svelte-ui";
	import * as styles from "./Sidebar.css.ts";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	/**
	 * Represents a single answer option for a question.
	 */
	interface Option {
		id: string;
		text: string;
		isCorrect: boolean;
	}

	/**
	 * Represents a quiz question payload.
	 */
	interface Question {
		id: string | number;
		type?: string;
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
		activeUsers = new Map(),
		userProfiles = {},
		currentClientId = null,
		onToggle,
		onNewQuestion,
		onSelectQuestion
	}: {
		questions: Question[];
		activeQuestionId: string | number | null;
		mainSidebarOpened: boolean;
		loading: boolean;
		activeUsers?: Map<number, any>;
		userProfiles?: Record<string, any>;
		currentClientId?: number | null;
		onToggle: () => void;
		onNewQuestion: () => void;
		onSelectQuestion: (id: string | number) => void;
	} = $props();

	let activeUsersList = $derived([...activeUsers.entries()]);

	/**
	 * Validates a question's data integrity. Checks for supported types,
	 * character length boundaries, missing text, and valid correct-answer counts.
	 * Allows empty options as long as >= 2 options are filled.
	 *
	 * @param q - The Question object to evaluate.
	 * @returns True if the question has validation errors, false otherwise.
	 */
	function isQuestionInvalid(q: Question): boolean {
		const SUPPORTED_TYPES = ["quiz", "true_false"];

		if (!q.type || !SUPPORTED_TYPES.includes(q.type)) {
			return true;
		}

		const questionText = q.text?.trim() || "";
		if (!questionText || questionText.length > 250) {
			return true;
		}

		const options = Array.isArray(q.options) ? q.options : [];

		if (q.type === "true_false") {
			const correctCount = options.filter((opt) => opt.isCorrect).length;
			return options.length !== 2 || correctCount !== 1;
		}

		if (q.type === "quiz") {
			// Isolate only the options that the user has actually typed into
			const filledOptions = options.filter((opt) => {
				const text = opt.text?.trim() || "";
				return text.length > 0;
			});

			// Must have at least 2 filled answers
			if (filledOptions.length < 2) return true;

			// Check if any filled option exceeds the character limit
			if (filledOptions.some((opt) => opt.text.trim().length > 100)) return true;

			const correctCount = filledOptions.filter((opt) => opt.isCorrect).length;

			// Validate correct answer constraints based on select mode
			if (!q.isMultiSelect && correctCount !== 1) return true;
			if (q.isMultiSelect && correctCount < 2) return true;
		}

		return false;
	}
</script>

{#if !mainSidebarOpened}
	<div class={styles.compactSidebar}>
		<div
			style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; padding: 0.2rem; flex: 1; min-height: 0;">
			{#if loading}
				{#each Array(4) as _}
					<Skeleton height="2rem" width="2rem" />
				{/each}
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
		</div>
		<Flex
			height="fit-content"
			gap="small"
			direction="column"
			marginTop="xsmall"
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
		<div
			style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; min-height: 0;">
			{#if loading}
				{#each Array(4) as _}
					<Skeleton height="4rem" width="100%" />
				{/each}
			{:else}
				{#each questions as q, index}
					{@const invalid = isQuestionInvalid(q)}
					{@const usersOnThisQuestion = Array.from(
						new Map(
							activeUsersList
								.filter(
									([clientId, clientState]) =>
										clientId !== currentClientId &&
										clientState?.activeQuestionId === q.id &&
										clientState?.user
								)
								.map(([clientId, clientState]) => [
									clientState.user.userId || clientId,
									[clientId, clientState]
								])
						).values()
					)}

					<button
						class={styles.questionCardItem}
						style="{activeQuestionId === q.id
							? 'opacity: 1; border: 1px solid rgba(255,255,255,0.2);'
							: 'opacity: 0.7;'} {invalid
							? 'border-color: rgb(239, 68, 68) !important; box-shadow: 0 0 0 1px rgb(239, 68, 68);'
							: ''}"
						onclick={() => onSelectQuestion(q.id)}>
						<Flex direction="row" justifyContent="between" height="fit-content">
							<span class={styles.questionCardText}>Question {index + 1}</span>

							{#if usersOnThisQuestion.length > 0}
								<div style="display: flex; align-items: center; pointer-events: none;">
									{#each usersOnThisQuestion as [clientId, clientState]}
										{@const userId = clientState.user.userId}
										{@const fetchedProfile = userId ? userProfiles[userId] : null}
										{@const resolvedAvatar =
											fetchedProfile?.avatarUrl || clientState.user.avatarUrl || null}
										{@const resolvedName =
											fetchedProfile?.displayName || clientState.user.name || "?"}

										<Avatar
											src={resolvedAvatar}
											size="medium"
											alt={resolvedName}
											loading={!resolvedAvatar} />
									{/each}
								</div>
							{/if}
						</Flex>
						<p class={styles.questionCardTitle}>{q.text || "Empty question."}</p>
					</button>
				{/each}
			{/if}
		</div>
		<Flex justifyContent="end" height="fit-content" gap="small" marginTop="small">
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
