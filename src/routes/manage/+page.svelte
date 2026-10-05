<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_ACCOUNT_FRONTEND_URL, PUBLIC_BACKEND_URL } from "$env/static/public";
	import Card from "$lib/components/Card/Card.svelte";
	import {
		LinkButton,
		Flex,
		appState,
		Skeleton,
		whenAuthReady,
		authState,
		IconButton,
		Button,
		Modal,
		Form,
		Field,
		TextField,
		toast,
		getCurrentWorkspace,
		hasPermission,
		Dropdown,
		getFetch,
		postFetch,
		patchFetch,
		deleteFetch
	} from "@davidnet-net/svelte-ui";
	import { onMount } from "svelte";
	import * as styles from "./page.css";
	import * as m from "$lib/paraglide/messages.js";
	import type { Quiz } from "$lib/types/quizes";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	const currentWorkspace = $derived(getCurrentWorkspace());

	// State lists
	let teams: { id: string; name: string }[] = $state([]);
	let quizes: Quiz[] = $state([]);
	let sharedQuizzes: Quiz[] = $state([]);
	let loading = $state(true);

	// Dropdown and Action tracking
	let openQuizDropdownId = $state<string | null>(null);
	let quizToDelete = $state<Quiz | null>(null);
	let quizDeleting = $state(false);

	let quizToRename = $state<Quiz | null>(null);
	let quizRenameValue = $state("");
	let quizRenaming = $state(false);
	const isRenameNameValid = $derived(
		quizRenameValue.trim().length > 0 && quizRenameValue.length <= 30
	);

	let quizToStopCollab = $state<Quiz | null>(null);
	let quizStoppingCollab = $state(false);

	// Check permissions dynamically
	const canCreateQuizOrgWide = $derived(hasPermission("quiz:create"));

	// Find the first team where the user has permission to create a quiz
	const firstAllowedTeam = $derived(teams.find((t) => hasPermission("quiz:create", t.id)));

	// They can see the "New quiz" button if they have org-wide permission OR permission in at least one team
	const canCreateQuizAnywhere = $derived(canCreateQuizOrgWide || !!firstAllowedTeam);

	async function loadData() {
		if (!currentWorkspace?.id) return;
		loading = true;

		try {
			if (currentWorkspace.type !== "personal") {
				const teamsRes = await getFetch(
					`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/teams`,
					undefined,
					undefined,
					true
				);
				if (teamsRes && teamsRes.success) {
					teams = teamsRes.teams || [];
				}
			}

			// 1. Fetch Owned/Team Quizzes
			const quizRes = await getFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz`,
				undefined,
				undefined,
				true
			);

			if (quizRes && quizRes.success) {
				quizes = quizRes.quizzes || [];
			}

			// 2. Fetch Shared Quizzes
			const sharedRes = await getFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/shared`,
				undefined,
				undefined,
				true
			);

			if (sharedRes && sharedRes.success) {
				sharedQuizzes = sharedRes.quizzes || [];
			}
		} catch (error) {
			console.error("Failed to load dashboard data:", error);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		(async () => {
			appState.hideNavigation = false;
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				window.location.href = `${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`;
				return;
			}

			if (currentWorkspace?.id) {
				loadData();
			}
		})();
	});

	onMount(() => {
		document.addEventListener("visibilitychange", async () => {
			if (document.visibilityState === "visible") {
				await loadData();
			}
		});
	});

	// Quiz form state
	let newQuizName = $state("");
	const isQuizNameValid = $derived(newQuizName.trim().length > 0 && newQuizName.length <= 30);

	let targetDropdownOpen = $state(false);
	let selectedTarget = $state<{ id: string | null; name: string }>({
		id: null,
		name: m.page_manage_workspace_wide()
	});

	let showNewQuizModal = $state(false);
	let quizCreating = $state(false);

	async function createQuiz() {
		quizCreating = true;
		if (!isQuizNameValid) {
			quizCreating = false;
			return;
		}

		const isAllowed = selectedTarget.id
			? hasPermission("quiz:create", selectedTarget.id)
			: canCreateQuizOrgWide;

		if (!isAllowed) {
			toast(
				m.page_manage_toast_not_allowed_title(),
				m.page_manage_toast_not_allowed_content(),
				"rule",
				5000,
				"danger"
			);
			quizCreating = false;
			showNewQuizModal = false;
			return;
		}

		const endpoint = selectedTarget.id
			? `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/teams/${selectedTarget.id}/quiz/create`
			: `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/quiz/create`;

		const res = await postFetch(endpoint, { name: newQuizName.trim() }, undefined, true);

		if (res && res.success) {
			toast(
				m.page_manage_toast_created_title(),
				m.page_manage_toast_created_content({ name: newQuizName }),
				"check",
				3000,
				"success"
			);

			if (res.quiz) {
				quizes = [res.quiz, ...quizes];
			}

			showNewQuizModal = false;
			newQuizName = "";
		}

		quizCreating = false;
	}

	async function renameQuiz() {
		if (!quizToRename || !isRenameNameValid) return;
		quizRenaming = true;

		const endpoint = quizToRename.teamId
			? `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/teams/${quizToRename.teamId}/quiz/${quizToRename.id}`
			: `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/quiz/${quizToRename.id}`;

		const res = await patchFetch(endpoint, { name: quizRenameValue.trim() }, undefined, true);

		if (res && res.success) {
			toast(m.common_updated_title(), m.common_quiz_name_updated_content(), "check", 3000, "success");
			quizes = quizes.map((q) =>
				q.id === quizToRename?.id ? { ...q, name: quizRenameValue.trim() } : q
			);
			quizToRename = null;
		}

		quizRenaming = false;
	}

	async function deleteQuiz(quiz: Quiz) {
		quizDeleting = true;

		const endpoint = quiz.teamId
			? `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/teams/${quiz.teamId}/quiz/${quiz.id}`
			: `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/quiz/${quiz.id}`;

		const res = await deleteFetch(endpoint, undefined, undefined, true);

		if (res && res.success) {
			toast(
				m.page_manage_toast_deleted_title(),
				m.page_manage_toast_deleted_content({ name: quiz.name }),
				"delete",
				3000,
				"success"
			);
			quizes = quizes.filter((q) => q.id !== quiz.id);
		}

		quizToDelete = null;
		quizDeleting = false;
	}

	async function stopCollaborating(quiz: Quiz) {
		quizStoppingCollab = true;

		const endpoint = `${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace?.id}/quiz/${quiz.id}/collaborators/me`;
		const res = await deleteFetch(endpoint, undefined, undefined, true);

		if (res && res.success) {
			toast(
				m.page_manage_toast_removed_title(),
				m.page_manage_toast_left_collab({ name: quiz.name }),
				"check",
				3000,
				"success"
			);
			sharedQuizzes = sharedQuizzes.filter((q) => q.id !== quiz.id);
		}

		quizToStopCollab = null;
		quizStoppingCollab = false;
	}
</script>

<div style="padding: {token.global.spacing.giant}">
	{#if currentWorkspace?.name && !loading}
		<Flex justifyContent="between" height="fit-content" alignItems="center" gap="small">
			<h1>{m.page_manage_quizzes_heading({ name: currentWorkspace?.name ?? "" })}</h1>
			<Flex height="fit-content" width="fit-content" gap="small">
				<LinkButton appearance="default" href="/manage/invites">{m.page_manage_view_invites_link()}</LinkButton>
				{#if canCreateQuizAnywhere}
					<Button
						appearance="primary"
						iconbefore="add"
						onclick={() => {
							selectedTarget = canCreateQuizOrgWide
								? { id: null, name: m.page_manage_workspace_wide() }
								: {
										id: firstAllowedTeam?.id || null,
										name: firstAllowedTeam?.name || m.page_manage_unknown_team()
									};
							showNewQuizModal = true;
						}}>
						{m.page_manage_new_quiz_button()}
					</Button>
				{/if}
			</Flex>
		</Flex>
	{:else}
		<Skeleton height="3rem" width="18rem" />
	{/if}

	<!-- SECTION 1: MY QUIZZES -->
	<Flex flexWrap="wrap" gap="medium">
		{#if loading}
			<Skeleton height="10rem" width="22rem" />
			<Skeleton height="10rem" width="22rem" />
			<Skeleton height="10rem" width="22rem" />
		{:else if quizes.length > 0}
			{#each quizes as quiz (quiz.id)}
				<div class={styles.quizCard}>
					<Flex justifyContent="between" height="fit-content" alignItems="center" gap="small">
						<span class={styles.quizName}>{quiz.name}</span>

						<Dropdown isOpen={openQuizDropdownId === quiz.id}>
							{#snippet trigger()}
								<IconButton
									icon="more_vert"
									tip={m.page_manage_options_tip()}
									onclick={() => {
										openQuizDropdownId = openQuizDropdownId === quiz.id ? null : quiz.id;
									}} />
							{/snippet}

							{#if quiz.teamId ? hasPermission("quiz:edit", quiz.teamId) : hasPermission("quiz:edit")}
								<Button
									alignContent="left"
									type="button"
									appearance="subtle"
									onclick={() => {
										openQuizDropdownId = null;
										setTimeout(() => {
											quizToRename = quiz;
											quizRenameValue = quiz.name;
										}, 0);
									}}>
									{m.page_manage_rename_quiz()}
								</Button>
							{/if}

							{#if quiz.teamId ? hasPermission("quiz:delete", quiz.teamId) : hasPermission("quiz:delete")}
								<Button
									alignContent="left"
									type="button"
									appearance="subtle"
									onclick={() => {
										openQuizDropdownId = null;
										setTimeout(() => {
											quizToDelete = quiz;
										}, 0);
									}}>
									{m.page_manage_delete_quiz()}
								</Button>
							{/if}
						</Dropdown>
					</Flex>
					<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
						<LinkButton href={`/manage/${quiz.id}/edit`}>{m.page_manage_edit_quiz_link()}</LinkButton>
						<LinkButton appearance="primary" href={`/present/${quiz.id}`} {loading}>
							{m.common_present_quiz_link()}
						</LinkButton>
					</Flex>
				</div>
			{/each}
		{:else}
			<div class={styles.quizCard}>
				<Flex
					justifyContent="center"
					height="fit-content"
					direction="column"
					alignItems="start"
					gap="small">
					<span class={styles.quizName}>
						{currentWorkspace?.type === "personal"
							? m.page_manage_no_quizzes_personal()
							: m.page_manage_no_quizzes_team({ name: currentWorkspace?.name ?? "" })}
					</span>
					<p>{m.page_manage_start_creating()}</p>
				</Flex>
				<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
					{#if canCreateQuizAnywhere}
						<Button
							appearance="primary"
							iconbefore="add"
							onclick={() => {
								selectedTarget = canCreateQuizOrgWide
									? { id: null, name: m.page_manage_workspace_wide() }
									: {
											id: firstAllowedTeam?.id || null,
											name: firstAllowedTeam?.name || m.page_manage_unknown_team()
										};
								showNewQuizModal = true;
							}}>
							{m.page_manage_new_quiz_button()}
						</Button>
					{/if}
				</Flex>
			</div>
		{/if}
	</Flex>

	<!-- SECTION 2: SHARED WITH YOU -->
	<br />
	<h2>{m.page_manage_shared_heading()}</h2>
	<Flex flexWrap="wrap" gap="medium">
		{#if loading}
			<Skeleton height="10rem" width="22rem" />
		{:else if sharedQuizzes.length > 0}
			{#each sharedQuizzes as quiz (quiz.id)}
				<div class={styles.quizCard}>
					<Flex justifyContent="between" height="fit-content" alignItems="center" gap="small">
						<span class={styles.quizName}>{quiz.name}</span>

						<Dropdown isOpen={openQuizDropdownId === quiz.id}>
							{#snippet trigger()}
								<IconButton
									icon="more_vert"
									tip={m.page_manage_options_tip()}
									onclick={() => {
										openQuizDropdownId = openQuizDropdownId === quiz.id ? null : quiz.id;
									}} />
							{/snippet}

							<Button
								alignContent="left"
								type="button"
								appearance="subtle"
								onclick={() => {
									openQuizDropdownId = null;
									setTimeout(() => {
										quizToStopCollab = quiz;
									}, 0);
								}}>
								{m.page_manage_stop_collaborating()}
							</Button>
						</Dropdown>
					</Flex>
					<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
						<LinkButton href={`/manage/${quiz.id}/edit`}>{m.page_manage_edit_quiz_link()}</LinkButton>
					</Flex>
				</div>
			{/each}
		{:else}
			<div class={styles.quizCard}>
				<Flex
					justifyContent="center"
					height="fit-content"
					direction="column"
					alignItems="start"
					gap="small">
					<span class={styles.quizName}>{m.page_manage_no_shared()}</span>
					<p>{m.page_manage_shared_will_appear()}</p>
				</Flex>
				<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
					<LinkButton appearance="default" href="/manage/invites">{m.page_manage_view_invites_link()}</LinkButton>
				</Flex>
			</div>
		{/if}
	</Flex>

	<!-- Create Quiz Modal -->
	{#if showNewQuizModal}
		<Modal
			title={m.page_manage_new_quiz_modal_title()}
			onclose={() => {
				if (quizCreating) return;
				showNewQuizModal = false;
			}}>
			<Form
				id="new-quiz"
				onclick={(e) => e.stopPropagation()}
				onsubmit={(e) => {
					e.preventDefault();
					createQuiz();
				}}>
				<Flex direction="column" gap="medium">
					<Field label={m.common_quiz_name_label()} name="quizName">
						<TextField maxlength={30} bind:value={newQuizName} disabled={quizCreating} />
					</Field>

					<Field label={m.page_manage_create_in_label()} name="quizTarget">
						<Dropdown isOpen={targetDropdownOpen}>
							{#snippet trigger()}
								<Button
									type="button"
									disabled={quizCreating || currentWorkspace?.type === "personal"}
									onclick={() => {
										targetDropdownOpen = !targetDropdownOpen;
									}}
									appearance="discover">
									{selectedTarget.name}
								</Button>
							{/snippet}

							{#if canCreateQuizOrgWide}
								<Button
									type="button"
									appearance="subtle"
									onclick={() => {
										selectedTarget = { id: null, name: m.page_manage_workspace_wide() };
										targetDropdownOpen = false;
									}}>
									{m.page_manage_workspace_wide()}
								</Button>
							{/if}

							{#if currentWorkspace?.type !== "personal"}
								{#each teams as team}
									{#if hasPermission("quiz:create", team.id)}
										<Button
											type="button"
											appearance="subtle"
											onclick={() => {
												selectedTarget = { id: team.id, name: team.name };
												targetDropdownOpen = false;
											}}>
											{team.name}
										</Button>
									{/if}
								{/each}
							{/if}
						</Dropdown>
					</Field>
				</Flex>
			</Form>
			<br />
			{#snippet actions()}
				<Button
					disabled={quizCreating}
					onclick={() => {
						showNewQuizModal = false;
					}}>
					{m.common_cancel()}
				</Button>
				<Button
					appearance="primary"
					disabled={!isQuizNameValid}
					loading={quizCreating}
					form="new-quiz"
					type="submit">
					{m.page_manage_create_button()}
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- Rename Quiz Modal -->
	{#if quizToRename}
		<Modal
			title={m.page_manage_rename_modal_title()}
			onclose={() => {
				if (quizRenaming) return;
				quizToRename = null;
			}}>
			<Form
				id="rename-quiz"
				onclick={(e) => e.stopPropagation()}
				onsubmit={(e) => {
					e.preventDefault();
					renameQuiz();
				}}>
				<Field label={m.page_manage_new_quiz_name_label()} name="renameQuizName">
					<TextField maxlength={30} bind:value={quizRenameValue} disabled={quizRenaming} />
				</Field>
			</Form>
			<br />
			{#snippet actions()}
				<Button
					disabled={quizRenaming}
					onclick={() => {
						quizToRename = null;
					}}>
					{m.common_cancel()}
				</Button>
				<Button
					appearance="primary"
					disabled={!isRenameNameValid}
					loading={quizRenaming}
					form="rename-quiz"
					type="submit">
					{m.common_save_changes()}
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if quizToDelete}
		<Modal
			title={m.page_manage_delete_modal_title()}
			onclose={() => {
				if (quizDeleting) return;
				quizToDelete = null;
			}}>
			<p onclick={(e) => e.stopPropagation()}>
				{m.page_manage_delete_confirm()}
				<strong>{quizToDelete.name}</strong>
				{m.page_manage_delete_confirm_suffix()}
			</p>
			<br />
			{#snippet actions()}
				<Button
					disabled={quizDeleting}
					onclick={() => {
						quizToDelete = null;
					}}>
					{m.common_cancel()}
				</Button>
				<Button
					appearance="danger"
					loading={quizDeleting}
					onclick={() => deleteQuiz(quizToDelete!)}>
					{m.page_manage_delete_quiz()}
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- Stop Collaborating Confirmation Modal -->
	{#if quizToStopCollab}
		<Modal
			title={m.page_manage_stop_collab_modal_title()}
			onclose={() => {
				if (quizStoppingCollab) return;
				quizToStopCollab = null;
			}}>
			<p onclick={(e) => e.stopPropagation()}>
				{m.page_manage_stop_collab_confirm()}
				<strong>{quizToStopCollab.name}</strong>
				{m.page_manage_stop_collab_confirm_suffix()}
			</p>
			<br />
			{#snippet actions()}
				<Button
					disabled={quizStoppingCollab}
					onclick={() => {
						quizToStopCollab = null;
					}}>
					{m.common_cancel()}
				</Button>
				<Button
					appearance="danger"
					loading={quizStoppingCollab}
					onclick={() => stopCollaborating(quizToStopCollab!)}>
					{m.page_manage_stop_collaborating()}
				</Button>
			{/snippet}
		</Modal>
	{/if}
</div>
