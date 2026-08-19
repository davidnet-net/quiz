import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const quizCard = style({
	minWidth: "22rem",
	width: "fit-content",
	height: "10rem",
	borderRadius: token.global.radius.medium,
	backgroundColor: token.theme.color.surface.raised.normal,
	padding: token.global.spacing.medium,
	display: "flex",
	justifyContent: "space-between",
	flexDirection: "column",
	borderColor: token.theme.color.border.default,
	borderWidth: token.global.borderWidth.standard,
	borderStyle: "solid"
});

export const quizName = style({
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium
});
