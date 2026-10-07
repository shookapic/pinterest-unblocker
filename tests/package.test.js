import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

const root = new URL("../", import.meta.url);
const domains = JSON.parse(await readFile(new URL("config/domains.json", root), "utf8"));

test("domain allowlist is explicit, unique and Pinterest-only", () => {
  assert.equal(new Set(domains).size, domains.length);
  for (const domain of domains) assert.match(domain, /^pinterest\.[a-z]+(?:\.[a-z]+)?$/);
  for (const domain of ["pinterest.com", "pinterest.fr", "pinterest.co.uk", "pinterest.com.au", "pinterest.jp"]) assert.ok(domains.includes(domain));
});

for (const browser of ["chrome", "firefox"]) {
  test(`${browser} store archive has valid manifest and all referenced files`, async () => {
    const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
    const files = unzipSync(new Uint8Array(await readFile(new URL(`artifacts/pinterest-unblocker-${browser}-${version}.zip`, root))));
    const manifest = JSON.parse(new TextDecoder().decode(files["manifest.json"]));
    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.version, version);
    assert.ok(manifest.description.length <= 132);
    assert.equal(manifest.permissions, undefined);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.content_scripts[0].matches.length, domains.length);
    for (const name of [...Object.values(manifest.icons), manifest.action.default_popup,
      ...manifest.content_scripts[0].js, ...manifest.content_scripts[0].css]) assert.ok(files[name], name);
    for (const [size, name] of Object.entries(manifest.icons)) {
      const bytes = files[name];
      assert.equal(new DataView(bytes.buffer, bytes.byteOffset).getUint32(16), Number(size));
      assert.equal(new DataView(bytes.buffer, bytes.byteOffset).getUint32(20), Number(size));
    }
    assert.ok(Object.keys(files).every((name) => !/node_modules|tests|\.map$/.test(name)));
    if (browser === "firefox") assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ["none"]);
  });
}
