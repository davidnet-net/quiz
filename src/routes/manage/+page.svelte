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
		name: "Workspace-wide"
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
				"Not allowed",
				"You are not allowed to create quizzes in this context.",
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
			toast("Quiz created!", `Created "${newQuizName}" successfully.`, "check", 3000, "success");

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
			toast("Updated!", "Quiz name updated successfully.", "check", 3000, "success");
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
			toast("Deleted!", `Quiz "${quiz.name}" was deleted.`, "delete", 3000, "success");
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
			toast("Removed", `You left collaboration on "${quiz.name}".`, "check", 3000, "success");
			sharedQuizzes = sharedQuizzes.filter((q) => q.id !== quiz.id);
		}

		quizToStopCollab = null;
		quizStoppingCollab = false;
	}
</script>

<div style="padding: {token.global.spacing.giant}">
	{#if currentWorkspace?.name && !loading}
		<Flex justifyContent="between" height="fit-content" alignItems="center" gap="small">
			<h1>{currentWorkspace?.name} quizes:</h1>
			<Flex height="fit-content" width="fit-content" gap="small">
				<LinkButton appearance="default" href="/manage/invites">View invites</LinkButton>
				{#if canCreateQuizAnywhere}
					<Button
						appearance="primary"
						iconbefore="add"
						onclick={() => {
							selectedTarget = canCreateQuizOrgWide
								? { id: null, name: "Workspace-wide" }
								: { id: firstAllowedTeam?.id || null, name: firstAllowedTeam?.name || "Unknown" };
							showNewQuizModal = true;
						}}>
						New quiz
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
									tip="Options"
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
										quizToRename = quiz;
										quizRenameValue = quiz.name;
										openQuizDropdownId = null;
									}}>
									Rename quiz
								</Button>
							{/if}

							{#if quiz.teamId ? hasPermission("quiz:delete", quiz.teamId) : hasPermission("quiz:delete")}
								<Button
									alignContent="left"
									type="button"
									appearance="subtle"
									onclick={() => {
										quizToDelete = quiz;
										openQuizDropdownId = null;
									}}>
									Delete quiz
								</Button>
							{:else}
								<Button type="button" appearance="subtle" disabled>Delete (No permission)</Button>
							{/if}
						</Dropdown>
					</Flex>
					<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
						<LinkButton href={`/manage/${quiz.id}/edit`}>Edit quiz</LinkButton>
						<LinkButton href={`#`} appearance="primary" disabled>Present quiz</LinkButton>
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
						{currentWorkspace?.type === "personal" ? "You do" : `${currentWorkspace?.name} does`} not
						have any quizes yet.
					</span>
					<p>Start by creating one</p>
				</Flex>
				<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
					{#if canCreateQuizAnywhere}
						<Button
							appearance="primary"
							iconbefore="add"
							onclick={() => {
								selectedTarget = canCreateQuizOrgWide
									? { id: null, name: "Workspace-wide" }
									: { id: firstAllowedTeam?.id || null, name: firstAllowedTeam?.name || "Unknown" };
								showNewQuizModal = true;
							}}>
							New quiz
						</Button>
					{/if}
				</Flex>
			</div>
		{/if}
	</Flex>

	<!-- SECTION 2: SHARED WITH YOU -->
	<br />
	<h2>Shared with you:</h2>
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
									tip="Options"
									onclick={() => {
										openQuizDropdownId = openQuizDropdownId === quiz.id ? null : quiz.id;
									}} />
							{/snippet}

							<Button
								alignContent="left"
								type="button"
								appearance="subtle"
								onclick={() => {
									quizToStopCollab = quiz;
									openQuizDropdownId = null;
								}}>
								Stop collaborating
							</Button>
						</Dropdown>
					</Flex>
					<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
						<LinkButton href={`/manage/${quiz.id}/edit`}>Edit quiz</LinkButton>
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
					<span class={styles.quizName}>No quizzes have been shared with you yet.</span>
					<p>Quizzes shared by others will appear here.</p>
				</Flex>
				<Flex justifyContent="end" height="fit-content" alignItems="center" gap="small">
					<LinkButton appearance="default" href="/manage/invites">View invites</LinkButton>
				</Flex>
			</div>
		{/if}
	</Flex>

	<!-- Create Quiz Modal -->
	{#if showNewQuizModal}
		<Modal
			title="New quiz"
			onclose={() => {
				if (quizCreating) return;
				showNewQuizModal = false;
			}}>
			<Form
				id="new-quiz"
				onsubmit={(e) => {
					e.preventDefault();
					createQuiz();
				}}>
				<Flex direction="column" gap="medium">
					<Field label="Quiz name:" name="quizName">
						<TextField maxlength={30} bind:value={newQuizName} disabled={quizCreating} />
					</Field>

					<Field label="Create in:" name="quizTarget">
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
										selectedTarget = { id: null, name: "Workspace-wide" };
										targetDropdownOpen = false;
									}}>
									Workspace-wide
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
					Cancel
				</Button>
				<Button
					appearance="primary"
					disabled={!isQuizNameValid}
					loading={quizCreating}
					form="new-quiz"
					type="submit">
					Create
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- Rename Quiz Modal -->
	{#if quizToRename}
		<Modal
			title="Rename quiz"
			onclose={() => {
				if (quizRenaming) return;
				quizToRename = null;
			}}>
			<Form
				id="rename-quiz"
				onsubmit={(e) => {
					e.preventDefault();
					renameQuiz();
				}}>
				<Field label="New quiz name:" name="renameQuizName">
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
					Cancel
				</Button>
				<Button
					appearance="primary"
					disabled={!isRenameNameValid}
					loading={quizRenaming}
					form="rename-quiz"
					type="submit">
					Save changes
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if quizToDelete}
		<Modal
			title="Delete quiz"
			onclose={() => {
				if (quizDeleting) return;
				quizToDelete = null;
			}}>
			<p>
				Are you sure you want to delete the quiz
				<strong>{quizToDelete.name}</strong>
				? This action cannot be undone.
			</p>
			<br />
			{#snippet actions()}
				<Button
					disabled={quizDeleting}
					onclick={() => {
						quizToDelete = null;
					}}>
					Cancel
				</Button>
				<Button
					appearance="danger"
					loading={quizDeleting}
					onclick={() => deleteQuiz(quizToDelete!)}>
					Delete quiz
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- Stop Collaborating Confirmation Modal -->
	{#if quizToStopCollab}
		<Modal
			title="Stop collaborating"
			onclose={() => {
				if (quizStoppingCollab) return;
				quizToStopCollab = null;
			}}>
			<p>
				Are you sure you want to stop collaborating on
				<strong>{quizToStopCollab.name}</strong>
				? You will lose access to edit this quiz.
			</p>
			<br />
			{#snippet actions()}
				<Button
					disabled={quizStoppingCollab}
					onclick={() => {
						quizToStopCollab = null;
					}}>
					Cancel
				</Button>
				<Button
					appearance="danger"
					loading={quizStoppingCollab}
					onclick={() => stopCollaborating(quizToStopCollab!)}>
					Stop collaborating
				</Button>
			{/snippet}
		</Modal>
	{/if}
</div>
