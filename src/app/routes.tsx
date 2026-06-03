import { createBrowserRouter } from "react-router";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import CourseSequenceIntroPage from "./pages/CourseSequenceIntroPage";
import SequenceQuestionnairePage from "./pages/SequenceQuestionnairePage";
import AiPracticeMemoPage from "./pages/AiPracticeMemoPage";
import FinalKitPage from "./pages/FinalKitPage";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  {
    path: "/step",
    Component: AppLayout,
    children: [
      { path: "1", Component: CourseSequenceIntroPage },
      { path: "2", Component: SequenceQuestionnairePage },
      { path: "3", Component: AiPracticeMemoPage },
      { path: "4", Component: FinalKitPage },
    ],
  },
]);