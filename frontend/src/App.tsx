import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import MindMap from "./MindMap";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    // Implement your login logic here
    setIsAuthenticated(true);
  };

  const handleSignup = () => {
    // Implement your signup logic here
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Implement your logout logic here
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={
            <>
              <header>
                <SignedOut>
                  <SignInButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </header>
              <AuthPage onLogin={handleLogin} onSignup={handleSignup} />
            </>
          }
        />
        <Route
          path="/mindmap"
          element={
            isAuthenticated ? (
              <MindMap onLogout={handleLogout} />
            ) : (
              <MindMap onLogout={handleLogout} />
            )
          }
        />
      </Routes>
    </Router>
  );
}
