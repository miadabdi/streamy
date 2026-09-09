import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/render';
import { SecretField } from './SecretField';

const KEY = 'v_8Kd2pQxr3f91c8a2';
const writeText = vi.fn<(text: string) => Promise<void>>();

// jsdom's navigator.clipboard is getter-only, and userEvent.setup() swaps in
// its own stub — so the spy is defined per test, after setup().
function installClipboard() {
	writeText.mockReset();
	writeText.mockResolvedValue(undefined);
	Object.defineProperty(navigator, 'clipboard', {
		value: { writeText },
		configurable: true,
	});
}

function mount() {
	return renderWithApp(
		<SecretField
			id="gl-key"
			label="Stream key"
			value={KEY}
			hint="Treat it like a password. Anyone with it can broadcast to your channel."
		/>,
	);
}

describe('SecretField', () => {
	it('masks the value by default and never renders it in the DOM', () => {
		mount();

		const box = document.querySelector('.secret') as HTMLElement;
		expect(box).toHaveAttribute('data-masked', 'true');
		expect(box.querySelector('code')?.textContent).toMatch(/^•+$/);
		expect(screen.queryByText(KEY)).toBeNull();
	});

	it('reveals the value on toggle and masks it again on hide', async () => {
		const user = userEvent.setup();
		mount();

		await user.click(screen.getByRole('button', { name: 'Reveal' }));

		expect(document.querySelector('.secret')).toHaveAttribute('data-masked', 'false');
		expect(screen.getByText(KEY)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Hide' }));

		expect(document.querySelector('.secret')).toHaveAttribute('data-masked', 'true');
		expect(screen.queryByText(KEY)).toBeNull();
	});

	it('copies the real value even while masked', async () => {
		const user = userEvent.setup();
		installClipboard();
		mount();

		await user.click(screen.getByRole('button', { name: 'Copy' }));

		expect(writeText).toHaveBeenCalledWith(KEY);
		expect(screen.queryByText(KEY)).toBeNull(); // still never shown
	});

	it('shows the password hint under the field', () => {
		mount();

		expect(screen.getByText(/Treat it like a password/)).toBeInTheDocument();
	});
});
