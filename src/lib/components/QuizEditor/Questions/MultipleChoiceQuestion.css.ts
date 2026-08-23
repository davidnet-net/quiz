import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const questionContainer = style({
	minHeight: "6rem", // Changed from fixed height to minHeight so it expands when text wraps
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

export const question = style({
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium,
	wordBreak: "break-word",
	overflowWrap: "break-word",
	width: "100%"
});

export const imageContainer = style({
	width: "50%",
	minWidth: "15rem",
	aspectRatio: "1 / 1",
	maxHeight: "25rem",
	backgroundColor: token.theme.color.surface.raised.normal,
	borderRadius: token.global.radius.huge,
	overflow: "hidden"
});

export const answerRow = style({
	display: "flex",
	width: "100%",
	justifyContent: "center",
	alignItems: "stretch", // Ensures boxes in the same row match heights if text wraps differently
	gap: token.global.spacing.medium
});

export const answerContainer = style({
	display: "flex",
	flexDirection: "column",
	width: "100%",
	gap: token.global.spacing.medium
});

export const answerBox = style({
	width: "45%",
	minHeight: "10rem", // Changed from fixed height to minHeight for multi-line support
	color: token.theme.color.text.default,
	borderRadius: token.global.radius.large,
	display: "flex",
	alignItems: "flex-start",
	padding: "1rem",
	gap: "0.75rem",
	boxSizing: "border-box",
	border: "none",
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium,
	cursor: "pointer",
	flexShrink: 0,
	transition: "all 0.2s ease"
});
