<script lang="ts">
	import { Avatar, Button, Flex, IconButton, Skeleton } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import * as styles from "./Sidebar.css.ts";
	import * as m from "$lib/paraglide/messages.js";

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
		settings?: Record<string, number | string>;
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
		onSelectQuestion,
		onReorderQuestion
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
		onReorderQuestion: (questionId: string | number, newIndex: number) => void;
	} = $props();

	let activeUsersList = $derived([...activeUsers.entries()]);

	let draggedId = $state<string | number | null>(null);
	let dropTarget = $state<{ index: number; position: "before" | "after" } | null>(null);

	function resetDrag() {
		draggedId = null;
		dropTarget = null;
	}

	function handleDragStart(e: DragEvent, id: string | number) {
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", String(id));
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		if (draggedId === null) return;
		e.preventDefault();
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const position: "before" | "after" =
			e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		if (dropTarget?.index !== index || dropTarget?.position !== position) {
			dropTarget = { index, position };
		}
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedId === null || dropTarget === null) {
			resetDrag();
			return;
		}

		const targetId = questions[index]?.id;
		const otherIds = questions.filter((q) => q.id !== draggedId).map((q) => q.id);
		const targetPos = otherIds.indexOf(targetId);

		if (targetPos !== -1) {
			const finalIndex = dropTarget.position === "before" ? targetPos : targetPos + 1;
			onReorderQuestion(draggedId, finalIndex);
		}

		resetDrag();
	}

	/**
	 * Validates a question's data integrity. Checks for supported types,
	 * character length boundaries, missing text, and valid correct-answer counts.
	 * Allows empty options as long as >= 2 options are filled.
	 *
	 * @param q - The Question object to evaluate.
	 * @returns True if the question has validation errors, false otherwise.
	 */
	const SUPPORTED_TYPES = [
		"quiz",
		"true_false",
		"slider",
		"puzzle",
		"type_answer",
		"poll",
		"word_cloud",
		"scale",
		"information"
	];

	function isQuestionInvalid(q: Question): boolean {
		if (!q.type || !SUPPORTED_TYPES.includes(q.type)) {
			return true;
		}

		const questionText = q.text?.trim() || "";
		if (!questionText || questionText.length > 250) {
			return true;
		}

		const options = Array.isArray(q.options) ? q.options : [];
		// Isolate only the options that the user has actually typed into
		const filledOptions = options.filter((opt) => (opt.text?.trim() || "").length > 0);

		switch (q.type) {
			case "true_false": {
				const correctCount = options.filter((opt) => opt.isCorrect).length;
				return options.length !== 2 || correctCount !== 1;
			}
			case "quiz": {
				if (filledOptions.length < 2) return true;
				if (filledOptions.some((opt) => opt.text.trim().length > 100)) return true;
				const correctCount = filledOptions.filter((opt) => opt.isCorrect).length;
				if (!q.isMultiSelect && correctCount !== 1) return true;
				if (q.isMultiSelect && correctCount < 2) return true;
				return false;
			}
			case "poll":
			case "puzzle": {
				if (filledOptions.length < 2) return true;
				if (filledOptions.some((opt) => opt.text.trim().length > 100)) return true;
				return false;
			}
			case "type_answer": {
				if (filledOptions.length < 1) return true;
				if (filledOptions.some((opt) => opt.text.trim().length > 100)) return true;
				return false;
			}
			case "slider": {
				const s = q.settings;
				if (!s || typeof s.min !== "number" || typeof s.max !== "number") return true;
				if (typeof s.correctValue !== "number") return true;
				if (s.min >= s.max) return true;
				if (s.correctValue < s.min || s.correctValue > s.max) return true;
				return false;
			}
			case "scale": {
				const s = q.settings;
				if (!s || typeof s.min !== "number" || typeof s.max !== "number") return true;
				return s.min >= s.max;
			}
			case "word_cloud":
			case "information":
				return false;
			default:
				return true;
		}
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
						class={[
							draggedId === q.id ? styles.dragging : "",
							dropTarget?.index === index ? styles.dropTargetHighlight : ""
						]
							.filter(Boolean)
							.join(" ")}
						style="min-width: 2rem !important; max-width: 2rem !important; width: 2rem !important; margin: 0px; padding: 0rem; {invalid
							? 'border: 1px solid ' + token.theme.color.text.danger + ' !important;'
							: ''}"
						draggable={true}
						ondragstart={(e: DragEvent) => handleDragStart(e, q.id)}
						ondragover={(e: DragEvent) => handleDragOver(e, index)}
						ondrop={(e: DragEvent) => handleDrop(e, index)}
						ondragend={resetDrag}
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
				tip={m.sidebar_add_question_tip()}
				onclick={onNewQuestion} />
			<IconButton icon="left_panel_open" tip={m.sidebar_open_tip()} onclick={onToggle} />
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
						class="{styles.questionCardItem} {dropTarget?.index === index
							? styles.dropTargetHighlight
							: ''}"
						style="{draggedId === q.id
							? 'opacity: 0.4;'
							: activeQuestionId === q.id
								? 'opacity: 1; border: 1px solid rgba(255,255,255,0.2);'
								: 'opacity: 0.7;'} {invalid
							? 'border-color: rgb(239, 68, 68) !important; box-shadow: 0 0 0 1px rgb(239, 68, 68);'
							: ''}"
						draggable={true}
						ondragstart={(e) => handleDragStart(e, q.id)}
						ondragover={(e) => handleDragOver(e, index)}
						ondrop={(e) => handleDrop(e, index)}
						ondragend={resetDrag}
						onclick={() => onSelectQuestion(q.id)}>
						<Flex direction="row" justifyContent="between" height="fit-content">
							<span class={styles.questionCardText}>{m.sidebar_question_label({ num: index + 1 })}</span>

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
						<p class={styles.questionCardTitle}>{q.text || m.sidebar_empty_question()}</p>
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
				{m.sidebar_new_question_button()}
			</Button>
			<IconButton icon="left_panel_close" tip={m.sidebar_close_tip()} onclick={onToggle} />
		</Flex>
	</div>
{/if}
