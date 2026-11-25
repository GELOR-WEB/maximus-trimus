import React from "react";
import { Link } from "react-router-dom";

/**
 * Editorial split-screen shell shared by every authentication screen.
 * Left: the shop (wood, tools, the barber) with the brand voice.
 * Right: the form, on the same near-black / gold system as the homepage.
 */
const AuthLayout = ({
  mode = "login",
  showTabs = true,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  fineprint = "Maximus Trimus · Angeles, Pampanga",
}) => (
  <div className="auth-page">
    <aside className="auth-brand" aria-label="Maximus Trimus barbershop">
      <div className="auth-brand__bg" aria-hidden="true" />
      <img
        className="auth-brand__portrait"
        src="/images/ako.png"
        alt=""
        aria-hidden="true"
      />
      <div className="auth-brand__content">
        <div className="auth-brand__brand">
          <img className="auth-brand__mark" src="/images/weblogo.png" alt="" aria-hidden="true" />
          <span>Maximus Trimus</span>
        </div>

        <div className="auth-brand__statement">
          <span className="ui-eyebrow">Est. 2021 · Angeles</span>
          <h1 className="auth-brand__name">
            Maximus
            <br />
            Trimus
          </h1>
          <p className="auth-brand__motto">Veni, vedi, praecidi.</p>
          <p className="auth-brand__line">
            Homey comfort, Roman grit, and a cut measured for you.
          </p>
        </div>

        <div className="auth-brand__foot">
          <span className="ui-rule" />
          <p>
            Solo barber · 5 years behind the chair
            <br />
            Shop cuts &amp; home service
          </p>
        </div>
      </div>
    </aside>

    <main className="auth-panel">
      <div className="auth-card">
        {showTabs && (
          <nav className="auth-tabs" aria-label="Account access">
            <Link
              to="/login"
              className={mode === "login" ? "is-active" : ""}
              aria-current={mode === "login" ? "page" : undefined}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={mode === "register" ? "is-active" : ""}
              aria-current={mode === "register" ? "page" : undefined}
            >
              Create account
            </Link>
          </nav>
        )}

        <header className="auth-head">
          <span className="ui-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
        </header>

        {children}

        {footer && <footer className="auth-foot">{footer}</footer>}

        <p className="auth-fineprint">{fineprint}</p>
      </div>
    </main>
  </div>
);

export default AuthLayout;
