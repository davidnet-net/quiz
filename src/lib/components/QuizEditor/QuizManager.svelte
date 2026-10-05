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
	import * as m from "$lib/paraglide/messages.js";

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
				toast(m.common_updated_title(), m.common_quiz_name_updated_content(), "check", 3000, "success");
			} else {
				toast(m.common_error_title(), res?.error || m.qm_toast_update_name_failed(), "error", 4000, "danger");
			}
		} catch (err) {
			console.error("Failed to update quiz name:", err);
			toast(m.common_error_title(), m.qm_toast_update_name_failed(), "error", 4000, "danger");
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
					m.qm_toast_user_not_found_title(),
					m.qm_toast_user_not_found_content({ username }),
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
				toast(
					m.qm_toast_invite_sent_title(),
					m.qm_toast_invite_sent_content({ username }),
					"check",
					3000,
					"success"
				);
				newCollaboratorUsername = "";
				await loadCollaborators();
			} else {
				let errorMsg = res?.error || m.qm_toast_send_invite_failed();
				if (res?.code === "CANNOT_INVITE_SELF") {
					errorMsg = m.qm_error_cannot_invite_self();
				} else if (res?.code === "COLLABORATOR_ALREADY_EXISTS") {
					errorMsg = m.qm_error_already_collaborator();
				}

				toast(m.common_error_title(), errorMsg, "error", 4000, "danger");
			}
		} catch (err) {
			console.error("Failed to send invite:", err);
			toast(m.common_error_title(), m.qm_toast_send_invite_failed(), "error", 4000, "danger");
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
					isInvite ? m.qm_toast_invite_cancelled_title() : m.qm_toast_collaborator_removed_title(),
					isInvite ? m.qm_toast_invite_cancelled_content() : m.qm_toast_collaborator_removed_content(),
					"check",
					3000,
					"success"
				);
				collaborators = collaborators.filter((c) => c.userId !== userId);
				invitedPeople = invitedPeople.filter((c) => c.userId !== userId);
			}
		} catch (err) {
			console.error("Failed to perform action:", err);
			toast(m.common_error_title(), m.qm_toast_action_failed(), "error", 4000, "danger");
		}
	}
</script>

<Tabs bind:selected={activeTab}>
	<Modal title={m.qm_modal_title({ name: nameValue })} {onclose}>
		<Flex direction="column" gap="medium">
			<Flex direction="row" gap="small" height="fit-content" width="fit-content">
				<Tab value="general">{m.qm_tab_general()}</Tab>
				<Tab value="collaborators">{m.qm_tab_collaborators()}</Tab>
			</Flex>

			<TabPanel value="general">
				<Form id="manage-quiz-form" onsubmit={handleSubmit} style="width: 100%;">
					<Flex direction="column" gap="small" width="100%">
						<Field label={m.common_quiz_name_label()} name="quizName">
							<Flex direction="row" gap="small" alignItems="center" width="100%">
								<TextField maxlength={30} bind:value={nameValue} disabled={isSaving} width="100%" />
								<Button
									appearance="primary"
									disabled={!isValid}
									loading={isSaving}
									form="manage-quiz-form"
									type="submit">
									{m.common_save()}
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
						<span style="font-weight: 600;">{m.qm_invite_collaborator_label()}</span>
						<Flex direction="row" gap="small" alignItems="center" width="100%">
							<TextField
								placeholder={m.qm_username_placeholder()}
								bind:value={newCollaboratorUsername}
								disabled={addingCollaborator}
								width="100%" />
							<Button
								appearance="primary"
								disabled={!newCollaboratorUsername.trim()}
								loading={addingCollaborator}
								onclick={sendInvite}>
								{m.qm_send_invite_button()}
							</Button>
						</Flex>
					</Flex>

					<!-- Collaborators List -->
					<Flex direction="column" gap="small" width="100%">
						<span style="font-weight: 600;">{m.qm_collaborators_label()}</span>
						<Flex
							direction="column"
							gap="small"
							style="max-height: 120px; overflow-y: auto; width: 100%;">
							{#if loadingCollaborators}
								<span>{m.qm_loading_collaborators()}</span>
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
											{m.qm_remove_button()}
										</Button>
									</Flex>
								{/each}
							{:else}
								<span style="opacity: 0.7; font-size: 13px;">{m.qm_no_active_collaborators()}</span>
							{/if}
						</Flex>
					</Flex>

					<!-- Invited People (Pending) List -->
					<Flex direction="column" gap="small" width="100%">
						<span style="font-weight: 600;">{m.qm_invited_people_label()}</span>
						<Flex
							direction="column"
							gap="small"
							style="max-height: 120px; overflow-y: auto; width: 100%;">
							{#if loadingCollaborators}
								<span>{m.qm_loading_invites()}</span>
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
											{m.qm_cancel_invite_button()}
										</Button>
									</Flex>
								{/each}
							{:else}
								<span style="opacity: 0.7; font-size: 13px;">{m.qm_no_pending_invites()}</span>
							{/if}
						</Flex>
					</Flex>
				</Flex>
			</TabPanel>
		</Flex>

		{#snippet actions()}
			<Button disabled={isSaving} onclick={onclose}>{m.common_close()}</Button>
		{/snippet}
	</Modal>
</Tabs>
