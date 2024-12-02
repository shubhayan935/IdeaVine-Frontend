// App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import MindMap from "./MindMap";
import { useUserInfo } from "./context/UserContext";
import MindMapHome from "./MindMapHome";
import { SidebarUpdateProvider } from "./context/SidebarUpdateContext"; // Import SidebarUpdateProvider


export default function App() {
  return (
      <SidebarUpdateProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/auth/*"
              element={
                <RequireAuthForAuth>
                  <AuthPage />
                </RequireAuthForAuth>
              }
            />
            {/* Protected Routes */}
            <Route
              path="/mindmap/:mindmap_id"
              element={
                <RequireAuthForMindMap>
                  <MindMap />
                </RequireAuthForMindMap>
              }
            />
            <Route
              path="/mindmap"
              element={
                  <MindMapHome />
              }
            />
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SidebarUpdateProvider>
  );
}

// Helper component to protect routes
function RequireAuthForMindMap({ children }: { children: JSX.Element }) {
  const { userEmail } = useUserInfo();

  if (!userEmail) {
    // Redirect to the authentication page if not authenticated
    return <Navigate to="/auth/sign-in" replace />;
  }
  return children;
}

function RequireAuthForAuth({ children }: { children: JSX.Element }) {
  const { userEmail } = useUserInfo();

  if (userEmail) {
    // Redirect to the home page if authenticated
    return <Navigate to="/" replace />;
  }
  return children;
}
