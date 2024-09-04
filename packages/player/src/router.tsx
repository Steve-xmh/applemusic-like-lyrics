import { createBrowserRouter } from "react-router-dom";
import { MainPage } from "./pages/main";
import { PlaylistPage } from "./pages/playlist";
import { SettingsPage } from "./pages/settings";
import { SongPage } from "./pages/song";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <MainPage />,
	},
	{
		path: "/settings",
		element: <SettingsPage />,
	},
	{
		path: "/playlist/:id",
		element: <PlaylistPage />,
	},
	{
		path: "/song/:id",
		element: <SongPage />,
	},
]);
