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
    await wait(1200);

    const q = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        display: c.display,
        flex: c.flexDirection,
        justify: c.justifyContent,
        align: c.alignItems,
        grow: c.flexGrow,
        height: Math.round(r.height),
        y: Math.round(r.y),
        overflow: c.overflowY,
        marginTop: c.marginTop,
        html: e.outerHTML.slice(0, 300),
      };
    };

    return {
      body: q(".chat-body"),
      list: q(".chat-messages-list"),
      layout: q(".chat-layout"),
      footer: q(".chat-footer"),
      tray: q(".mt-quick-replies"),
      children: [...document.querySelector(".chat-body").children].map((e) => ({
        cls: e.className,
        tag: e.tagName,
        h: Math.round(e.getBoundingClientRect().height),
        y: Math.round(e.getBoundingClientRect().y),
      })),
    };
  } catch (e) {
    return { err: String(e) };
  }
})()
