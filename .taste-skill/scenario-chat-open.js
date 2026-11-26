(async () => {
  try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const s = document.createElement("style");
    s.textContent = ".flipper{transform:none !important}";
    document.head.appendChild(s);

    let t = null;
    let w = null;
    for (let i = 0; i < 60; i++) {
      t = document.querySelector(".chat-window-toggle");
      w = document.querySelector(".chat-window");
      if (t && w) break;
      await wait(250);
    }
    if (!t || !w) return { err: "not mounted", t: !!t, w: !!w };

    for (let i = 0; i < 15; i++) {
      if (getComputedStyle(w).display !== "none") break;
      t.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await wait(500);
    }
    await wait(1200);

    const display = getComputedStyle(w).display;
    if (display === "none") return { err: "not open", display };

    const list = document.querySelector(".chat-messages-list");
    if (!list) return { err: "no list" };

    const user = document.createElement("div");
    user.className = "chat-message chat-message-from-user";
    user.textContent = "I want to book a haircut for Saturday at 2pm.";
    list.appendChild(user);

    const bot = document.createElement("div");
    bot.className = "chat-message chat-message-from-bot";
    bot.textContent = "Saturday 2:00 pm is open. Shall I hold that slot for you?";
    list.appendChild(bot);

    const typing = document.createElement("div");
    typing.className = "chat-message chat-message-from-bot chat-message-typing";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "chat-message-typing-circle";
      typing.appendChild(dot);
    }
    list.appendChild(typing);

    await wait(800);

    const r = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const c = getComputedStyle(e);
      const rc = e.getBoundingClientRect();
      return {
        x: Math.round(rc.x),
        y: Math.round(rc.y),
        w: Math.round(rc.width),
        h: Math.round(rc.height),
        bg: c.backgroundColor,
        color: c.color,
        font: c.fontFamily,
        fontSize: c.fontSize,
      };
    };

    return {
      win: r(".chat-window"),
      msg: r(".chat-message"),
      tray: r(".mt-quick-replies"),
      toggle: r(".chat-window-toggle"),
      typing: r(".chat-message-typing"),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  } catch (e) {
    return { err: String(e) };
  }
})()
