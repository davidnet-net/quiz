<script lang="ts">
	import {
		appState,
		authState,
		identityState,
		Avatar,
		Button,
		Flex,
		Icon,
		LinkButton,
		Skeleton,
		useShortcut,
		VisuallyHidden,
		whenAuthReady,
		getFetch,
		toast,
		IconButton
	} from "@davidnet-net/svelte-ui";
	import * as styles from "./page.css.ts";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import MainSidebar from "$lib/components/QuizEditor/MainSidebar.svelte";
	import QuestionSidebar from "$lib/components/QuizEditor/QuestionSidebar.svelte";
	import NewQuestionModal from "$lib/components/QuizEditor/NewQuestionModal.svelte";
	import MultipleChoice from "$lib/components/QuizEditor/Questions/MultipleChoiceQuestion.svelte";
	import LoadingQuestion from "$lib/components/QuizEditor/Questions/LoadingQuestion.svelte";
	import type { PageProps } from "./$types";
	import { QuizRoom } from "$lib/quizEditor/QuizRoom.svelte";
	import { page } from "$app/state";
	import { PUBLIC_ACCOUNT_FRONTEND_URL, PUBLIC_BACKEND_URL } from "$env/static/public";

	let { params }: PageProps = $props();

	let questionSidebarOpened = $state(true);
	let mainSidebarOpened = $state(true);
	let openDropdown = $state<string | null>(null);
	let showNewQuestionModal = $state(false);

	// Profile cache for active room users fetched via your profile API
	let userProfiles = $state<Record<string, any>>({});

	// 1. Initialize Room & Bind state
	const room = QuizRoom(() => (authState.isLoggedIn ? params.quizid : ""));
	let loading = $derived(room.loading || !authState.isLoggedIn);
	let questions = $derived(room.questions);
	let quizName = $derived(room.quizName);

	let activeQuestionId = $state<number | string | null>(null);

	// 2. Room Presence & Active Collaborators List
	let activeUsersList = $derived([...room.activeUsers.entries()]);

	// 3. Deduplicated Data for UI (Moved from HTML to $derived for Svelte 5)
	let uniqueCursors = $derived(
		Object.values(
			activeUsersList.reduce(
				(acc, [clientId, clientState]) => {
					if (
						clientId === room.doc.clientID ||
						!clientState?.cursor ||
						clientState.activeQuestionId !== activeQuestionId
					)
						return acc;

					// Fallback to clientId if it's an anonymous guest
					const uid = clientState.user?.userId || clientId.toString();

					// Overwrite if this tab is explicitly focused, or if we haven't seen this user yet
					if (!acc[uid] || clientState.isFocused) {
						acc[uid] = clientState;
					}
					return acc;
				},
				{} as Record<string, any>
			)
		)
	);

	let uniqueProfiles = $derived(
		Array.from(
			new Map(
				activeUsersList
					.filter(([_, state]) => state?.user?.userId)
					.map(([_, state]) => [state.user.userId, state])
			).values()
		)
	);

	// Sync authenticated user's profile details into awareness state once available
	$effect(() => {
		if (identityState.user) {
			room.updatePresence({
				user: {
					name: identityState.user.displayName || identityState.user.username || "?",
					color: room.awareness.getLocalState()?.user?.color || "#3b82f6",
					userId: identityState.user.userID,
					avatarUrl: identityState.user.avatarURL || ""
				},
				isFocused: document.hasFocus() // Initial focus state when identity is bound
			});
		}
	});

	// Fetch profile data for active users via your API endpoint when they join or update
	$effect(() => {
		for (const [clientId, clientState] of activeUsersList) {
			const userId = clientState?.user?.userId;
			if (userId && !userProfiles[userId]) {
				(async () => {
					const profileResult = await getFetch(
						`${PUBLIC_BACKEND_URL}/auth/profile`,
						{ user: userId },
						undefined,
						authState.isLoggedIn
					);
					if (profileResult.success && profileResult.profileResponse) {
						userProfiles[userId] = profileResult.profileResponse;
					}
				})();
			}
		}
	});

	// 4. Track Join/Leave Events for Toasts
	let previousUsers = new Set<string>();
	let hasInitializedPresence = false;

	$effect(() => {
		// Map current unique remote users (excluding the local user from triggering their own toasts)
		const currentRemoteUsers = new Map(
			uniqueProfiles
				.filter((p) => p.user.userId !== identityState.user?.userID)
				.map((p) => [p.user.userId, p])
		);

		if (!hasInitializedPresence) {
			// First run: just record who is already here without spamming toasts
			previousUsers = new Set(currentRemoteUsers.keys());
			hasInitializedPresence = true;
			return;
		}

		// Check for newly joined users
		for (const [uid, clientState] of currentRemoteUsers.entries()) {
			if (!previousUsers.has(uid)) {
				const resolvedName = userProfiles[uid]?.displayName || clientState.user?.name || "Someone";
				toast(
					`${resolvedName} joined editing.`,
					"You can work together live.",
					"waving_hand",
					6000,
					"subtle"
				);
				console.log(`[Quiz Editor] ${resolvedName} joined the room`);
			}
		}

		// Check for users who left
		for (const uid of previousUsers) {
			if (!currentRemoteUsers.has(uid)) {
				const resolvedName = userProfiles[uid]?.displayName || "Someone";
				toast(`${resolvedName} stopped editing.`, "", "waving_hand", 6000, "subtle");
				console.log(`[Quiz Editor] ${resolvedName} left the room`);
			}
		}

		// Update the previous users tracker
		previousUsers = new Set(currentRemoteUsers.keys());
	});

	// Mouse share & Focus tracking
	function handleMouseMove(e: MouseEvent) {
		if (loading) return;
		room.updatePresence({
			cursor: { x: e.clientX, y: e.clientY }
		});
	}

	function handleFocus() {
		if (loading) return;
		room.updatePresence({ isFocused: true });
	}

	function handleBlur() {
		if (loading) return;
		room.updatePresence({ isFocused: false });
	}

	let activeQuestionData = $derived(questions.find((q) => q.id === activeQuestionId) || null);

	// Broadcast question selection
	$effect(() => {
		if (activeQuestionId !== null) {
			room.updatePresence({ activeQuestionId });
		}
	});

	$effect(() => {
		questionSidebarOpened = !appState.isMobile;
		mainSidebarOpened = !appState.isMobile;

		useShortcut("ctrl+]", () => (questionSidebarOpened = !questionSidebarOpened), {
			name: "Toggle right sidebar",
			description: "Toggle right sidebar.",
			preventDefault: true
		});
		useShortcut("ctrl+[", () => (mainSidebarOpened = !mainSidebarOpened), {
			name: "Toggle left sidebar",
			description: "Toggle left sidebar.",
			preventDefault: true
		});
		useShortcut("ctrl+shift+n", () => (showNewQuestionModal = true), {
			name: "Create new question",
			description: "Create new question.",
			preventDefault: true
		});
	});

	// Login check
	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				window.location.href = `${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`;
			}
		})();
	});

	// Auto-select first question once data arrives
	$effect(() => {
		if (!activeQuestionId && questions.length > 0) {
			activeQuestionId = questions[0].id;
		}
	});

	async function handleNewQuestionSelection(questiontype?: string) {
		showNewQuestionModal = false;
		if (!questiontype) return;

		const newId = crypto.randomUUID();
		room.addQuestion({
			id: newId,
			type: questiontype,
			title: "New Question",
			text: "",
			timeLimit: 20,
			pointsMultiplier: 1
		});

		activeQuestionId = newId;
	}

	function handleQuestionUpdate(updates: Record<string, any>) {
		if (activeQuestionId !== null) {
			room.updateQuestion(activeQuestionId, updates);
		}
	}

	function handleDeleteQuestion() {
		if (activeQuestionId !== null) {
			room.deleteQuestion(activeQuestionId);
			activeQuestionId = null;
		}
	}

	function handleDuplicateQuestion() {
		if (activeQuestionData) {
			const newId = crypto.randomUUID();
			const duplicatedQuestion = { ...activeQuestionData, id: newId };
			room.addQuestion(duplicatedQuestion);
			activeQuestionId = newId;
		}
	}
</script>

<svelte:window onmousemove={handleMouseMove} onfocus={handleFocus} onblur={handleBlur} />

<!-- Cursor Layer (Deduplicated based on user ID and focus) -->
<div style="position: fixed; inset: 0; pointer-events: none; z-index: 5; overflow: hidden;">
	{#each uniqueCursors as clientState}
		{@const userId = clientState.user?.userId}
		{@const fetchedProfile = userId ? userProfiles[userId] : null}
		{@const resolvedName = fetchedProfile?.displayName || clientState.user?.name || "?"}

		<div
			style="
                    position: absolute;
                    left: {clientState.cursor.x}px;
                    top: {clientState.cursor.y}px;
                    transition: left 0.04s linear, top 0.04s linear;
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                ">
			<!-- Pointer SVG icon -->
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill={clientState.user?.color || "#3b82f6"}
				stroke={token.theme.color.text.inverse}
				style="transform-origin: 0px 0px; transform: rotate(-25deg); filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3));">
				<path
					d="M5.5 3.21V20.8c-.05.45.45.72.8.43l3.78-3.15a1 1 0 0 1 .64-.23h6.05c.57 0 .81-.68.37-1.07L6.34 2.58c-.37-.33-.94-.06-.84.43z" />
			</svg>

			<!-- User Label Badge -->
			<span
				style="
                        background-color: {clientState.user?.color || '#3b82f6'};
                        color: white;
                        font-size: 11px;
                        font-weight: 600;
                        padding: 2px 6px;
                        border-radius: 4px;
                        margin-left: 10px;
                        margin-top: -6px;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">
				{resolvedName}
				{#if clientState.focusedField}
					<span style="opacity: 0.85;">({clientState.focusedField})</span>
				{/if}
			</span>
		</div>
	{/each}
</div>

<Flex direction="column">
	<div class={styles.frostbar}>
		{#if loading}
			<Skeleton height="2rem" width="15rem" />
		{:else}
			<span class={styles.title}>{quizName} <VisuallyHidden>. quiz</VisuallyHidden></span>
		{/if}

		<Flex width="fit-content" height="fit-content" gap="small" alignItems="center">
			<div style="display: flex; align-items: center; margin-right: 8px;">
				{#each uniqueProfiles as clientState}
					{@const userId = clientState.user.userId}
					{@const fetchedProfile = userProfiles[userId]}
					{@const resolvedAvatar = fetchedProfile?.avatarUrl || clientState.user.avatarUrl || ""}
					{@const resolvedName = fetchedProfile?.displayName || clientState.user.name || "User"}
					<Avatar
						src={resolvedAvatar}
						size="medium"
						alt={resolvedName}
						href={`${PUBLIC_ACCOUNT_FRONTEND_URL}/profile/${userId}`}
						opennewtab />
				{/each}
			</div>

			{#if appState.isMobile}
				<IconButton
					onclick={() => {}}
					icon="settings"
					appearance="default"
					disabled
					{loading}
					tip="Manage quiz" />
			{:else}
				<Button appearance="default" disabled {loading}>Manage quiz</Button>
				<Button appearance="default" disabled {loading}>Present quiz</Button>
			{/if}

			<LinkButton appearance="success" href="/manage">Exit</LinkButton>
		</Flex>
	</div>

	<Flex>
		<MainSidebar
			{questions}
			{activeQuestionId}
			{mainSidebarOpened}
			activeUsers={room.activeUsers}
			{userProfiles}
			currentClientId={room.doc.clientID}
			onToggle={() => (mainSidebarOpened = !mainSidebarOpened)}
			{loading}
			onNewQuestion={() => (showNewQuestionModal = true)}
			onSelectQuestion={(id) => (activeQuestionId = id)} />

		{#if loading}
			<LoadingQuestion />
		{:else if activeQuestionData}
			<MultipleChoice question={activeQuestionData} onUpdate={handleQuestionUpdate} />
		{/if}

		{#if activeQuestionId && activeQuestionData}
			<QuestionSidebar
				question={activeQuestionData}
				{questionSidebarOpened}
				{loading}
				{openDropdown}
				onToggle={() => (questionSidebarOpened = !questionSidebarOpened)}
				onDropdownToggle={(name) => (openDropdown = name)}
				onUpdate={handleQuestionUpdate}
				onDelete={handleDeleteQuestion}
				onDuplicate={handleDuplicateQuestion} />
		{:else if !loading}
			<Flex
				justifyContent="center"
				alignItems="center"
				direction="column"
				gap="medium"
				text="center"
				style="width: 100%;">
				<Icon icon="comments_disabled" size="giant" />
				<span
					style="font-size: {token.global.font.size.xlarge}; font-weight: {token.global.font.weight
						.medium}">
					Welcome to quiz '{quizName}'.
				</span>
				<span>Let's start by creating a new question!</span>
				<Button
					appearance="discover"
					iconbefore="add"
					onclick={() => {
						showNewQuestionModal = true;
					}}>
					Create new question
				</Button>
			</Flex>
		{/if}
	</Flex>

	{#if showNewQuestionModal}
		<NewQuestionModal {handleNewQuestionSelection} />
	{/if}
</Flex>
