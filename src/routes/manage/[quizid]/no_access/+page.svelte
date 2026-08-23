<script lang="ts">
	import { Flex, Icon, LinkButton } from "@davidnet-net/svelte-ui";
	import type { PageProps } from "../../$types";

	let { params }: PageProps = $props();
</script>

<Flex justifyContent="center" alignItems="center" direction="column" gap="medium">
	<Icon icon="lock" size="giant" color="danger" />
	<h1>You do not have access to this quiz!</h1>
	<LinkButton href={"/manage/" + params.quizid + "/edit"} appearance="primary">Retry</LinkButton>
	<LinkButton href={"/"}>Home</LinkButton>
</Flex>
