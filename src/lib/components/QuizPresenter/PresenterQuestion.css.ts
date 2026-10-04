import { token } from "@davidnet-net/svelte-ui/tokens";
import { keyframes, style } from "@vanilla-extract/css";

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

export const mediaImage = style({
	width: "100%",
	height: "100%",
	objectFit: "cover"
});

const fadeIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 }
});

const slideUp = keyframes({
	from: { transform: "translateY(100%)", opacity: 0 },
	to: { transform: "translateY(0)", opacity: 1 }
});

const blurIn = keyframes({
	from: { filter: "blur(2rem)" },
	to: { filter: "blur(0)" }
});

export const revealFade = style({
	animation: `${fadeIn} 600ms ease`
});

export const revealSlide = style({
	animation: `${slideUp} 500ms ease`
});

export const revealBlur = style({
	animation: `${blurIn} 900ms ease`
});

export const videoContainer = style({
	width: "95%",
	maxWidth: "48rem"
});

export const unmuteOverlay = style({
	position: "absolute",
	bottom: token.global.spacing.medium,
	right: token.global.spacing.medium,
	zIndex: 1
});

export const videoWrapper = style({
	position: "relative",
	width: "100%"
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
