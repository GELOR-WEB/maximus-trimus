import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
import { PasswordField } from "../components/ui/Fields";

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errors = {};
    if (formData.newPassword.length < 6) {
      errors.newPassword = "Use at least 6 characters.";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "The two passwords don't match yet.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("A couple of details need another look.");
      return;
    }

    setFieldErrors({});
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
      <AuthLayout
        mode="reset"
        showTabs={false}
        eyebrow="Invalid link"
        title={
          <>
            This link has <em>expired.</em>
          </>
        }
        subtitle="Password reset links are single-use and time-limited. Request a fresh one and we'll email it right over."
        footer={
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        }
      >
        <div className="auth-success">
          <div className="auth-success__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3>Request a new link</h3>
          <p>Enter your email on the reset page and we'll send you a link that works.</p>
          <Link to="/forgot-password" className="ui-btn ui-btn--primary ui-btn--block">
            Request new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="reset"
      showTabs={false}
      eyebrow="New password"
      title={
        <>
          Choose a new <em>password.</em>
        </>
      }
      subtitle="Make it something you'll remember. Six characters is the minimum; a mix of letters and numbers is better."
      footer={
        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {error && (
        <div className="ui-alert" role="alert">
          <span className="ui-alert__icon" aria-hidden="true">
            !
          </span>
          <p>{error}</p>
        </div>
      )}

      {success ? (
        <div className="auth-success">
          <div className="auth-success__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3>Password updated</h3>
          <p>{success}</p>
          <p className="auth-sub" style={{ margin: "-6px auto 18px" }}>
            Taking you back to sign in…
          </p>
          <Link to="/login" className="ui-btn ui-btn--primary ui-btn--block">
            Sign in now
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <PasswordField
            id="newPassword"
            name="newPassword"
            label="New password"
            placeholder="At least 6 characters"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            error={fieldErrors.newPassword}
            showStrength
            required
            autoFocus
          />

          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            required
          />

          <button
            type="submit"
            className="ui-btn ui-btn--primary ui-btn--block auth-submit"
            disabled={loading}
          >
            {loading && <span className="ui-spinner" aria-hidden="true" />}
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
