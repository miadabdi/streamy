/**
 * Player keymap (Nocturne readme: the player must be fully operable from the
 * keyboard). The player surface is its focusable root; every command also
 * updates the visually-hidden live region (see VideoPlayer).
 *
 *   space / k  play–pause          ← / →  seek ∓5s
 *   j / l      seek ∓10s           ↑ / ↓  volume ±10%
 *   m          mute                f      fullscreen
 *   c          captions toggle     q      quality menu
 *   0–9        seek to n/10 of duration
 */

export type PlayerCommands = {
	togglePlay: () => void;
	seekBy: (delta: number) => void;
	seekToRatio: (ratio: number) => void;
	nudgeVolume: (delta: number) => void;
	toggleMute: () => void;
	toggleFullscreen: () => void;
	toggleCaptions: () => void;
	openQualityMenu: () => void;
};

/** Keys typed into a form control (or aimed at a focused control button) are not player commands. */
export function shouldHandleKey(event: KeyboardEvent): boolean {
	const el = event.target as HTMLElement | null;
	if (!el) return false;
	if (el.isContentEditable) return false;
	if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
	// space/enter activate the focused control button — let the control own them
	const interactive = el.closest('button, a, [role="menuitem"], [role="menuitemradio"]');
	if (interactive && (event.key === ' ' || event.key === 'Enter')) return false;
	return true;
}

/** Runs the keymap; returns whether the key was a player command (and was default-prevented). */
export function handlePlayerKey(event: KeyboardEvent, cmds: PlayerCommands): boolean {
	if (!shouldHandleKey(event)) return false;
	const digit = /^[0-9]$/.test(event.key) ? Number(event.key) : null;

	switch (event.key) {
		case ' ':
		case 'k':
			cmds.togglePlay();
			break;
		case 'ArrowLeft':
			cmds.seekBy(-5);
			break;
		case 'ArrowRight':
			cmds.seekBy(5);
			break;
		case 'j':
			cmds.seekBy(-10);
			break;
		case 'l':
			cmds.seekBy(10);
			break;
		case 'ArrowUp':
			cmds.nudgeVolume(0.1);
			break;
		case 'ArrowDown':
			cmds.nudgeVolume(-0.1);
			break;
		case 'm':
			cmds.toggleMute();
			break;
		case 'f':
			cmds.toggleFullscreen();
			break;
		case 'c':
			cmds.toggleCaptions();
			break;
		case 'q':
			cmds.openQualityMenu();
			break;
		default:
			if (digit !== null) cmds.seekToRatio(digit / 10);
			else return false;
	}
	event.preventDefault();
	return true;
}
