<script lang="ts">
	import {
		Button,
		Modal,
		Form,
		Field,
		TextField,
		Flex,
		Avatar,
		toast,
		getCurrentWorkspace,
		Tabs,
		Tab,
		TabPanel
	} from "@davidnet-net/svelte-ui";
	import { getFetch, postFetch, deleteFetch, patchFetch } from "@davidnet-net/svelte-ui";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import { onMount } from "svelte";

	const currentWorkspace = $derived(getCurrentWorkspace());

	let {
		onclose,
		quizName,
		quizId,
		onUpdateName
	}: {
		onclose: () => void;
		quizName: string;
		quizId: string;
		onUpdateName: (newName: string) => void;
	} = $props();

	let activeTab = $state("general");

	// svelte-ignore state_referenced_locally
	let nameValue = $state(quizName);
	let isSaving = $state(false);

	let isValid = $derived(
		nameValue.trim().length > 0 && nameValue.length <= 30 && nameValue.trim() !== quizName
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!isValid || !currentWorkspace?.id) return;

		isSaving = true;
		try {
			const res = await patchFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/${quizId}`,
				{ name: nameValue.trim() },
				undefined,
				true
			);

			if (res && res.success) {
				onUpdateName(nameValue.trim());
				toast("Updated!", "Quiz name updated successfully.", "check", 3000, "success");
			} else {
				toast("Error", res?.error || "Failed to update quiz name.", "error", 4000, "danger");
			}
		} catch (err) {
			console.error("Failed to update quiz name:", err);
			toast("Error", "Failed to update quiz name.", "error", 4000, "danger");
		} finally {
			isSaving = false;
		}
	}

	let collaborators = $state<any[]>([]);
	let invitedPeople = $state<any[]>([]);
	let loadingCollaborators = $state(true);
	let newCollaboratorUsername = $state("");
	let addingCollaborator = $state(false);

	async function loadCollaborators() {
		if (!quizId || !currentWorkspace?.id) return;
		loadingCollaborators = true;
		try {
			const res = await getFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/${quizId}/collaborators`,
				undefined,
				undefined,
				true
			);
			if (res && res.success) {
				const rawList = res.collaborators || [];

				const enrichedList = await Promise.all(
					rawList.map(async (c: any) => {
						try {
							const profileRes = await getFetch(
								`${PUBLIC_BACKEND_URL}/auth/profile`,
								{ user: c.userId },
								undefined,
								true
							);
							if (profileRes && profileRes.success) {
								return { ...c, profile: profileRes.profileResponse };
							}
						} catch {
							// Ignore profile fetch errors
						}
						return c;
					})
				);

				collaborators = enrichedList.filter((c: any) => c.status === "accepted");
				invitedPeople = enrichedList.filter((c: any) => c.status === "pending");
			}
		} catch (err) {
			console.error("Failed to load collaborators:", err);
		} finally {
			loadingCollaborators = false;
		}
	}

	onMount(() => {
		loadCollaborators();
	});

	async function sendInvite() {
		const username = newCollaboratorUsername.trim().replace(/^@/, "").toLowerCase();
		if (!username || !currentWorkspace?.id) return;

		addingCollaborator = true;
		try {
			const profileRes = await getFetch(
				`${PUBLIC_BACKEND_URL}/auth/profile`,
				{ user: username },
				undefined,
				true
			);

			if (!profileRes || !profileRes.success || !profileRes.profileResponse?.userId) {
				toast(
					"User not found",
					`Could not find a user with username "@${username}".`,
					"error",
					4000,
					"danger"
				);
				addingCollaborator = false;
				return;
			}

			const targetUserId = profileRes.profileResponse.userId;

			const res = await postFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/${quizId}/collaborators`,
				{ userId: targetUserId },
				undefined,
				true
			);

			if (res && res.success) {
				toast("Invite sent!", `Invitation sent to @${username}.`, "check", 3000, "success");
				newCollaboratorUsername = "";
				await loadCollaborators();
			} else {
				let errorMsg = res?.error || "Failed to send invite.";
				if (res?.code === "CANNOT_INVITE_SELF") {
					errorMsg = "You cannot invite yourself to your own quiz.";
				} else if (res?.code === "COLLABORATOR_ALREADY_EXISTS") {
					errorMsg = "This user is already a collaborator or has a pending invite.";
				}

				toast("Error", errorMsg, "error", 4000, "danger");
			}
		} catch (err) {
			console.error("Failed to send invite:", err);
			toast("Error", "Failed to send invite.", "error", 4000, "danger");
		} finally {
			addingCollaborator = false;
		}
	}

	async function removeCollaborator(userId: string, isInvite: boolean = false) {
		if (!currentWorkspace?.id) return;
		try {
			const res = await deleteFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/${quizId}/collaborators/${userId}`,
				undefined,
				undefined,
				true
			);
			if (res && res.success) {
				toast(
					isInvite ? "Invite cancelled" : "Collaborator removed",
					isInvite ? "Invitation has been cancelled." : "Collaborator has been removed.",
					"check",
					3000,
					"success"
				);
				collaborators = collaborators.filter((c) => c.userId !== userId);
				invitedPeople = invitedPeople.filter((c) => c.userId !== userId);
			}
		} catch (err) {
			console.error("Failed to perform action:", err);
			toast("Error", "Failed to perform action.", "error", 4000, "danger");
		}
	}
</script>

<Tabs bind:selected={activeTab}>
	<Modal title={`Manage quiz: ${nameValue}`} {onclose}>
		<Flex direction="column" gap="medium">
			<Flex direction="row" gap="small" height="fit-content" width="fit-content">
				<Tab value="general">General</Tab>
				<Tab value="collaborators">Collaborators & Invites</Tab>
			</Flex>

			<TabPanel value="general">
				<Form id="manage-quiz-form" onsubmit={handleSubmit} style="width: 100%;">
					<Flex direction="column" gap="small" width="100%">
						<Field label="Quiz name:" name="quizName">
							<Flex direction="row" gap="small" alignItems="center" width="100%">
								<TextField maxlength={30} bind:value={nameValue} disabled={isSaving} width="100%" />
								<Button
									appearance="primary"
									disabled={!isValid}
									loading={isSaving}
									form="manage-quiz-form"
									type="submit">
									Save
								</Button>
							</Flex>
						</Field>
					</Flex>
				</Form>
			</TabPanel>

			<TabPanel value="collaborators">
				<Flex direction="column" gap="large" width="100%">
					<!-- Send Invite Section -->
					<Flex direction="column" gap="small" width="100%">
						<span style="font-weight: 600;">Invite collaborator</span>
						<Flex direction="row" gap="small" alignItems="center" width="100%">
							<TextField
								placeholder="Enter username (e.g. john)"
								bind:value={newCollaboratorUsername}
								disabled={addingCollaborator}
								width="100%" />
							<Button
								appearance="primary"
								disabled={!newCollaboratorUsername.trim()}
								loading={addingCollaborator}
								onclick={sendInvite}>
								Send invite
							</Button>
						</Flex>
					</Flex>

					<!-- Collaborators List -->
					<Flex direction="column" gap="small" width="100%">
						<span style="font-weight: 600;">Collaborators</span>
						<Flex
							direction="column"
							gap="small"
							style="max-height: 120px; overflow-y: auto; width: 100%;">
							{#if loadingCollaborators}
								<span>Loading collaborators...</span>
							{:else if collaborators.length > 0}
								{#each collaborators as collab (collab.userId)}
									<Flex
										justifyContent="between"
										alignItems="center"
										style="padding: 6px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; width: 100%;">
										<Flex alignItems="center" gap="small">
											<Avatar
												src={collab.profile?.avatarUrl || ""}
												size="small"
												alt={collab.profile?.displayName || collab.profile?.username || "User"} />
											<span style="font-size: 13px;">
												{collab.profile?.displayName
													? `${collab.profile.displayName} (@${collab.profile.username})`
													: `@${collab.userId}`}
											</span>
										</Flex>
										<Button
											appearance="danger"
											onclick={() => removeCollaborator(collab.userId, false)}>
											Remove
										</Button>
									</Flex>
								{/each}
							{:else}
								<span style="opacity: 0.7; font-size: 13px;">No active collaborators.</span>
							{/if}
						</Flex>
					</Flex>

					<!-- Invited People (Pending) List -->
					<Flex direction="column" gap="small" width="100%">
						<span style="font-weight: 600;">Invited people (Pending)</span>
						<Flex
							direction="column"
							gap="small"
							style="max-height: 120px; overflow-y: auto; width: 100%;">
							{#if loadingCollaborators}
								<span>Loading invites...</span>
							{:else if invitedPeople.length > 0}
								{#each invitedPeople as invite (invite.userId)}
									<Flex
										justifyContent="between"
										alignItems="center"
										style="padding: 6px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; width: 100%;">
										<Flex alignItems="center" gap="small">
											<Avatar
												src={invite.profile?.avatarUrl || ""}
												size="small"
												alt={invite.profile?.displayName || invite.profile?.username || "User"} />
											<span style="font-size: 13px;">
												{invite.profile?.displayName
													? `${invite.profile.displayName} (@${invite.profile.username})`
													: `@${invite.userId}`}
											</span>
										</Flex>
										<Button
											appearance="danger"
											onclick={() => removeCollaborator(invite.userId, true)}>
											Cancel invite
										</Button>
									</Flex>
								{/each}
							{:else}
								<span style="opacity: 0.7; font-size: 13px;">No pending invites.</span>
							{/if}
						</Flex>
					</Flex>
				</Flex>
			</TabPanel>
		</Flex>

		{#snippet actions()}
			<Button disabled={isSaving} onclick={onclose}>Close</Button>
		{/snippet}
	</Modal>
</Tabs>
