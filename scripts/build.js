import { readFile, mkdir, cp, writeFile, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { zipSync } from "fflate";

const root = fileURLToPath(new URL("../", import.meta.url));
const domains = JSON.parse(await readFile(path.join(root, "config/domains.json"), "utf8"));
const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const icons = Object.fromEntries([16, 32, 48, 128].map((size) => [size, `icons/${size}.png`]));
const manifest = {
  manifest_version: 3,
  name: "Pinterest Unblocker",
  version,
  description: "Hide Pinterest login overlays, restore scrolling and native right-click, and save visible images across international domains.",
  icons,
  action: { default_title: "Pinterest Unblocker", default_popup: "popup.html", default_icon: icons },
  content_scripts: [{
    matches: domains.map((domain) => `https://*.${domain}/*`),
    js: ["content.js"],
    css: ["content.css"],
    run_at: "document_start",
    exclude_matches: ["https://help.pinterest.com/*", "https://developers.pinterest.com/*", "https://policy.pinterest.com/*", "https://business.pinterest.com/*", "https://ads.pinterest.com/*"],
  }],
};

async function archive(directory, prefix = "") {
  const files = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(files, await archive(path.join(directory, entry.name), `${name}/`));
    else files[name] = new Uint8Array(await readFile(path.join(directory, entry.name)));
  }
  return files;
}

await mkdir(path.join(root, "artifacts"), { recursive: true });
for (const browser of ["chrome", "firefox"]) {
  const target = path.join(root, "dist", browser);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(path.join(root, "extension"), target, { recursive: true });
  await cp(path.join(root, "LICENSE"), path.join(target, "LICENSE"));
  const result = structuredClone(manifest);
  if (browser === "chrome") result.minimum_chrome_version = "109";
  else result.browser_specific_settings = {
    gecko: {
      id: "pinterest-unblocker@shookapic",
      strict_min_version: "140.0",
      data_collection_permissions: { required: ["none"] },
    },
    gecko_android: { strict_min_version: "142.0" },
  };
  await writeFile(path.join(target, "manifest.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(path.join(root, "artifacts", `pinterest-unblocker-${browser}-${version}.zip`), zipSync(await archive(target), { level: 9 }));
  console.log(`Built ${browser} ${version}`);
}
