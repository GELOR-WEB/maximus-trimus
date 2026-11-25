import React, { useId, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Field = ({ id, label, hint, error, aside, required, children, className = "" }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`ui-field ${error ? "has-error" : ""} ${className}`.trim()}>
      {label && (
        <div className="ui-field__top">
          <label className="ui-field__label" htmlFor={id}>
            {label}
            {required && (
              <span className="req" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {aside && <span className="ui-field__aside">{aside}</span>}
        </div>
      )}
      {children({ describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined })}
      {error ? (
        <p className="ui-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="ui-field__hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
};

export const TextField = ({
  id,
  label,
  hint,
  error,
  aside,
  required,
  inputClassName = "",
  ...inputProps
}) => (
  <Field id={id} label={label} hint={hint} error={error} aside={aside} required={required}>
    {({ describedBy }) => (
      <input
        id={id}
        className={`ui-input ${inputClassName}`.trim()}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
    )}
  </Field>
);

export const PasswordField = ({
  id,
  label,
  hint,
  error,
  required,
  showStrength = false,
  value = "",
  ...inputProps
}) => {
  const [visible, setVisible] = useState(false);
  const strengthId = useId();

  const getStrength = (password) => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || (/[A-Z]/.test(password) && /[a-z]/.test(password))) score += 1;
    const levels = ["Weak", "Fair", "Strong"];
    return { score, label: levels[Math.max(0, score - 1)] || "Weak" };
  };

  const strength = showStrength ? getStrength(value) : null;

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {({ describedBy }) => (
        <>
          <div className="ui-password">
            <input
              id={id}
              className="ui-input"
              type={visible ? "text" : "password"}
              value={value}
              required={required}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={[describedBy, strengthId].filter(Boolean).join(" ") || undefined}
              {...inputProps}
            />
            <button
              type="button"
              className="ui-eye"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              tabIndex={0}
            >
              {visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
            </button>
          </div>
          {strength && (
            <span className={`ui-strength ${strength.score >= 3 ? "is-strong" : ""}`} aria-hidden="true">
              <span className="ui-strength__bars">
                {[1, 2, 3].map((bar) => (
                  <span key={bar} className={`ui-strength__bar ${strength.score >= bar ? "is-filled" : ""}`} />
                ))}
              </span>
              <span className="ui-strength__label">{strength.label}</span>
            </span>
          )}
        </>
      )}
    </Field>
  );
};

export const TextAreaField = ({
  id,
  label,
  hint,
  error,
  aside,
  required,
  textareaClassName = "",
  ...textareaProps
}) => (
  <Field id={id} label={label} hint={hint} error={error} aside={aside} required={required}>
    {({ describedBy }) => (
      <textarea
        id={id}
        className={`ui-textarea ${textareaClassName}`.trim()}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...textareaProps}
      />
    )}
  </Field>
);

export default Field;
