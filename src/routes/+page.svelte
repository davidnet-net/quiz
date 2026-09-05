<script lang="ts">
	import { appState, Flex } from "@davidnet-net/svelte-ui";
	import Card from "$lib/components/Card/Card.svelte";

	$effect(() => {
		(async () => {
			appState.hideNavigation = false;
		})();
	});
</script>

<Flex justifyContent="center" alignItems="center" direction="column" gap="medium">
	<h1>Davidnet Quizes</h1>
	<Flex
		justifyContent="center"
		alignItems="center"
		direction="row"
		gap="medium"
		height="fit-content">
		<Card title="Join quiz" href="/join" icon="play_circle" />
		<Card title="Manage quizes" icon="bookmark_manager" href="/manage" />
	</Flex>
</Flex>
