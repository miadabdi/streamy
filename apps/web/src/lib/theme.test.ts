import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from './theme';

describe('useTheme', () => {
	beforeEach(() => {
		localStorage.clear();
		delete document.documentElement.dataset.theme;
		delete document.documentElement.dataset.density;
	});

	it('defaults to dark theme and compact density', () => {
		const { result } = renderHook(() => useTheme());

		expect(result.current.theme).toBe('dark');
		expect(result.current.density).toBe('compact');
	});

	it('setTheme(light) sets data-theme on <html> and persists to localStorage', () => {
		const { result } = renderHook(() => useTheme());

		act(() => result.current.setTheme('light'));

		expect(document.documentElement.dataset.theme).toBe('light');
		expect(localStorage.getItem('streamy.theme')).toBe('light');
	});

	it('re-reads a persisted theme on the next mount', () => {
		localStorage.setItem('streamy.theme', 'light');

		const { result } = renderHook(() => useTheme());

		expect(result.current.theme).toBe('light');
		expect(document.documentElement.dataset.theme).toBe('light');
	});

	it('setDensity(roomy) sets data-density on <html> and persists to localStorage', () => {
		const { result } = renderHook(() => useTheme());

		act(() => result.current.setDensity('roomy'));

		expect(document.documentElement.dataset.density).toBe('roomy');
		expect(localStorage.getItem('streamy.density')).toBe('roomy');
	});

	it('re-reads a persisted density on the next mount', () => {
		localStorage.setItem('streamy.density', 'roomy');

		const { result } = renderHook(() => useTheme());

		expect(result.current.density).toBe('roomy');
		expect(document.documentElement.dataset.density).toBe('roomy');
	});
});
