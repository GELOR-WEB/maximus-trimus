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
        label: "📅 Book a haircut",
        prompt: "I'd like to book a haircut. Can you help me choose a date and time?",
      },
      {
        label: "🕒 Open slots today",
        prompt: "What time slots are still available today?",
      },
      {
        label: "🏠 Home service",
        prompt: "How does the home service work and how much does it cost?",
      },
      {
        label: "🔁 Reschedule",
        prompt: "I want to reschedule my existing booking. What do I need to do?",
      },
      {
        label: "❌ Cancel booking",
        prompt: "I need to cancel my booking. Can you help me with that?",
      },
      {
        label: "✅ Booking status",
        prompt: "Can you check the status of my booking?",
      },
    ],
  },
  {
    id: "faq",
    label: "FAQs",
    items: [
      {
        label: "💰 Prices",
        prompt: "How much does a haircut cost?",
      },
      {
        label: "📍 Location",
        prompt: "Where is the shop located?",
      },
      {
        label: "⏰ Hours",
        prompt: "What are your opening hours?",
      },
      {
        label: "🚶 Walk-ins",
        prompt: "Do you accept walk-ins?",
      },
      {
        label: "✂️ Services",
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
          "Salve! 👋 Welcome to Maximus Trimus.",
          "Tap a quick option below or type your question — I can help with bookings, schedules, and home service.",
        ],
        i18n: {
          en: {
            title: "Maximus Trimus",
            subtitle: "Booking help & FAQs — tap a quick option or type below",
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
  head.appendChild(createElement("span", "mt-qr-title", "💡 Quick options"));

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

    initChatOnce()
      .then(() => {
        if (cancelled) return;

        showChat();

        if (mountQuickReplies()) return;

        // The widget mounts asynchronously; wait for its footer, then inject.
        observer = new MutationObserver(() => {
          if (mountQuickReplies()) {
            observer.disconnect();
            observer = undefined;
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      })
      .catch((err) => {
        console.error("Failed to initialize n8n chat widget:", err);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [isAdmin]);

  return null;
};

export default N8nChat;
