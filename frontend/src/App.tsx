import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, useUser, UserButton } from "@clerk/clerk-react";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import MindMap from "./MindMap";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route
          path="/mindmap"
          element={
            <RequireAuth>
              <MindMap />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

// Helper component to protect routes
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    // Redirect to the authentication page
    return <Navigate to="/auth/sign-in" replace />;
  }
  return children;
}
