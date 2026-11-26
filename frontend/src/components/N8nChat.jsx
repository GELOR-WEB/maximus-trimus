import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./N8nChat.css";

const N8N_WEBHOOK_URL = "https://webh00k-3ger.app.n8n.cloud/webhook/bffe7d8b-045f-45bd-80d8-d91139b108da/chat";

const CHAT_ROOT_ID = "n8n-chat";
const PANEL_ATTR = "data-mt-quick-replies";

/**
 * Premade prompts shown as tappable buttons inside the chat window.
 * Booking-related options come first so the booking flow is the focus;
 * general FAQs live in a second, visually lighter row.
 */
const QUICK_REPLY_GROUPS = [
  {
    id: "booking",
    label: "Book",
    items: [
      {
        label: "Book a haircut",
        prompt: "I'd like to book a haircut. Can you help me choose a date and time?",
      },
      {
        label: "Today's slots",
        prompt: "What time slots are still available today?",
      },
      {
        label: "Home service",
        prompt: "How does the home service work and how much does it cost?",
      },
      {
        label: "Reschedule",
        prompt: "I want to reschedule my existing booking. What do I need to do?",
      },
      {
        label: "Cancel booking",
        prompt: "I need to cancel my booking. Can you help me with that?",
      },
      {
        label: "Booking status",
        prompt: "Can you check the status of my booking?",
      },
    ],
  },
  {
    id: "faq",
    label: "FAQs",
    items: [
      {
        label: "Prices",
        prompt: "How much does a haircut cost?",
      },
      {
        label: "Location",
        prompt: "Where is the shop located?",
      },
      {
        label: "Hours",
        prompt: "What are your opening hours?",
      },
      {
        label: "Walk-ins",
        prompt: "Do you accept walk-ins?",
      },
      {
        label: "Services",
        prompt: "What services do you offer?",
      },
    ],
  },
];

// Guard so React StrictMode (dev) can't mount the widget twice.
let chatInitPromise = null;

const initChatOnce = () => {
  if (!chatInitPromise) {
    chatInitPromise = (async () => {
      const { createChat } = await import(
        /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js"
      );
      createChat({
        webhookUrl: N8N_WEBHOOK_URL,
        initialMessages: [
          "Salve! Welcome to Maximus Trimus.",
          "Tap a quick option below or type your question — I can help with bookings, schedules, and home service.",
        ],
        i18n: {
          en: {
            title: "Maximus Trimus",
            subtitle: "Booking concierge · Angeles, Pampanga",
            footer: "",
            getStarted: "Start a new chat",
            inputPlaceholder: "Ask about booking, prices, or services…",
          },
        },
      });
    })().catch((err) => {
      // Allow a retry on a later mount if the CDN import fails.
      chatInitPromise = null;
      throw err;
    });
  }

  return chatInitPromise;
};

const createElement = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/**
 * Type a prompt into the n8n chat input and submit it.
 * The widget's textarea is a Vue `v-model`, so the native value setter +
 * an `input` event keeps the widget's state in sync before we send.
 */
const sendPromptToChat = (prompt) => {
  if (!prompt) return false;

  const root = document.getElementById(CHAT_ROOT_ID);
  if (!root) return false;

  const textarea = root.querySelector(
    'textarea[data-test-id="chat-input"], .chat-input textarea'
  );
  if (!textarea) return false;

  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  if (valueSetter) valueSetter.call(textarea, prompt);
  else textarea.value = prompt;

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();

  textarea.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    })
  );

  // Fallback: if Enter was ignored (e.g. the widget had not enabled the
  // send button yet), click it on the next frame.
  window.requestAnimationFrame(() => {
    if (!textarea.value) return;
    const sendButton = root.querySelector(".chat-input-send-button");
    if (sendButton && !sendButton.disabled) sendButton.click();
  });

  return true;
};

const setCollapsed = (panel, collapsed) => {
  panel.classList.toggle("mt-qr-collapsed", collapsed);
  const toggle = panel.querySelector(".mt-qr-toggle");
  if (toggle) {
    toggle.textContent = collapsed ? "Show" : "Hide";
    toggle.setAttribute("aria-expanded", String(!collapsed));
  }
};

const createQuickReplyPanel = () => {
  const panel = createElement("div", "mt-quick-replies");
  panel.setAttribute(PANEL_ATTR, "");
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Quick booking questions");

  const head = createElement("div", "mt-qr-head");
  head.appendChild(createElement("span", "mt-qr-title", "Quick options"));

  const toggle = createElement("button", "mt-qr-toggle", "Hide");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "true");
  head.appendChild(toggle);

  const rows = createElement("div", "mt-qr-rows");

  QUICK_REPLY_GROUPS.forEach((group) => {
    const row = createElement("div", "mt-qr-row");
    row.dataset.group = group.id;

    row.appendChild(createElement("span", "mt-qr-tag", group.label));

    group.items.forEach((item) => {
      const chip = createElement("button", "mt-qr-chip", item.label);
      chip.type = "button";
      chip.dataset.prompt = item.prompt;
      row.appendChild(chip);
    });

    rows.appendChild(row);
  });

  panel.appendChild(head);
  panel.appendChild(rows);

  // Event delegation keeps the panel working without re-binding handlers.
  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const chip = target.closest(".mt-qr-chip");
    if (chip) {
      if (sendPromptToChat(chip.dataset.prompt)) {
        // Give the conversation room once a prompt has been sent.
        setCollapsed(panel, true);
      }
      return;
    }

    if (target.closest(".mt-qr-toggle")) {
      setCollapsed(panel, !panel.classList.contains("mt-qr-collapsed"));
    }
  });

  return panel;
};

const mountQuickReplies = () => {
  const root = document.getElementById(CHAT_ROOT_ID);
  const footer = root?.querySelector(".chat-footer");
  if (!footer) return false;

  if (!footer.querySelector(`[${PANEL_ATTR}]`)) {
    footer.insertBefore(createQuickReplyPanel(), footer.firstChild);
  }

  return true;
};

const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" ' +
  'stroke-width="1.8" stroke-linecap="round" /></svg>';

/**
 * The widget's header is plain; add the shop's barber-pole mark and a clear
 * close control so the concierge reads as part of the site, not an embed.
 */
const ensureHeaderDecor = () => {
  const root = document.getElementById(CHAT_ROOT_ID);
  const heading = root?.querySelector(".chat-heading");
  if (!heading) return;

  if (!heading.querySelector(".mt-chat-emblem")) {
    const emblem = createElement("span", "mt-chat-emblem");
    emblem.setAttribute("aria-hidden", "true");
    heading.insertBefore(emblem, heading.firstChild);
  }

  if (!heading.querySelector(".mt-chat-close")) {
    const close = createElement("button", "mt-chat-close");
    close.type = "button";
    close.setAttribute("aria-label", "Close chat");
    close.innerHTML = CLOSE_ICON;
    close.addEventListener("click", () => {
      root.querySelector(".chat-window-toggle")?.click();
    });
    heading.appendChild(close);
  }
};

/**
 * n8n renders the launcher as a plain div. Give it a button role, a name and
 * keyboard support, and keep the open state announced.
 */
const ensureToggleA11y = () => {
  const root = document.getElementById(CHAT_ROOT_ID);
  const toggle = root?.querySelector(".chat-window-toggle");
  if (!toggle) return;

  toggle.setAttribute("role", "button");
  toggle.setAttribute("tabindex", "0");
  toggle.setAttribute("aria-controls", CHAT_ROOT_ID);

  if (!toggle.dataset.mtKeyBound) {
    toggle.dataset.mtKeyBound = "1";
    toggle.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle.click();
    });
  }
};

const syncChatState = () => {
  const root = document.getElementById(CHAT_ROOT_ID);
  const windowEl = root?.querySelector(".chat-window");
  // The widget keeps the window in the DOM and hides it with display:none,
  // so a mounted node is not the same thing as an open concierge.
  const open = Boolean(windowEl && windowEl.getClientRects().length > 0);
  const toggle = root?.querySelector(".chat-window-toggle");

  root?.classList.toggle("mt-chat-expanded", open);

  if (toggle) {
    const label = open ? "Close booking chat" : "Open booking chat";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
  }

  document.body.classList.toggle("mt-chat-open", open);
};

/** Collapse the tray once someone starts typing so the conversation leads. */
const bindComposerFocus = () => {
  const root = document.getElementById(CHAT_ROOT_ID);
  const textarea = root?.querySelector(".chat-input textarea");
  const panel = root?.querySelector(`[${PANEL_ATTR}]`);
  const send = root?.querySelector(".chat-input-send-button");
  const windowEl = root?.querySelector(".chat-window");

  if (textarea && !textarea.dataset.mtFocusBound) {
    textarea.dataset.mtFocusBound = "1";
    textarea.setAttribute("aria-label", "Message the booking concierge");

    if (panel) {
      textarea.addEventListener("focus", () => {
        if (!panel.classList.contains("mt-qr-collapsed")) setCollapsed(panel, true);
      });
    }
  }

  if (send && !send.dataset.mtLabelBound) {
    send.dataset.mtLabelBound = "1";
    send.setAttribute("aria-label", "Send message");
    send.setAttribute("title", "Send message");
  }

  if (windowEl && !windowEl.dataset.mtDialogBound) {
    windowEl.dataset.mtDialogBound = "1";
    windowEl.setAttribute("role", "dialog");
    windowEl.setAttribute("aria-label", "Booking concierge");
  }
};

const decorateChat = () => {
  const mounted = mountQuickReplies();
  ensureHeaderDecor();
  ensureToggleA11y();
  bindComposerFocus();
  syncChatState();
  return mounted;
};

const N8nChat = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const hideChat = () => {
      const chatEl = document.getElementById(CHAT_ROOT_ID);
      if (chatEl) chatEl.style.display = "none";
    };

    const showChat = () => {
      const chatEl = document.getElementById(CHAT_ROOT_ID);
      if (chatEl) chatEl.style.display = "";
    };

    // Command center (admin): keep the widget hidden and never boot it.
    if (isAdmin) {
      hideChat();
      return undefined;
    }

    showChat();

    let cancelled = false;
    let observer;
    let frame = 0;

    const scheduleDecorate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!cancelled) decorateChat();
      });
    };

    const onResize = () => syncChatState();

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      const root = document.getElementById(CHAT_ROOT_ID);
      const windowEl = root?.querySelector(".chat-window");
      if (windowEl && windowEl.getClientRects().length > 0) {
        root.querySelector(".chat-window-toggle")?.click();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    initChatOnce()
      .then(() => {
        if (cancelled) return;

        showChat();
        decorateChat();

        // The widget mounts and re-renders asynchronously (messages stream in),
        // so keep its shell, launcher and quick replies in sync.
        observer = new MutationObserver(scheduleDecorate);
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener("resize", onResize);
      })
      .catch((err) => {
        console.error("Failed to initialize n8n chat widget:", err);
      });

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("mt-chat-open");
    };
  }, [isAdmin]);

  return null;
};

export default N8nChat;
