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
    if (!t || !w) return { err: "not mounted" };

    for (let i = 0; i < 15; i++) {
      if (getComputedStyle(w).display !== "none") break;
      t.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await wait(500);
    }
    await wait(1000);

    const ta = document.querySelector(".chat-input textarea");
    if (!ta) return { err: "no textarea" };
    ta.focus();
    await wait(400);

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    setter.call(ta, "Do you have anything open this Saturday afternoon?");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(800);

    const send = document.querySelector(".chat-input-send-button");
    const tray = document.querySelector(".mt-quick-replies");
    const list = document.querySelector(".chat-messages-list");
    const sc = getComputedStyle(send);

    return {
      trayCollapsed: tray?.classList.contains("mt-qr-collapsed"),
      sendDisabled: send?.disabled,
      sendBg: sc.backgroundColor,
      sendColor: sc.color,
      listH: Math.round(list?.getBoundingClientRect().height || 0),
      scroll: list
        ? { top: Math.round(list.scrollTop), h: list.scrollHeight, c: list.clientHeight }
        : null,
    };
  } catch (e) {
    return { err: String(e) };
  }
})()
