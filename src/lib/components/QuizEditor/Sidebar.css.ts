import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const compactSidebar = style({
	width: "48px",
	height: "100%",
	backgroundColor: token.theme.color.surface.raised.normal,
	boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
	padding: "0.4rem 0.3rem",
	justifyContent: "center",
	alignItems: "space-around",
	flexDirection: "column",
	display: "flex"
});

export const sidebar = style({
	width: "15rem",
	height: "100%",
	backgroundColor: token.theme.color.surface.raised.normal,
	boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
	padding: "0.5rem 0.5rem",
	justifyContent: "start",
	alignItems: "space-around",
	flexDirection: "column",
	display: "flex"
});

export const questionCardItem = style({
	width: "100%",
	backgroundColor: token.theme.color.surface.raised.hover,
	border: "1px solid rgba(255, 255, 255, 0.08)",
	borderRadius: token.global.radius.large,
	padding: token.global.spacing.small,
	display: "flex",
	flexDirection: "column",
	gap: "0.25rem",
	cursor: "pointer",
	textAlign: "left",
	transition: "all 0.2s ease",
	selectors: {
		"&:hover": {
			borderColor: "rgba(255, 255, 255, 0.2)"
		}
	}
});

export const questionCardTitle = style({
	fontSize: token.global.font.size.small,
	fontWeight: token.global.font.weight.bold,
	color: token.theme.color.text.default,
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis"
});

export const questionCardText = style({
	fontSize: token.global.font.size.small,
	color: token.theme.color.text.secondary,
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis"
});
