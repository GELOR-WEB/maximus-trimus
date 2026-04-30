import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./login.css";

const ClientLogin = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(formData.email, formData.password);

        setLoading(false);

        if (result.success) {
            navigate("/"); // Redirect to home page
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Client Login</h2>
                <p className="login-subtitle">Welcome back to Maximus Trimus</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
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

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account? <Link to="/register">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
