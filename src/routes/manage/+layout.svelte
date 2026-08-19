<script lang="ts">
	import { token } from "@davidnet-net/svelte-ui/tokens";

	let { children } = $props();
</script>

<div style="padding: {token.global.spacing.giant}">
	{@render children()}
</div>
