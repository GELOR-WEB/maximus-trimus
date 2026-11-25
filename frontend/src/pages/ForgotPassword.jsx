import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
import { TextField } from "../components/ui/Fields";

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
    <AuthLayout
      mode="forgot"
      showTabs={false}
      eyebrow="Account recovery"
      title={
        <>
          Reset your <em>password.</em>
        </>
      }
      subtitle="Tell us the email on your account and we'll send a secure link to set a new one."
      footer={
        <p>
          Remembered it? <Link to="/login">Back to sign in</Link>.
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <polyline points="3 7 12 13 21 7" />
            </svg>
          </div>
          <h3>Check your inbox</h3>
          <p>{success}</p>
          <p className="auth-sub" style={{ margin: "-6px auto 18px" }}>
            The link expires in 15 minutes. If it isn't there, look in spam — or
            send yourself another.
          </p>
          <Link to="/login" className="ui-btn ui-btn--primary ui-btn--block">
            Back to sign in
          </Link>
          <button
            type="button"
            className="ui-btn ui-btn--text"
            style={{ marginTop: 12 }}
            onClick={() => setSuccess("")}
          >
            Send another link
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            id="reset-email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            autoComplete="email"
            required
            autoFocus
          />

          <button
            type="submit"
            className="ui-btn ui-btn--primary ui-btn--block auth-submit"
            disabled={loading}
          >
            {loading && <span className="ui-spinner" aria-hidden="true" />}
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
