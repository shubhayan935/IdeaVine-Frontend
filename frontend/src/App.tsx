'use client'

import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import LandingPage from './LandingPage'
import MindMap from './MindMap'
import AuthPage from './AuthPage'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    // Implement your login logic here
    setIsAuthenticated(true)
  }

  const handleSignup = () => {
    // Implement your signup logic here
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    // Implement your logout logic here
    setIsAuthenticated(false)
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/auth" 
          element={
            <AuthPage 
              onLogin={handleLogin} 
              onSignup={handleSignup} 
            />
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
  )
}