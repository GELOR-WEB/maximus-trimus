import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Shared accessible dialog.
 *
 * - Rendered in a portal on <body>, above the chat widget.
 * - Escape closes, backdrop click closes, Tab is trapped, focus returns on close.
 * - Desktop: centred card. Mobile (<=640px): bottom sheet with a drag grip.
 * - Exit animation is handled here so callers can keep `isOpen` controlled.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const Modal = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  subtitle,
  children,
  footer,
  size = "md",
  bare = false,
  hideHeader = false,
  hideClose = false,
  dismissible = true,
  ariaLabel,
  panelClassName = "",
  zIndex,
}) => {
  const [mounted, setMounted] = useState(!!isOpen);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Mount / exit animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }

    if (!mounted) return undefined;

    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 190);

    return () => window.clearTimeout(timer);
  }, [isOpen, mounted]);

  const requestClose = useCallback(() => {
    if (!dismissible) return;
    closeRef.current?.();
  }, [dismissible]);

  // Scroll lock while open
  useEffect(() => {
    if (!mounted || closing) return undefined;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [mounted, closing]);

  // Focus trap + Escape + restore focus
  useEffect(() => {
    if (!mounted || closing) return undefined;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    const focusTimer = window.setTimeout(() => {
      const autoFocusNode = panel?.querySelector("[data-autofocus]");
      (autoFocusNode || panel)?.focus?.({ preventScroll: true });
    }, 40);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (node) => node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true"
      );

      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const activeInside = panel.contains(active);

      if (event.shiftKey && (!activeInside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!activeInside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus?.({ preventScroll: true });
      }
    };
  }, [mounted, closing, requestClose]);

  if (!mounted) return null;

  const showHeader = !bare && !hideHeader && (title || eyebrow || subtitle);

  return createPortal(
    <div className="ui-modal-root" style={zIndex ? { zIndex } : undefined}>
      <div
        className={`ui-modal-backdrop ${closing ? "is-closing" : ""}`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`ui-modal ui-modal--${size} ${bare ? "ui-modal--bare" : ""} ${
          closing ? "is-closing" : ""
        } ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={showHeader && title ? titleId : undefined}
        aria-describedby={showHeader && subtitle ? descId : undefined}
        aria-label={!showHeader || !title ? ariaLabel || title || "Dialog" : undefined}
        tabIndex={-1}
      >
        <span className="ui-modal__grip" aria-hidden="true" />

        {showHeader && (
          <header className="ui-modal__head">
            <div className="ui-modal__head-copy">
              {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
              {title && (
                <h2 className="ui-modal__title" id={titleId}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="ui-modal__sub" id={descId}>
                  {subtitle}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                className="ui-modal__close"
                onClick={requestClose}
                aria-label="Close dialog"
              >
                ×
              </button>
            )}
          </header>
        )}

        {bare && !hideClose && (
          <button
            type="button"
            className="ui-modal__close ui-modal__close--float"
            onClick={requestClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        )}

        <div className="ui-modal__body">{children}</div>

        {footer && <footer className="ui-modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
