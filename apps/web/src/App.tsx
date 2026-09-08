import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './lib/router';
import { useTheme } from './lib/theme';

function App() {
	// Applies the persisted theme/density to <html>; the toggle UI arrives with settings.
	useTheme();

	return (
		<>
			<RouterProvider router={router} />
			<Toaster />
		</>
	);
}

export default App;
