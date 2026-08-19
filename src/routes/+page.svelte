<script lang="ts">
	import { authState, whenAuthReady } from "@davidnet-net/svelte-ui";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_ACCOUNT_FRONTEND_URL } from "$env/static/public";
	import MarkdownEditor from "$lib/components/MarkdownEditor/MarkdownEditor.svelte";

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();
	});
</script>

<MarkdownEditor />
