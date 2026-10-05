<script lang="ts">
	import { appState, Flex } from "@davidnet-net/svelte-ui";
	import Card from "$lib/components/Card/Card.svelte";
	import * as m from "$lib/paraglide/messages.js";

	$effect(() => {
		(async () => {
			appState.hideNavigation = false;
		})();
	});
</script>

<Flex justifyContent="center" alignItems="center" direction="column" gap="medium">
	<h1>{m.page_home_title()}</h1>
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="row"
		gap="medium"
		height="fit-content">
		<Card title={m.page_home_card_join_title()} href="/join" icon="play_circle" />
		<Card title={m.page_home_card_manage_title()} icon="bookmark_manager" href="/manage" />
	</Flex>
</Flex>
