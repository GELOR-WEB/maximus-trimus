import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import { useNavigate } from "react-router-dom";
import "./login.css"; // We will create this next

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      // 1. Send credentials to the backend
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        formData
      );

      // 2. If successful, save the token to LocalStorage (The "Key")
      localStorage.setItem("token", res.data.token);

      // 3. Redirect to the Dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      // 4. Handle errors (Wrong password, etc.)
      const msg =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Login failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Access</h2>
        <p className="login-subtitle">Maximus Trimus Command Center</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn-login">
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;