// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import MindMap from "./MindMap";
import { useUserInfo } from './context/UserContext';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route
          path="/mindmap" // Dynamic route for individual mindmaps
          element={
            <RequireAuth>
              <MindMap />
            </RequireAuth>
          }
        />
        {/* Redirect any unknown routes to home */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </Router>
  );
}

// Helper component to protect routes
function RequireAuth({ children }: { children: JSX.Element }) {
  const { userEmail } = useUserInfo();

  if (!userEmail) {
    // Redirect to the authentication page if not authenticated
    return <Navigate to="/auth/sign-in" replace />;
  }
  return children;
}
