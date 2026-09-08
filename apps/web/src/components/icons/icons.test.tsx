import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from '../Wordmark';
import {
	ChannelIcon,
	CopyIcon,
	ElapsedIcon,
	EncoderIcon,
	FailedIcon,
	LiveIcon,
	LikeIcon,
	OkIcon,
	PlayIcon,
	ProcessingIcon,
	QualityIcon,
	QueueIcon,
	ReleaseIcon,
	StorageIcon,
	StreamKeyIcon,
	SubtitleIcon,
	TagIcon,
	UploadIcon,
	ViewsIcon,
	VodIcon,
} from '.';

const icons = [
	PlayIcon,
	LiveIcon,
	VodIcon,
	UploadIcon,
	ReleaseIcon,
	QueueIcon,
	ProcessingIcon,
	EncoderIcon,
	StorageIcon,
	StreamKeyIcon,
	ElapsedIcon,
	SubtitleIcon,
	QualityIcon,
	TagIcon,
	ChannelIcon,
	ViewsIcon,
	LikeIcon,
	CopyIcon,
	OkIcon,
	FailedIcon,
];

describe('domain icons', () => {
	it.each(icons)('renders an svg that accepts className %#', (Icon) => {
		const { container } = render(<Icon className="test-icon" />);
		const svg = container.querySelector('svg');

		expect(svg).toBeInTheDocument();
		expect(svg).toHaveClass('test-icon');
	});
});

describe('Wordmark', () => {
	it('renders STREAMY with the wordmark class', () => {
		render(<Wordmark />);

		const el = screen.getByText('STREAMY');
		expect(el).toBeInTheDocument();
		expect(el).toHaveClass('wordmark');
	});
});
