import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { PasswordField, TextField } from "../components/ui/Fields";

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
    if (error) setError("");
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
    <AuthLayout
      mode="login"
      eyebrow="Client access"
      title={
        <>
          Welcome back to the <em>chair.</em>
        </>
      }
      subtitle="Sign in to book a cut, move a visit, or keep track of every appointment in one place."
      footer={
        <p>
          New to the shop? <Link to="/register">Create an account</Link> — it takes a
          minute.
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        <div className="auth-forgot">
          <Link to="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="ui-btn ui-btn--primary ui-btn--block auth-submit"
          disabled={loading}
        >
          {loading && <span className="ui-spinner" aria-hidden="true" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ClientLogin;
