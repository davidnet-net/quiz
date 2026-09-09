import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const container = style({
	display: "grid",
	gridTemplateColumns: "1fr 1fr",
	gridTemplateRows: "1fr 1fr",
	width: "100%",
	height: "90%",
	gap: token.global.spacing.medium,
	boxSizing: "border-box",
	padding: token.global.spacing.giant
});

export const colorBlock = style({
	width: "95%",
	height: "95%",
	minHeight: "20vh",
	borderRadius: token.global.radius.large,
	cursor: "pointer",
	border: "none",
	boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
	transition: "transform 0.1s ease, filter 0.1s ease",
	":active": {
		transform: "scale(0.97)",
		filter: "brightness(0.85)"
	}
});
