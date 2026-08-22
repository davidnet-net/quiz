import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const frostbar = style({
	background: "rgba(130, 130, 130, 0.1)",
	backdropFilter: "blur(16px)",
	WebkitBackdropFilter: "blur(16px)",
	padding: "0.5rem 0.5rem",
	justifyContent: "space-between",
	alignItems: "center",
	height: "48px",
	width: "100%",
	display: "flex"
});

export const title = style({
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium
});

export const questionContainer = style({
	height: "6rem",
	width: "95%",
	backgroundColor: token.theme.color.surface.raised.normal,
	borderRadius: token.global.radius.huge,
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
	flexDirection: "column"
});

export const question = style({
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium
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
	alignItems: "center",
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
	height: "10rem",
	color: token.theme.color.text.default,
	borderRadius: token.global.radius.large,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	border: "none",
	fontSize: token.global.font.size.large,
	fontWeight: token.global.font.weight.medium,
	cursor: "pointer",
	flexShrink: 0,
	transition: "all 0.2s ease"
});
