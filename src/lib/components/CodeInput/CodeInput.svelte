<script lang="ts">
	import { styles } from "./CodeInput.css";

	interface Props {
		value?: string;
		invalid?: boolean;
		valid?: boolean;
		disabled?: boolean;
		onsubmit?: (code: string) => void;
	}

	let {
		value = $bindable(""),
		invalid = false,
		valid = false,
		disabled = false,
		onsubmit
	}: Props = $props();

	// Store array of 6 digit strings
	let digits = $state(Array(6).fill(""));
	let inputRefs: HTMLInputElement[] = $state([]);

	// Keep internal digits synced with external `value` prop
	$effect(() => {
		const cleanVal = value.replace(/\D/g, "").slice(0, 6);
		const newDigits = Array(6).fill("");
		for (let i = 0; i < cleanVal.length; i++) {
			newDigits[i] = cleanVal[i];
		}
		digits = newDigits;
	});

	// Determine current outline variant
	let currentVariant = $derived.by(() => {
		if (invalid) return styles.statusVariants.invalid;
		if (valid) return styles.statusVariants.valid;
		return styles.statusVariants.normal;
	});

	function updateValueAndCheckSubmit(newDigits: string[]) {
		digits = newDigits;
		value = newDigits.join("");

		if (value.length === 6 && onsubmit) {
			onsubmit(value);
		}
	}

	function handleInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const val = input.value.replace(/\D/g, ""); // Allow numbers only

		if (!val) {
			const next = [...digits];
			next[index] = "";
			updateValueAndCheckSubmit(next);
			return;
		}

		// Handle single digit input
		const char = val.slice(-1);
		const next = [...digits];
		next[index] = char;
		updateValueAndCheckSubmit(next);

		// Auto-advance focus to next field
		if (index < 5) {
			inputRefs[index + 1]?.focus();
		}
	}

	function handleKeyDown(index: number, e: KeyboardEvent) {
		// Block non-numeric key presses (except control keys)
		if (
			!/^\d$/.test(e.key) &&
			!["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key) &&
			!e.ctrlKey &&
			!e.metaKey
		) {
			e.preventDefault();
			return;
		}

		if (e.key === "Backspace") {
			if (!digits[index] && index > 0) {
				// Focus previous slot on backspace if current is empty
				inputRefs[index - 1]?.focus();
			}
		} else if (e.key === "ArrowLeft" && index > 0) {
			inputRefs[index - 1]?.focus();
		} else if (e.key === "ArrowRight" && index < 5) {
			inputRefs[index + 1]?.focus();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pastedData = e.clipboardData?.getData("text") || "";
		const numericData = pastedData.replace(/\D/g, "").slice(0, 6);

		if (!numericData) return;

		const next = Array(6).fill("");
		for (let i = 0; i < numericData.length; i++) {
			next[i] = numericData[i];
		}

		updateValueAndCheckSubmit(next);

		// Focus the input matching current length or the last input
		const targetIndex = Math.min(numericData.length, 5);
		inputRefs[targetIndex]?.focus();
	}
</script>

<div class={styles.container}>
	{#each Array(6) as _, index}
		<input
			bind:this={inputRefs[index]}
			type="text"
			inputmode="numeric"
			pattern="[0-9]*"
			maxlength={1}
			value={digits[index]}
			class={`${styles.digitBox} ${currentVariant}`}
			{disabled}
			oninput={(e) => handleInput(index, e)}
			onkeydown={(e) => handleKeyDown(index, e)}
			onpaste={handlePaste}
			onfocus={(e) => (e.target as HTMLInputElement).select()} />
	{/each}
</div>
