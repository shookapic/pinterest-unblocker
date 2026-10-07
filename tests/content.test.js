import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const script = await readFile(new URL("../extension/content.js", import.meta.url), "utf8");
const css = await readFile(new URL("../extension/content.css", import.meta.url), "utf8");

function fixture(t, html, path = "/pin/123/") {
  const dom = new JSDOM(`<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`, {
    url: `https://www.pinterest.fr${path}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const observers = [];
  const Observer = dom.window.MutationObserver;
  dom.window.MutationObserver = class extends Observer {
    constructor(callback) { super(callback); observers.push(this); }
  };
  dom.window.eval(script);
  t.after(() => {
    for (const observer of observers) observer.disconnect();
    dom.window.close();
  });
  return dom.window;
}

async function flush(window) {
  await new Promise((resolve) => window.setTimeout(resolve, 65));
}

test("hides known auth wall, restores scrolling and accessibility", async (t) => {
  const w = fixture(t, '<div id="__PWS_ROOT__" inert aria-hidden="true"><img></div><div data-test-id="signup-wall"></div>');
  w.document.body.style.overflow = "hidden";
  await flush(w);
  assert.equal(w.getComputedStyle(w.document.querySelector('[data-test-id="signup-wall"]')).display, "none");
  assert.equal(w.getComputedStyle(w.document.body).overflowY, "auto");
  assert.equal(w.document.getElementById("__PWS_ROOT__").hasAttribute("inert"), false);
  assert.equal(w.document.getElementById("__PWS_ROOT__").hasAttribute("aria-hidden"), false);
});

test("detects an auth dialog from semantic markers without English text", async (t) => {
  const w = fixture(t, '<div data-test-id="modal"><section role="dialog"><a href="/login/">Connexion</a></section></div>');
  await flush(w);
  assert.equal(w.document.querySelector('[data-test-id="modal"]').hasAttribute("data-pu-hidden"), true);
});

test("recognizes password login form and leaves a share dialog intact", async (t) => {
  const w = fixture(t, '<div role="dialog" id="auth"><input type="password"></div><div role="dialog" id="share">Share pin</div>');
  await flush(w);
  assert.equal(w.document.getElementById("auth").hasAttribute("data-pu-hidden"), true);
  assert.equal(w.document.getElementById("share").hasAttribute("data-pu-hidden"), false);
  assert.equal(w.document.body.hasAttribute("data-pu-scroll"), false);
});

test("unrelated modal retains its scroll lock after an auth wall was hidden", async (t) => {
  const w = fixture(t, '<div data-test-id="signup-wall"></div>');
  await flush(w);
  w.document.body.style.overflow = "hidden";
  w.document.body.insertAdjacentHTML("beforeend", '<div role="dialog" id="share">Share</div>');
  await flush(w);
  assert.equal(w.document.body.hasAttribute("data-pu-scroll"), false);
  assert.equal(w.document.getElementById("share").hasAttribute("data-pu-hidden"), false);
  w.document.getElementById("share").remove();
  await flush(w);
  assert.equal(w.document.body.hasAttribute("data-pu-scroll"), true);
});

test("handles new overlays and replaced roots following SPA navigation", async (t) => {
  const w = fixture(t, '<main>Pin</main>');
  await flush(w);
  w.history.pushState({}, "", "/ideas/flowers/");
  w.document.body.innerHTML = '<div id="__PWS_ROOT__" inert></div><div data-test-id="login-wall"></div>';
  await flush(w);
  assert.equal(w.document.querySelector('[data-test-id="login-wall"]').hasAttribute("data-pu-hidden"), true);
  assert.equal(w.document.getElementById("__PWS_ROOT__").hasAttribute("inert"), false);
  w.document.body.style.overflow = "hidden";
  await flush(w);
  assert.equal(w.getComputedStyle(w.document.body).overflowY, "auto");
});

test("a URL-only navigation restores the deliberate login page", async (t) => {
  const w = fixture(t, '<div id="__PWS_ROOT__" inert aria-hidden="true"></div><div data-test-id="login-wall"></div>');
  await flush(w);
  w.history.pushState({}, "", "/login/");
  await new Promise((resolve) => w.setTimeout(resolve, 850));
  assert.equal(w.document.querySelector('[data-test-id="login-wall"]').hasAttribute("data-pu-hidden"), false);
  assert.equal(w.document.body.hasAttribute("data-pu-scroll"), false);
  assert.equal(w.document.getElementById("__PWS_ROOT__").hasAttribute("inert"), true);
  assert.equal(w.document.getElementById("__PWS_ROOT__").getAttribute("aria-hidden"), "true");
});

for (const route of ["/login/", "/signup/", "/settings/profile/", "/password/reset/"]) {
  test(`preserves ${route}`, async (t) => {
    const w = fixture(t, '<div data-test-id="login-modal"><input type="password"></div>', route);
    await flush(w);
    assert.equal(w.document.querySelector('[data-test-id="login-modal"]').hasAttribute("data-pu-hidden"), false);
    assert.equal(w.document.body.hasAttribute("data-pu-scroll"), false);
  });
}

test("native image context menu is not canceled by site listeners", (t) => {
  const w = fixture(t, '<div data-test-id="pin"><img id="photo"></div><input id="search">');
  let blocked = 0;
  w.document.addEventListener("contextmenu", (event) => { blocked++; event.preventDefault(); });
  const imageEvent = new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true });
  w.document.getElementById("photo").dispatchEvent(imageEvent);
  assert.equal(imageEvent.defaultPrevented, false);
  assert.equal(blocked, 0);
  const inputEvent = new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true });
  w.document.getElementById("search").dispatchEvent(inputEvent);
  assert.equal(inputEvent.defaultPrevented, true);
  assert.equal(blocked, 1);
});

test("decorative image covers do not intercept pointer input", async (t) => {
  const w = fixture(t, '<div data-test-id="pin"><img><div data-test-id="pin-hover-overlay"></div></div>');
  await flush(w);
  assert.equal(w.getComputedStyle(w.document.querySelector('[data-test-id="pin-hover-overlay"]')).pointerEvents, "none");
  assert.equal(w.getComputedStyle(w.document.querySelector("img")).pointerEvents, "auto");
});

test("an ordinary pin does not receive scroll overrides", async (t) => {
  const w = fixture(t, '<main><img></main>');
  await flush(w);
  assert.equal(w.document.querySelectorAll('[data-pu-scroll], [data-pu-hidden]').length, 0);
});
