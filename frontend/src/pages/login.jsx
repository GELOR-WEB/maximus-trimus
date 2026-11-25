import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { PasswordField, TextField } from "../components/ui/Fields";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    try {
      // Use the centralized login function from AuthContext
      // This handles: axios post, localStorage, React state, and OneSignal tagging
      const result = await login(formData.username, formData.password);

      if (result.success) {
        // Redirect to the Dashboard
        navigate("/admin/dashboard");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      mode="admin"
      showTabs={false}
      eyebrow="Staff access"
      title={
        <>
          The command <em>center.</em>
        </>
      }
      subtitle="Owner and staff sign-in for the booking desk, calendar, and shop settings."
      footer={
        <p>
          Here to book a cut? <Link to="/login">Client sign in</Link>.
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
          id="username"
          name="username"
          type="text"
          label="Username"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          className="ui-btn ui-btn--primary ui-btn--block auth-submit"
          disabled={loading}
        >
          {loading && <span className="ui-spinner" aria-hidden="true" />}
          {loading ? "Entering…" : "Enter dashboard"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
