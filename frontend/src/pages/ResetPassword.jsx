import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./login.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (formData.newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/reset-password`, {
                token,
                newPassword: formData.newPassword,
            });
            setSuccess(res.data.message);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // If no token in the URL
    if (!token) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2>Invalid Link</h2>
                    <p className="login-subtitle">
                        This password reset link is invalid or has expired.
                    </p>
                    <div className="reset-success-container">
                        <div className="reset-success-icon">⚠️</div>
                        <p className="reset-success-hint">
                            Please request a new password reset link.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="btn-login"
                            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}
                        >
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Set New Password</h2>
                <p className="login-subtitle">
                    Enter your new password below
                </p>

                {error && <div className="login-error">{error}</div>}

                {success ? (
                    <div className="reset-success-container">
                        <div className="reset-success-icon">✅</div>
                        <div className="reset-success-message">{success}</div>
                        <p className="reset-success-hint">
                            Redirecting you to login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>
                        <Link to="/login">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
