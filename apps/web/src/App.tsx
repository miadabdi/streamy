import { useTheme } from './lib/theme';

function App() {
	// Applies the persisted theme/density to <html>; the toggle UI arrives with settings.
	useTheme();

	return <h1>STREAMY</h1>;
}

export default App;
