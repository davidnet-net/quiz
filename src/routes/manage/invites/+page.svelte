<script lang="ts">
	import {
		authState,
		Avatar,
		Button,
		Flex,
		Icon,
		LinkButton,
		Skeleton,
		toast,
		whenAuthReady,
		getFetch,
		postFetch,
		deleteFetch,
		getCurrentWorkspace
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { onMount } from "svelte";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	let invites = $state<any[]>([]);
	let loading = $state(true);

	const currentWorkspace = $derived(getCurrentWorkspace());

	async function loadInvites() {
		if (!currentWorkspace) {
			return;
		}
		loading = true;
		try {
			const res = await getFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/invites`,
				undefined,
				undefined,
				true
			);
			if (res && res.success) {
				invites = res.invites || [];
			}
		} catch (err) {
			console.error("Failed to load invites:", err);
		} finally {
			loading = false;
		}
	}

	async function acceptInvite(quizId: string) {
		if (!currentWorkspace) {
			return;
		}
		try {
			const res = await postFetch(
				`${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/${quizId}/collaborators/accept`,
				{},
				undefined,
				true
			);
			if (res && res.success) {
				toast(
					"Invite accepted",
					"You are now a collaborator on this quiz.",
					"check",
					3000,
					"success"
				);
				invites = invites.filter((inv) => inv.quizId !== quizId);
			}
		} catch (err) {
			console.error("Failed to accept invite:", err);
			toast("Error", "Failed to accept invite.", "error", 3000, "danger");
		}
	}

	async function denyInvite(quizId: string) {
		if (!currentWorkspace) {
			return;
		}
		try {
			const res = await deleteFetch(
				`${PUBLIC_BACKEND_URL}${PUBLIC_BACKEND_URL}/workspaces/${currentWorkspace.id}/quiz/${quizId}/collaborators/decline`,
				undefined,
				undefined,
				true
			);
			if (res && res.success) {
				toast("Invite declined", "You have declined the quiz invitation.", "close", 3000, "subtle");
				invites = invites.filter((inv) => inv.quizId !== quizId);
			}
		} catch (err) {
			console.error("Failed to deny invite:", err);
			toast("Error", "Failed to deny invite.", "error", 3000, "danger");
		}
	}

	onMount(() => {
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible" && authState.isLoggedIn) {
				await loadInvites();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	});

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (authState.isLoggedIn) {
				await loadInvites();
			}
		})();
	});
</script>

<div
	style="width: 100%; max-width: 48rem; margin: 0 auto; box-sizing: border-box; padding: 2rem 1rem;">
	<Flex alignItems="start" justifyContent="start" direction="column" gap="large" width="100%">
		<Flex justifyContent="between" alignItems="center" width="100%">
			<h1>Quiz invitations</h1>
			<LinkButton appearance="default" href="/manage">Back to quizes</LinkButton>
		</Flex>

		<Flex direction="column" gap="medium" width="100%">
			{#if loading}
				<Skeleton width="100%" height="5rem" />
				<Skeleton width="100%" height="5rem" />
			{:else if invites.length > 0}
				{#each invites as invite (invite.quizId)}
					<Flex
						justifyContent="between"
						alignItems="center"
						style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: {token.global
							.radius.medium}; width: 100%; box-sizing: border-box;"
						gap="medium"
						flexWrap="wrap">
						<Flex direction="column" gap="xsmall">
							<span style="font-weight: 600; font-size: {token.global.font.size.large};">
								{invite.quizName || "Untitled Quiz"}
							</span>
							<span style="opacity: 0.7; font-size: 13px;">Invited to collaborate</span>
						</Flex>

						<Flex gap="small" alignItems="center">
							<Button appearance="primary" onclick={() => acceptInvite(invite.quizId)}>
								Accept
							</Button>
							<Button appearance="danger" onclick={() => denyInvite(invite.quizId)}>Deny</Button>
						</Flex>
					</Flex>
				{/each}
			{:else}
				<Flex
					justifyContent="center"
					alignItems="center"
					direction="column"
					gap="medium"
					style="width: 100%; padding: 3rem 0; text-align: center;">
					<Icon icon="mail" size="giant" />
					<span style="opacity: 0.7; font-size: {token.global.font.size.medium};">
						You have no pending quiz invitations.
					</span>
				</Flex>
			{/if}
		</Flex>
	</Flex>
</div>
