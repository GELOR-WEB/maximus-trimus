import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { PasswordField, TextField } from "../components/ui/Fields";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: "" }));
    }
    if (error) setError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Tell us the name for the chair.";
    }

    if (!formData.email.trim()) {
      errors.email = "An email keeps your bookings together.";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = "That email address doesn't look complete.";
    }

    if (!formData.password) {
      errors.password = "Choose a password.";
    } else if (formData.password.length < 6) {
      errors.password = "Use at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Re-enter your password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "The two passwords don't match yet.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("A few details need another look.");
      return;
    }

    setLoading(true);

    const result = await register(
      formData.email,
      formData.password,
      formData.fullName,
      formData.phone
    );

    setLoading(false);

    if (result.success) {
      navigate("/"); // Redirect to home page
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout
      mode="register"
      eyebrow="New client"
      title={
        <>
          Take your <em>seat.</em>
        </>
      }
      subtitle="Create an account to hold your slot, reschedule without a call, and keep your cut history in one place."
      footer={
        <p>
          Already have a chair? <Link to="/login">Sign in here</Link>.
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
        <div className="auth-form__row">
          <TextField
            id="fullName"
            name="fullName"
            type="text"
            label="Full name"
            placeholder="Your name"
            value={formData.fullName}
            onChange={handleChange}
            autoComplete="name"
            error={fieldErrors.fullName}
            required
          />

          <TextField
            id="phone"
            name="phone"
            type="tel"
            label="Phone"
            placeholder="Optional"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
            hint="Used for booking updates."
          />
        </div>

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          error={fieldErrors.email}
          required
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          error={fieldErrors.password}
          showStrength
          required
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Type it once more"
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
