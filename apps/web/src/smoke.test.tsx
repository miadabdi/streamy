import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { renderWithApp } from './test/render';

describe('App', () => {
	it('renders the STREAMY wordmark', () => {
		renderWithApp(<App />);

		expect(screen.getByText('STREAMY')).toBeInTheDocument();
	});
});
