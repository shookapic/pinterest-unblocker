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
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
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

test("removes gray auth backdrops and makes nested inert content clickable", async () => {
  const page = await context.newPage();
  await page.goto("https://www.pinterest.com/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  await page.evaluate(() => {
    document.querySelector('[data-test-id="signup-wall"]').remove();
    document.querySelector("main").innerHTML = '<div><section inert id="content"><button id="open-pin">Open pin</button></section></div>';
    window.pinClicks = 0;
    document.getElementById("open-pin").onclick = () => window.pinClicks++;
    document.body.insertAdjacentHTML("beforeend", '<div id="gray-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10001"><div><section role="dialog" aria-modal="true"><div data-test-id="fullPageSignupModal">Sign up</div><a href="/login/">Log in</a></section></div></div>');
  });
  await expect(page.locator("#gray-backdrop")).toBeHidden();
  await expect(page.locator("#content")).not.toHaveAttribute("inert");
  await page.locator("#open-pin").click();
  expect(await page.evaluate(() => window.pinClicks)).toBe(1);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<div id="share-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10002"><section role="dialog"><button id="share-pin">Share pin</button></section></div>');
    document.getElementById("share-pin").onclick = () => window.pinClicks++;
  });
  await expect(page.locator("#share-backdrop")).toBeVisible();
  await page.locator("#share-pin").click();
  expect(await page.evaluate(() => window.pinClicks)).toBe(2);
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

test("window scrolling still reaches the feed's load-more listener", async () => {
  const page = await context.newPage();
  await page.route("https://www.pinterest.com/ideas/scroll-test/", (route) => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><head><style>
      body { margin:0; overflow:hidden; }
      #__PWS_ROOT__, #feed { height:100vh; }
      main { height:2400px; }
    </style></head><body><div id="__PWS_ROOT__"><div id="feed"><main><a href="/pin/123/">Pin</a></main></div></div>
      <div data-test-id="signup-wall">Sign up</div>
      <script>window.loadedPins=1;window.addEventListener('scroll',()=>{
        if(window.scrollY>200 && window.loadedPins===1){
          window.loadedPins++;document.querySelector('main').insertAdjacentHTML('beforeend','<p id="next-pin">Next pin</p>');
        }
      });</script></body></html>`,
  }));
  await page.goto("https://www.pinterest.com/ideas/scroll-test/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await expect(page.locator("#next-pin")).toHaveCount(1);
  expect(await page.locator("#feed").evaluate((feed) => feed.scrollTop)).toBe(0);
  await page.close();
});

test("retains a native nested feed scroller and its load-more listener", async () => {
  const page = await context.newPage();
  await page.route("https://www.pinterest.com/ideas/nested-scroll-test/", (route) => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><head><style>
      body { margin:0;overflow:hidden; }
      #feed { height:100vh;overflow-y:scroll; }
      main { height:2400px; }
    </style></head><body><div id="__PWS_ROOT__"><div id="feed"><main>Pins</main></div></div>
      <div data-test-id="signup-wall">Sign up</div>
      <script>document.getElementById('feed').addEventListener('scroll',event=>{
        if(event.currentTarget.scrollTop>200)window.feedLoaded=true;
      });</script></body></html>`,
  }));
  await page.goto("https://www.pinterest.com/ideas/nested-scroll-test/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.feedLoaded)).toBe(true);
  expect(await page.locator("#feed").evaluate((feed) => getComputedStyle(feed).overflowY)).toBe("scroll");
  await page.close();
});

test("public pin images navigate despite a signup click handler and preserve controls", async () => {
  const page = await context.newPage();
  await page.goto("https://www.pinterest.com/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  await page.evaluate(() => {
    document.querySelector("main").innerHTML = '<div data-test-id="pin" style="position:relative"><a id="pin-link" href="/pin/456/"><img id="pin-image" width="128" height="128" src="/sample.png"><div class="GrowthUnauthPinImage__imageDim" style="position:absolute;inset:0"></div></a><button id="save-pin">Save</button></div>';
    document.addEventListener("click", (event) => {
      if (event.target.closest("#pin-link")) {
        event.preventDefault();
        document.body.insertAdjacentHTML("beforeend", '<div data-test-id="signup-wall">Log in</div>');
      }
      if (event.target.closest("#save-pin")) window.saveClicked = true;
    });
  });
  await page.locator("#save-pin").click();
  expect(await page.evaluate(() => window.saveClicked)).toBe(true);
  await page.locator("#pin-image").click();
  await expect(page).toHaveURL("https://www.pinterest.com/pin/456/");
  await page.close();
});

test("releases a fixed desktop wrapper and root pointer lock", async () => {
  const page = await context.newPage();
  await page.route("https://www.pinterest.com/ideas/wrapper-test/", (route) => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><head><style>
      body { margin:0;overflow:hidden;pointer-events:none; }
      #desktopWrapper { position:fixed;inset:0;overflow:hidden; }
      main { height:2400px;padding:40px; }
    </style></head><body><div id="__PWS_ROOT__"><div id="desktopWrapper"><main><button id="open">Open</button></main></div></div>
      <div data-test-id="signup-wall">Sign up</div>
      <script>document.getElementById('open').onclick=()=>window.openClicked=true;</script></body></html>`,
  }));
  await page.goto("https://www.pinterest.com/ideas/wrapper-test/");
  await expect(page.locator('[data-test-id="signup-wall"]')).toBeHidden();
  await page.locator("#open").click();
  expect(await page.evaluate(() => window.openClicked)).toBe(true);
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await page.close();
});
