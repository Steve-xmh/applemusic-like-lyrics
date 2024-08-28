import { createBrowserRouter } from "react-router-dom";
import { MainPage } from "./pages/main";
import { PlaylistPage } from "./pages/playlist";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <MainPage />,
	},
	{
		path: "/playlist/:id",
		element: <PlaylistPage />,
	},
]);
