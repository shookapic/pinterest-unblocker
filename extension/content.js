(() => {
  "use strict";

  const overlaySelector = [
    '[data-test-id="signup-wall"]',
    '[data-test-id="login-wall"]',
    '[data-test-id="unauth-modal"]',
    '[data-test-id="unauth-banner"]',
    '[data-test-id="signup-modal"]',
    '[data-test-id="login-modal"]',
    '[data-test-id="login-modal-default"]',
    '[data-test-id="fullPageSignupModal"]',
    '[data-test-id="signup-modal-inspired"]',
    '[data-test-id="mobile-signup-mask"]',
    '[data-test-id="giftWrap"]',
  ].join(",");
  const authLinkSelector = 'a[href*="/login"], a[href*="/signup"], a[href*="/register"]';
  const rootSelector = 'html, body, #__PWS_ROOT__, #__PWS_ROOT__ > div, #desktopWrapper, .reactCloseupScrollContainer';
  const modalSelector = '[role="dialog"], [aria-modal="true"]';
  const backdropSelector = '[data-test-id="modal"], [data-test-id="modal-overlay"], [data-test-id="mobile-modal-mask-overlay"], .ReactModal__Overlay, .FullPageModal__scroller';
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

  // After dismissing a wall, public pin links can use native navigation.
  window.addEventListener("click", (event) => {
    if (!unlocked || isAccountPage() || event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button, input, select, textarea, [role="button"], [contenteditable="true"]')) return;
    const link = target.closest('a[href]');
    if (!link || !link.querySelector("img")) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && /^\/pin\/\d+(?:\/|$)/.test(url.pathname)) {
      event.stopImmediatePropagation();
    }
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

  function authLayer(element) {
    let layer = element;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (parent.matches('html, body, #__PWS_ROOT__, #__next, #root')) break;
      // Never hide the application or a separate, unrelated modal with the wall.
      const pageContent = 'main, [role="main"], [role="grid"], [data-test-id="pin"], header, nav';
      if (parent.matches(pageContent) || [...parent.querySelectorAll(pageContent)]
        .some((node) => !element.contains(node))) break;
      if ([...parent.querySelectorAll(modalSelector)]
        .some((node) => node !== element && !element.contains(node) && !node.contains(element))) break;
      const style = getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      const coversViewport = style.position === "fixed" &&
        ((style.inset === "0" || style.inset === "0px") ||
          (rect.width >= innerWidth && rect.height >= innerHeight && rect.top <= 0 && rect.left <= 0));
      if (parent.matches(backdropSelector) || coversViewport) layer = parent;
    }
    return layer;
  }

  function unlockScrolling() {
    for (const root of document.querySelectorAll(`${rootSelector}, [inert]`)) {
      if (root.closest('[data-pu-hidden]')) continue;
      if (!restoredRoots.has(root)) {
        restoredRoots.set(root, {
          inert: root.hasAttribute("inert"),
          ariaHidden: root.getAttribute("aria-hidden"),
        });
      }
      if (root.matches(rootSelector)) {
        const style = getComputedStyle(root);
        const scrollLocked = /^(hidden|clip)$/.test(style.overflowY || style.overflow);
        if (root.matches("html, body") || scrollLocked) {
          root.setAttribute("data-pu-scroll", root.matches(".reactCloseupScrollContainer") ? "container" : "");
        }
        if (root.id === "desktopWrapper" && style.position === "fixed") root.setAttribute("data-pu-flow", "");
        if (style.pointerEvents === "none") root.setAttribute("data-pu-interactive", "");
      }
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
    for (const dialog of document.querySelectorAll(modalSelector)) {
      if (dialog.querySelector(`${overlaySelector}, ${authLinkSelector}, input[type="password"]`)) {
        overlays.add(dialog);
      }
    }
    for (const overlay of overlays) hide(authLayer(overlay));

    for (const element of hidden) {
      if (!element.isConnected) hidden.delete(element);
    }
    for (const root of restoredRoots.keys()) {
      if (!root.isConnected) restoredRoots.delete(root);
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
      root.removeAttribute("data-pu-flow");
      root.removeAttribute("data-pu-interactive");
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

  // The attribute filter omits our markers to avoid observing our own updates.
  const observer = new MutationObserver(schedule);
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
