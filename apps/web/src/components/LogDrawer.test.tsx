import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeVideoListItem, type VideoListItem } from '../test/fixtures';
import { LogDrawer } from './LogDrawer';

// Raw worker stderr (video-process.service.ts accumulates ffmpeg's stderr
// verbatim) — no levels, so highlighting classifies line shapes, never edits.
const RAW_LOG = [
	'frame= 1428 fps= 61 q=28.0 size=   14336kB time=00:00:59.52 bitrate=1972.4kbits/s',
	"[hls @ 0x55f1c2] Opening 'v_8Kd2pQxr/720p_0012.ts' for writing",
	'[libx264 @ 0x55f1e8] invalid width x height (-2x720)',
	'Error while filtering: Invalid argument',
	'Conversion failed!',
].join('\n');

function mount(overrides: Partial<VideoListItem> = {}) {
	return render(
		<LogDrawer
			video={makeVideoListItem({
				id: 5,
				name: 'Overnight queue, second attempt',
				videoId: 'v_8Kd2pQxr',
				processingStatus: 'failed_in_processing',
				ffmpegProcessLogs: RAW_LOG,
				...overrides,
			})}
			onClose={() => {}}
		/>,
	);
}

describe('LogDrawer', () => {
	it('titles the drawer with the video and shows the log verbatim', () => {
		const { container } = mount();

		expect(screen.getByText('ffmpeg log — Overnight queue, second attempt')).toBeInTheDocument();
		expect(screen.getByText(/v_8Kd2pQxr · failed_in_processing/)).toBeInTheDocument();
		const log = container.querySelector('.log');
		expect(log?.textContent).toContain('bitrate=1972.4kbits/s');
		expect(log?.textContent).toContain("Opening 'v_8Kd2pQxr/720p_0012.ts' for writing");
	});

	it('highlights error lines red and chatter dim, without editing the text', () => {
		const { container } = mount();
		const log = container.querySelector('.log') as HTMLElement;

		const err = screen.getByText('[libx264 @ 0x55f1e8] invalid width x height (-2x720)');
		expect(err).toHaveClass('err');
		expect(screen.getByText('Error while filtering: Invalid argument')).toHaveClass('err');
		expect(
			screen.getByText("[hls @ 0x55f1c2] Opening 'v_8Kd2pQxr/720p_0012.ts' for writing"),
		).toHaveClass('dim');
		expect(screen.getByText('Conversion failed!')).toHaveClass('dim');
		// progress lines stay unstyled
		expect(
			screen.getByText(/frame= 1428 fps= 61/).closest('span')?.className ?? '',
		).toBe('');
		// every byte of the raw log is present, unedited
		expect(log.textContent?.replace(/\n$/, '')).toBe(RAW_LOG);
	});

	it('closes via the Close button', async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<LogDrawer
				video={makeVideoListItem({ ffmpegProcessLogs: 'boom' })}
				onClose={onClose}
			/>,
		);

		await user.click(screen.getByRole('button', { name: 'Close' }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('says so when the failed video never produced worker output', () => {
		const { container } = mount({ ffmpegProcessLogs: null });

		expect(container.querySelector('.log .dim')?.textContent).toMatch(/no worker output/i);
	});
});
