import { createBrowserRouter, type RouteObject } from 'react-router';
import { Browse } from '../routes/Browse';
import { Channel } from '../routes/Channel';
import { RouteError } from '../routes/Error';
import { NotFound } from '../routes/NotFound';
import { RequireAdmin } from '../routes/RequireAdmin';
import { RequireAuth } from '../routes/RequireAuth';
import { Ops } from '../routes/Ops';
import { PlaylistDetail } from '../routes/PlaylistDetail';
import { Playlists } from '../routes/Playlists';
import { RootLayout } from '../routes/root';
import { Search } from '../routes/Search';
import { Settings } from '../routes/Settings';
import { Watch } from '../routes/Watch';
import { WatchLayout } from '../routes/watch-layout';
import { ForgotPassword } from '../routes/auth/ForgotPassword';
import { ResetPassword } from '../routes/auth/ResetPassword';
import { SignIn } from '../routes/auth/SignIn';
import { SignUp } from '../routes/auth/SignUp';
import { GoLive } from '../routes/studio/GoLive';
import { MyVideos } from '../routes/studio/MyVideos';
import { Upload } from '../routes/studio/Upload';
import { VideoEdit } from '../routes/studio/VideoEdit';

export const routes: RouteObject[] = [
	{
		element: <RootLayout />,
		// a crash anywhere under the shell replaces the whole tree — an honest
		// full-page error with retry beats a half-rendered shell
		errorElement: <RouteError />,
		children: [
			{ path: '/', element: <Browse /> },
			{ path: 'search', element: <Search /> },
			{
				element: <RequireAuth />,
				children: [
					// the playlists library is per-channel user data (by-channel is
					// owner-only), so it lives behind the gate like studio/settings
					{ path: 'playlists', element: <Playlists /> },
					{ path: 'playlists/:id', element: <PlaylistDetail /> },
					{ path: 'settings', element: <Settings /> },
					// ops manages the whole instance: the sidenav link stays for
					// everyone, but the content is gated behind RequireAdmin
					{
						element: <RequireAdmin />,
						children: [{ path: 'ops', element: <Ops /> }],
					},
					{ path: 'studio/videos', element: <MyVideos /> },
					{ path: 'studio/upload', element: <Upload /> },
					{ path: 'studio/videos/:id/edit', element: <VideoEdit /> },
					{ path: 'studio/go-live', element: <GoLive /> },
				],
			},
			{ path: 'channel/:username', element: <Channel /> },
			{ path: 'signin', element: <SignIn /> },
			{ path: 'signup', element: <SignUp /> },
			{ path: 'forgot-password', element: <ForgotPassword /> },
			{ path: 'reset-password', element: <ResetPassword /> },
			{ path: '*', element: <NotFound /> },
		],
	},
	{
		path: 'watch/:id',
		element: <WatchLayout />,
		children: [{ index: true, element: <Watch /> }],
	},
];

export const router = createBrowserRouter(routes);
