<script lang="ts">
	import { Flex, Icon, LinkButton } from "@davidnet-net/svelte-ui";
	import type { PageProps } from "../../$types";
	import * as m from "$lib/paraglide/messages.js";

	let { params }: PageProps = $props();
</script>

<Flex justifyContent="center" alignItems="center" direction="column" gap="medium">
	<Icon icon="lock" size="giant" color="danger" />
	<h1>{m.page_no_access_heading()}</h1>
	<LinkButton href={"/manage/" + params.quizid + "/edit"} appearance="primary"
		>{m.page_no_access_retry()}</LinkButton>
	<LinkButton href={"/"}>{m.common_home()}</LinkButton>
</Flex>
