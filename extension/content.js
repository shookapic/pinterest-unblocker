(() => {
  "use strict";

  const overlaySelector = [
    '[data-test-id="signup-wall"]',
    '[data-test-id="login-wall"]',
    '[data-test-id="unauth-modal"]',
    '[data-test-id="unauth-banner"]',
    '[data-test-id="signup-modal"]',
    '[data-test-id="login-modal"]',
  ].join(",");
  const authLinkSelector = 'a[href*="/login"], a[href*="/signup"], a[href*="/register"]';
  const rootSelector = 'html, body, #__PWS_ROOT__, #__PWS_ROOT__ > div';
  let queued = false;
  let unlocked = false;
  const hidden = new Set();
  const restoredRoots = new Map();

  // A capture listener preserves the browser default while stopping site handlers.
  window.addEventListener("contextmenu", (event) => {
    if (isAccountPage()) return;
    const image = event.composedPath().some((node) =>
      node instanceof Element && (node.matches("img, picture") || node.closest('[data-test-id="pin"]')),
    );
    if (image) event.stopImmediatePropagation();
  }, true);

  function isAccountPage() {
    return /^\/(?:login|signup|register|password|settings|business)(?:\/|$)/i.test(location.pathname);
  }

  function hide(element) {
    if (!hidden.has(element)) {
      hidden.add(element);
      element.setAttribute("data-pu-hidden", "");
    }
  }

  function unlockScrolling() {
    for (const root of document.querySelectorAll(rootSelector)) {
      if (!restoredRoots.has(root)) {
        restoredRoots.set(root, {
          inert: root.hasAttribute("inert"),
          ariaHidden: root.getAttribute("aria-hidden"),
        });
      }
      root.setAttribute("data-pu-scroll", "");
      root.removeAttribute("inert");
      if (root.getAttribute("aria-hidden") === "true") root.removeAttribute("aria-hidden");
    }
    unlocked = true;
  }

  function restore() {
    for (const element of hidden) element.removeAttribute("data-pu-hidden");
    hidden.clear();
    restoreScroll();
  }

  function clean() {
    queued = false;
    if (isAccountPage()) {
      restore();
      return;
    }

    // Keep unrelated dialogs (pin details, reporting, sharing) usable.
    const overlays = new Set(document.querySelectorAll(overlaySelector));
    for (const dialog of document.querySelectorAll('[role="dialog"], [aria-modal="true"]')) {
      if (dialog.querySelector(`${overlaySelector}, ${authLinkSelector}, input[type="password"]`)) {
        overlays.add(dialog.closest('[data-test-id="modal"]') || dialog);
      }
    }
    for (const overlay of overlays) hide(overlay);

    for (const element of hidden) {
      if (!element.isConnected) hidden.delete(element);
    }
    const otherDialog = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')]
      .some((dialog) => !dialog.closest('[data-pu-hidden], [hidden], [aria-hidden="true"]') &&
        getComputedStyle(dialog).display !== "none");
    // New roots and reapplied locks are common during SPA navigation.
    if (!otherDialog && (overlays.size || unlocked)) unlockScrolling();
    else if (unlocked) restoreScroll();
  }

  function restoreScroll() {
    for (const [root, original] of restoredRoots) {
      root.removeAttribute("data-pu-scroll");
      if (original.inert) root.setAttribute("inert", "");
      if (original.ariaHidden !== null) root.setAttribute("aria-hidden", original.ariaHidden);
    }
    restoredRoots.clear();
    unlocked = false;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(clean);
  }

  const observer = new MutationObserver((records) => {
    // Ignore our own markers so cleanup never feeds an observer loop.
    if (records.some((record) => record.type === "childList" ||
      !["data-pu-hidden", "data-pu-scroll"].includes(record.attributeName))) schedule();
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "role", "aria-modal", "aria-hidden", "inert", "data-test-id", "href", "type"],
  });
  window.addEventListener("popstate", schedule);
  window.addEventListener("hashchange", schedule);
  window.addEventListener("pageshow", schedule);
  // URL changes without a DOM mutation need no history monkey patch.
  let previousUrl = location.href;
  setInterval(() => {
    if (previousUrl === location.href) return;
    previousUrl = location.href;
    schedule();
  }, 750);
  schedule();
})();
