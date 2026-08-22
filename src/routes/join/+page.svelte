<script lang="ts">
	import { authState, Button, Flex, navigateBack, whenAuthReady } from "@davidnet-net/svelte-ui";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_ACCOUNT_FRONTEND_URL } from "$env/static/public";
	import CodeInput from "$lib/components/CodeInput/CodeInput.svelte";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`${PUBLIC_ACCOUNT_FRONTEND_URL}/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();
	});
</script>

<Flex
	justifyContent="center"
	alignItems="center"
	direction="column"
	gap="medium"
	text="center"
	padding="giant">
	<div>
		<h1>Join quiz</h1>
		<p style="color: {token.theme.color.text.secondary}">
			Enter the code displayed on the host screen.
		</p>
	</div>
	<CodeInput />
	<Button
		iconbefore="arrow_back"
		onclick={() => {
			navigateBack();
		}}>
		Back
	</Button>
</Flex>
