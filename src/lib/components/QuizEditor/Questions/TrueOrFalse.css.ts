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
	overflow: "hidden"
});

export const answerContainer = style({
	display: "flex",
	width: "100%",
	justifyContent: "center",
	alignItems: "stretch",
	gap: token.global.spacing.medium
});

export const answerBox = style({
	position: "relative",
	width: "45%",
	minHeight: "10rem",
	color: token.theme.color.text.default,
	borderRadius: token.global.radius.large,
	display: "flex",
	alignItems: "center",
	justifyContent: "center", // Centers the True/False text
	padding: "1rem",
	boxSizing: "border-box",
	fontSize: token.global.font.size.xlarge, // Larger text for True/False
	fontWeight: token.global.font.weight.bold,
	cursor: "pointer",
	flexShrink: 0,
	transition: "all 0.2s ease"
});

export const checkboxWrapper = style({
	position: "absolute",
	top: "1.25rem",
	left: "1.25rem"
});
