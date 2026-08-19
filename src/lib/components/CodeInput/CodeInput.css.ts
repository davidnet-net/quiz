import { token } from "@davidnet-net/svelte-ui/tokens";
import { style, styleVariants } from "@vanilla-extract/css";

const container = style({
	display: "flex",
	gap: token.global.spacing.small,
	alignItems: "center",
	justifyContent: "center",
	width: "50%"
});

const digitBox = style({
	width: "2.5rem",
	height: "2.5rem",
	textAlign: "center",
	fontSize: token.global.font.size.large,
	fontWeight: "600",
	fontFamily: token.global.font.family.sans,
	color: token.theme.color.text.default,
	backgroundColor: token.theme.color.surface.sunken.normal,
	borderRadius: token.global.radius.medium,
	border: "none",
	outline: `${token.global.borderWidth.thick} solid ${token.theme.color.border.default}`,
	transition: "outline-color 0.15s ease, border-color 0.15s ease",
	":focus": {
		outline: `${token.global.borderWidth.thick} solid ${token.theme.color.border.focus || token.theme.color.text.default}`
	},
	":disabled": {
		cursor: "not-allowed",
		opacity: 0.6
	}
});

const statusVariants = styleVariants({
	normal: {},
	valid: {
		outline: `${token.global.borderWidth.thick} solid ${token.theme.color.text.success || "#22c55e"}`
	},
	invalid: {
		outline: `${token.global.borderWidth.thick} solid ${token.theme.color.text.danger}`
	}
});

export const styles = {
	container,
	digitBox,
	statusVariants
};
