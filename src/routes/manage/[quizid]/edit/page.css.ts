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
