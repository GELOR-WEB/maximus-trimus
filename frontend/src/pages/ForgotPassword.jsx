import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./login.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setSuccess(res.data.message);
            setEmail(""); // Clear the field after success
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Reset Password</h2>
                <p className="login-subtitle">
                    Enter your email and we'll send you a link to reset your password
                </p>

                {error && <div className="login-error">{error}</div>}

                {success ? (
                    <div className="reset-success-container">
                        <div className="reset-success-icon">✉️</div>
                        <div className="reset-success-message">{success}</div>
                        <p className="reset-success-hint">
                            Check your inbox (and spam folder) for the reset link.
                            The link expires in 15 minutes.
                        </p>
                        <Link to="/login" className="btn-login" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-email">Email Address</label>
                            <input
                                type="email"
                                id="reset-email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>
                        Remember your password? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
