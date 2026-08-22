<script lang="ts">
	import { Flex, Skeleton } from "@davidnet-net/svelte-ui";
	import * as styles from "./MultipleChoiceQuestion.css";
</script>

<Flex direction="column" padding="medium" alignItems="center" gap="medium" style="width: 100%;">
	<Skeleton height="6rem" width="95%" />
	<Skeleton width="50%" minWidth="15rem" aspectRatio="1 / 1" maxHeight="25rem" radius="huge" />
	<Skeleton width="95%" height="20rem" />
</Flex>
