import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const N8N_WEBHOOK_URL = "https://webh00k-3ger.app.n8n.cloud/webhook/bffe7d8b-045f-45bd-80d8-d91139b108da/chat";

const N8nChat = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const chatEl = document.getElementById("n8n-chat");

    // If in command center (admin), hide the chat widget
    if (isAdmin) {
      if (chatEl) {
        chatEl.style.display = "none";
      }
      return;
    }

    // If returning to client side and chat was already initialized, unhide it
    if (chatEl) {
      chatEl.style.display = "";
      return;
    }

    // Initialize chat on client side
    let isMounted = true;
    const initChat = async () => {
      try {
        const { createChat } = await import(
          /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js"
        );
        if (isMounted && !window.location.pathname.startsWith("/admin")) {
          createChat({
            webhookUrl: N8N_WEBHOOK_URL,
          });
        }
      } catch (err) {
        console.error("Failed to initialize n8n chat widget:", err);
      }
    };

    initChat();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  return null;
};

export default N8nChat;
