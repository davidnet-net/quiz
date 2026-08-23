import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const frostbar = style({
	backgroundColor: token.theme.color.surface.raised.normal,
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
