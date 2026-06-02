import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout";
import LandingPage from "./components/LandingPage";
import Screen1 from "./components/Screen1";
import Screen2 from "./components/Screen2";
import Screen3 from "./components/Screen3";
import Screen4 from "./components/Screen4";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  {
    path: "/step",
    Component: AppLayout,
    children: [
      { path: "1", Component: Screen1 },
      { path: "2", Component: Screen2 },
      { path: "3", Component: Screen3 },
      { path: "4", Component: Screen4 },
    ],
  },
]);
