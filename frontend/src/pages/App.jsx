import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";

// Import Page Components
import MainPage from "./mainPage";
import Admin from "./admin";
import Login from "./login"; // Admin login
import ClientLogin from "./ClientLogin"; // Client login
import Register from "./Register";
import Profile from "./Profile";
import ProtectedRoute from "../components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <main className="container">
          <Routes>
            {/* CLIENT-FACING ROUTES */}
            <Route
              path="/"
              element={<MainPage />}
            />
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<h1>404: Page Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
