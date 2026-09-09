import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeVideo, type Video } from '../test/fixtures';
import { StatusPill } from './StatusPill';

type Pillish = Pick<Video, 'processingStatus' | 'isReleased' | 'type'>;

function pill(video: Pillish): HTMLElement {
	const { container } = render(<StatusPill video={video} />);
	return container;
}

describe('StatusPill', () => {
	it.each([
		['ready_for_upload', 'Ready for upload', 'pill-upload'],
		['ready_for_processing', 'Ready for processing', 'pill-queue'],
		['waiting_in_queue', 'Waiting in queue', 'pill-queue'],
		['processing', 'Processing', 'pill-processing'],
		['failed_in_processing', 'Failed', 'pill-failed'],
		['done', 'Done', 'pill-done'],
	] as const)('renders %s as %s (%s)', (status, label, className) => {
		const view = pill(makeVideo({ processingStatus: status, isReleased: false }));

		const node = screen.getByText(label);
		expect(node).toHaveClass('pill', className);
		expect(view.querySelector('.pill-released')).toBeNull();
	});

	it('adds the Released pill alongside the status pill once isReleased', () => {
		const view = pill(makeVideo({ processingStatus: 'done', isReleased: true }));

		expect(screen.getByText('Done')).toHaveClass('pill-done');
		expect(screen.getByText('Released')).toHaveClass('pill-released');
		expect(view.querySelectorAll('.pill')).toHaveLength(2);
	});

	it('marks live videos with the Live pill next to their status', () => {
		const view = pill(
			makeVideo({ type: 'live', processingStatus: 'done', isReleased: true }),
		);

		expect(screen.getByText('Live')).toHaveClass('pill-live');
		expect(screen.getByText('Done')).toHaveClass('pill-done');
		expect(screen.getByText('Released')).toHaveClass('pill-released');
		expect(view.querySelectorAll('.pill')).toHaveLength(3);
	});

	it('renders nothing without a status', () => {
		const view = pill(makeVideo({ processingStatus: null, isReleased: false }));

		expect(view.querySelector('.pill')).toBeNull();
	});
});
