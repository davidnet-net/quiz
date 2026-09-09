import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const container = style({
	display: "flex",
	flexDirection: "column",
	width: "100%",
	maxWidth: "1200px",
	gap: token.global.spacing.giant,
	alignItems: "center",
	boxSizing: "border-box"
});

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

export const questionText = style({
	fontSize: "2rem",
	fontWeight: token.global.font.weight.medium,
	wordBreak: "break-word",
	overflowWrap: "break-word",
	width: "100%",
	color: token.theme.color.text.primary
});

export const imageContainer = style({
	width: "50%",
	minWidth: "15rem",
	aspectRatio: "1 / 1",
	minHeight: "15rem",
	maxHeight: "20rem",
	backgroundColor: token.theme.color.surface.raised.normal,
	borderRadius: token.global.radius.huge,
	overflow: "hidden",
	justifyContent: "center",
	alignItems: "center",
	display: "flex"
});

export const answerContainer = style({
	display: "flex",
	flexDirection: "column",
	width: "95%",
	gap: token.global.spacing.medium
});

export const answerRow = style({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
	alignItems: "stretch",
	gap: token.global.spacing.medium
});

export const answerBox = style({
	width: "48%",
	minHeight: "10rem",
	borderRadius: token.global.radius.large,
	display: "flex",
	alignItems: "flex-start",
	padding: "1.5rem",
	boxSizing: "border-box",
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium,
	color: token.theme.color.text.default,
	wordBreak: "break-word",
	overflowWrap: "break-word"
});
