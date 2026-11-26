(async () => {
  try {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
        h: +r.height.toFixed(1),
        y: +r.y.toFixed(1),
        pad: c.padding,
        margin: c.margin,
        line: c.lineHeight,
        font: c.fontSize,
        minH: c.minHeight,
      };
    };

    return {
      header: q(".chat-header"),
      heading: q(".chat-heading"),
      h1: q(".chat-heading h1"),
      p: q(".chat-header p"),
      emblem: q(".mt-chat-emblem"),
      close: q(".mt-chat-close"),
    };
  } catch (e) {
    return { err: String(e) };
  }
})()
