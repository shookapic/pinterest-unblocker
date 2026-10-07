import { test, expect, chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const extensionPath = fileURLToPath(new URL("../../dist/chrome/", import.meta.url));
const icon = await readFile(new URL("../../extension/icons/128.png", import.meta.url));
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
body { overflow: hidden; margin: 0; } main { min-height: 3000px; padding: 40px; }
[data-test-id=pin] { position:relative; width:128px; height:128px; }
[data-test-id=pin-hover-overlay] { position:absolute; inset:0; }
[data-test-id=signup-wall] { position:fixed; inset:0; background:white; }
</style></head><body><main id="__PWS_ROOT__"><div data-test-id="pin">
<img id="image" width="128" height="128" src="/sample.png"><div data-test-id="pin-hover-overlay"></div>
</div><input id="search"></main><div data-test-id="signup-wall"><a href="/login/">Log in</a></div>
<script>window.siteMenus=0;document.addEventListener('contextmenu',event=>{window.siteMenus++;event.preventDefault()});</script>
</body></html>`;

let context;
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    executablePath: process.env.TEST_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  await context.route("https://**/*", async (route) => {
    if (route.request().url().endsWith("/sample.png")) {
      await route.fulfill({ contentType: "image/png", body: icon });
    } else await route.fulfill({ contentType: "text/html", body: fixture });
  });
});
test.afterAll(async () => { await context?.close(); });

test("installed extension hides overlays, scrolls, and preserves image right-click", async () => {
  const page = await context.newPage();
  await page.goto("https://www.pinterest.fr/pin/123/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  const target = await page.evaluate(() => {
    const rect = document.getElementById("image").getBoundingClientRect();
    return document.elementFromPoint(rect.x + 30, rect.y + 30).id;
  });
  expect(target).toBe("image");
  // Check page scrolling before opening the browser's native menu.
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 700);
  await expect.poll(async () => {
    const metrics = await page.evaluate(() => ({
      top: window.scrollY,
      height: document.scrollingElement.scrollHeight,
      viewport: document.scrollingElement.clientHeight,
      bodyTop: document.body.scrollTop,
      bodyHeight: document.body.scrollHeight,
      bodyViewport: document.body.clientHeight,
      htmlOverflow: getComputedStyle(document.documentElement).overflowY,
      bodyOverflow: getComputedStyle(document.body).overflowY,
    }));
    if (metrics.top === 0) console.log("Scroll metrics:", metrics);
    return metrics.top;
  }).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  const imageDefault = await page.locator("#image").evaluate((image) =>
    image.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })),
  );
  expect(imageDefault).toBe(true);
  expect(await page.evaluate(() => window.siteMenus)).toBe(0);
  await page.locator("#image").click({ button: "right" });
  expect(await page.evaluate(() => window.siteMenus)).toBe(0);
  await page.keyboard.press("Escape");
  await page.close();
});

test("SPA updates hide late dialogs and preserve intentional login", async () => {
  const page = await context.newPage();
  await page.goto("https://www.pinterest.co.uk/pin/123/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  await page.evaluate(() => {
    history.pushState({}, "", "/ideas/flowers/");
    document.querySelector('[data-test-id="signup-wall"]').remove();
    document.body.insertAdjacentHTML("beforeend", '<div id="late" role="dialog"><input type="password"></div>');
    document.body.style.overflow = "hidden";
  });
  await expect(page.locator("#late")).toBeHidden();
  await expect(page.locator("body")).toHaveAttribute("data-pu-scroll", "");
  await page.evaluate(() => history.pushState({}, "", "/login/"));
  await expect(page.locator("#late")).toBeVisible();
  await expect(page.locator("body")).not.toHaveAttribute("data-pu-scroll");
  await page.close();
});

test("unrelated sites and excluded Pinterest subdomains remain unchanged", async () => {
  for (const host of ["example.org", "help.pinterest.com"]) {
    const page = await context.newPage();
    await page.goto(`https://${host}/pin/123/`);
    await expect(page.locator('[data-test-id="signup-wall"]')).toBeVisible();
    expect(await page.locator('[data-pu-hidden], [data-pu-scroll]').count()).toBe(0);
    await page.close();
  }
});
