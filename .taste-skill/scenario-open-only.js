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
    for (let i = 0; i < 15; i++) {
      if (getComputedStyle(w).display !== "none") break;
      t.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await wait(500);
    }
    await wait(1400);

    const rect = w.getBoundingClientRect();
    const tray = document.querySelector(".mt-quick-replies");
    const header = document.querySelector(".chat-header");
    const footer = document.querySelector(".chat-footer");
    const list = document.querySelector(".chat-messages-list");
    const close = document.querySelector(".mt-chat-close");
    const send = document.querySelector(".chat-input-send-button");

    const b = (e) => (e ? e.getBoundingClientRect().toJSON() : null);

    return {
      display: getComputedStyle(w).display,
      win: b(w),
      header: b(header),
      list: b(list),
      footer: b(footer),
      tray: b(tray),
      trayCollapsed: tray?.classList.contains("mt-qr-collapsed"),
      close: b(close),
      send: b(send),
      toggleVisible: t ? getComputedStyle(t).display : null,
      overflow: document.documentElement.scrollWidth - innerWidth,
      bodyLocked: getComputedStyle(document.body).overflow,
    };
  } catch (e) {
    return { err: String(e) };
  }
})()
