<script lang="ts">
	import { Button, Divider, Dropdown, Flex, Icon, IconButton } from "@davidnet-net/svelte-ui";
	import * as styles from "./Sidebar.css.ts";

	let {
		questionSidebarOpened = true,
		openDropdown = null,
		onToggle,
		onDropdownToggle
	}: {
		questionSidebarOpened: boolean;
		openDropdown: string | null;
		onToggle: () => void;
		onDropdownToggle: (name: string | null) => void;
	} = $props();
</script>

{#if !questionSidebarOpened}
	<div class={styles.compactSidebar}>
		<Flex direction="column" gap="small" alignItems="center">
			<Dropdown isOpen={openDropdown === "compact-time-limit"}>
				{#snippet trigger()}
					<IconButton
						icon="schedule"
						appearance="default"
						tip="Time limit"
						onclick={() =>
							onDropdownToggle(
								openDropdown === "compact-time-limit" ? null : "compact-time-limit"
							)} />
				{/snippet}
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					10 seconds
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					30 seconds
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					60 seconds
				</Button>
			</Dropdown>

			<Dropdown isOpen={openDropdown === "compact-points"}>
				{#snippet trigger()}
					<IconButton
						icon="workspace_premium"
						appearance="default"
						tip="Points"
						onclick={() =>
							onDropdownToggle(openDropdown === "compact-points" ? null : "compact-points")} />
				{/snippet}
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Standard
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Double points
				</Button>
			</Dropdown>

			<Dropdown isOpen={openDropdown === "compact-answer-options"}>
				{#snippet trigger()}
					<IconButton
						icon="view_cozy"
						appearance="default"
						tip="Answer options"
						onclick={() =>
							onDropdownToggle(
								openDropdown === "compact-answer-options" ? null : "compact-answer-options"
							)} />
				{/snippet}
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Single select
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Multi select
				</Button>
			</Dropdown>
			<br />
			<br />
			<IconButton
				icon="control_point_duplicate"
				appearance="default"
				tip="Duplicate"
				onclick={() => {}} />
			<IconButton
				icon="delete_forever"
				appearance="default"
				tip="Delete question"
				onclick={() => {}} />
		</Flex>
		<IconButton icon="right_panel_open" tip="Open sidebar" onclick={onToggle} />
	</div>
{:else}
	<div class={styles.sidebar}>
		<Flex direction="column" gap="small" alignItems="start" style="width: 100%;">
			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="schedule" />
				<span>Time limit</span>
			</Flex>
			<Dropdown isOpen={openDropdown === "time-limit"} stretchWidthTrigger>
				{#snippet trigger()}
					<Button
						alignContent="left"
						stretchwidth
						appearance="default"
						onclick={() => onDropdownToggle(openDropdown === "time-limit" ? null : "time-limit")}>
						30 seconds
					</Button>
				{/snippet}
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					10 seconds
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					30 seconds
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					60 seconds
				</Button>
			</Dropdown>

			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="workspace_premium" />
				<span>Points</span>
			</Flex>
			<Dropdown isOpen={openDropdown === "points"} stretchWidthTrigger>
				{#snippet trigger()}
					<Button
						alignContent="left"
						stretchwidth
						appearance="default"
						onclick={() => onDropdownToggle(openDropdown === "points" ? null : "points")}>
						Normal
					</Button>
				{/snippet}
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Standard
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Double points
				</Button>
			</Dropdown>

			<Flex width="fit-content" height="fit-content" gap="xsmall" alignItems="center">
				<Icon icon="view_cozy" />
				<span>Answer options</span>
			</Flex>
			<Dropdown isOpen={openDropdown === "answer-options"} stretchWidthTrigger>
				{#snippet trigger()}
					<Button
						alignContent="left"
						stretchwidth
						appearance="default"
						onclick={() =>
							onDropdownToggle(openDropdown === "answer-options" ? null : "answer-options")}>
						Single select
					</Button>
				{/snippet}
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Single select
				</Button>
				<Button appearance="subtle" alignContent="left" onclick={() => onDropdownToggle(null)}>
					Multi select
				</Button>
			</Dropdown>

			<br />
			<Divider color="tertiary" />
			<br />
			<Button alignContent="left" stretchwidth appearance="default" onclick={() => {}}>
				Duplicate
			</Button>
			<Button alignContent="left" stretchwidth appearance="default" onclick={() => {}}>
				Delete question
			</Button>
		</Flex>
		<div>
			<IconButton icon="right_panel_close" tip="Close sidebar" onclick={onToggle} />
		</div>
	</div>
{/if}
