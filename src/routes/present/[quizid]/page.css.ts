import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

const patternBaseColor = token.theme.color.surface.overlay.normal;
const patternStripeColor = token.theme.color.surface.overlay.hover;

export const banner = style({
	width: "90%",
	height: "20dvh",
	backgroundColor: token.theme.color.surface.overlay.normal,
	borderRadius: token.global.radius.huge,
	opacity: "1",
	backgroundImage: `repeating-radial-gradient( circle at 0 0, ${patternStripeColor} 0, ${patternStripeColor} 20px ), repeating-linear-gradient( ${patternBaseColor}, ${patternBaseColor} )`,
	position: "relative",
	overflow: "hidden",
	maxWidth: "100%",
	marginTop: token.global.spacing.giant
});

export const nickname = style({
	backgroundColor: token.theme.color.surface.overlay.normal,
	borderRadius: token.global.radius.huge,
	paddingLeft: token.global.spacing.medium,
	paddingRight: token.global.spacing.medium,
	paddingBottom: token.global.spacing.small,
	paddingTop: token.global.spacing.small,
	fontWeight: token.global.font.weight.regular,
	fontSize: "3dvh",
	display: "flex",
	alignItems: "center",
	gap: token.global.spacing.xsmall
});

export const frostbar = style({
	backgroundColor: token.theme.color.surface.raised.normal,
	padding: "0.5rem 1rem",
	justifyContent: "space-between",
	alignItems: "center",
	height: "48px",
	width: "100%",
	display: "flex",
	position: "fixed",
	bottom: 0,
	left: 0
});
