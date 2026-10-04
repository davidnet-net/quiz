import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const questionContainer = style({
	minHeight: "6rem",
	width: "95%",
	backgroundColor: token.theme.color.surface.raised.normal,
	borderRadius: token.global.radius.huge,
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
	flexDirection: "column",
	padding: "1rem",
	boxSizing: "border-box"
});

export const imageContainer = style({
	width: "50%",
	minWidth: "15rem",
	aspectRatio: "1 / 1",
	minHeight: "20rem",
	maxHeight: "25rem",
	backgroundColor: token.theme.color.surface.raised.normal,
	borderRadius: token.global.radius.huge,
	overflow: "hidden",
	justifyContent: "center",
	alignItems: "center",
	display: "flex"
});

export const settingsRow = style({
	display: "flex",
	flexDirection: "row",
	gap: token.global.spacing.medium,
	width: "95%",
	flexWrap: "wrap",
	justifyContent: "center"
});

export const listContainer = style({
	display: "flex",
	flexDirection: "column",
	width: "95%",
	maxWidth: "40rem",
	gap: token.global.spacing.small
});

export const listItemRow = style({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	gap: token.global.spacing.small,
	width: "100%",
	backgroundColor: token.theme.color.surface.raised.normal,
	borderRadius: token.global.radius.medium,
	padding: "0.75rem",
	boxSizing: "border-box"
});
