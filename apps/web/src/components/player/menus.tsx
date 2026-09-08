import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { RefObject } from 'react';
import { QualityIcon, SubtitleIcon } from '../icons';

// Nocturne menu markup (Nocturne/templates/watch/Watch.dc.html): .menu >
// .menu-head + .menu-item buttons with role=menuitemradio and a .k detail.
// Radix supplies the interaction machinery (open/close, arrows, typeahead);
// `asChild` keeps the trigger a .player-btn and the content a .menu.

export type QualityLevel = { height: number; bitrate: number };

function formatBitrate(bitsPerSecond: number): string {
	return `${(bitsPerSecond / 1_000_000).toFixed(1)} Mb/s`;
}

export function QualityMenu({
	levels,
	locked,
	activeHeight,
	open,
	onOpenChange,
	onSelect,
	triggerRef,
}: {
	/** hls.levels; -1 (Auto) locks to the level hls.js is currently playing. */
	levels: QualityLevel[];
	locked: number;
	activeHeight?: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (level: number) => void;
	triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
	return (
		<DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
			<DropdownMenu.Trigger asChild>
				<button className="player-btn" type="button" aria-label="Quality" ref={triggerRef}>
					<QualityIcon width={16} height={16} />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content asChild align="end" side="top" sideOffset={8}>
					<div className="menu">
						<div className="menu-head">Quality</div>
						<DropdownMenu.RadioGroup value={String(locked)} onValueChange={(v) => onSelect(Number(v))}>
							<DropdownMenu.RadioItem asChild value="-1">
								<button className="menu-item" type="button">
									Auto
									{activeHeight !== undefined && <span className="k">{activeHeight}p</span>}
								</button>
							</DropdownMenu.RadioItem>
							{levels.map((level, index) => (
								<DropdownMenu.RadioItem asChild key={index} value={String(index)}>
									<button className="menu-item" type="button">
										{level.height}p
										<span className="k">{formatBitrate(level.bitrate)}</span>
									</button>
								</DropdownMenu.RadioItem>
							))}
						</DropdownMenu.RadioGroup>
					</div>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}

export type SubtitleOption = {
	/** Stable key for the radio group ("api:1", "hls:2"). */
	key: string;
	label: string;
	lang: string;
	/** Index into hls.subtitleTracks, or null for API-only tracks (native <track>). */
	hlsIndex: number | null;
};

export function SubtitleMenu({
	options,
	selected,
	open,
	onOpenChange,
	onSelect,
}: {
	options: SubtitleOption[];
	/** Selected option key, or null for Off. */
	selected: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (option: SubtitleOption | null) => void;
}) {
	return (
		<DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
			<DropdownMenu.Trigger asChild>
				<button className="player-btn" type="button" aria-label="Subtitles">
					<SubtitleIcon width={16} height={16} />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content asChild align="end" side="top" sideOffset={8}>
					<div className="menu">
						<div className="menu-head">Subtitles</div>
						<DropdownMenu.RadioGroup value={selected ?? 'off'} onValueChange={(value) => onSelect(options.find((o) => o.key === value) ?? null)}>
							<DropdownMenu.RadioItem asChild value="off">
								<button className="menu-item" type="button">
									Off
								</button>
							</DropdownMenu.RadioItem>
							{options.map((option) => (
								<DropdownMenu.RadioItem asChild key={option.key} value={option.key}>
									<button className="menu-item" type="button">
										{option.label}
										<span className="k">{option.lang}</span>
									</button>
								</DropdownMenu.RadioItem>
							))}
						</DropdownMenu.RadioGroup>
					</div>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
