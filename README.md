<p align="center">
  <img src="extension/icons/128.png" alt="Pinterest Unblocker" width="80" height="80">
</p>

<h1 align="center">Pinterest Unblocker</h1>

<p align="center">Unobstructed browsing. Native image saving.</p>

<p align="center">
  <a href="https://github.com/shookapic/pinterest-unblocker/actions/workflows/check.yml"><img src="https://github.com/shookapic/pinterest-unblocker/actions/workflows/check.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/shookapic/pinterest-unblocker/releases/latest"><img src="https://img.shields.io/github/v/release/shookapic/pinterest-unblocker?color=173b32" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-173b32" alt="MIT license"></a>
</p>

Pinterest Unblocker is a lightweight Chrome and Firefox extension that removes supported login overlays, restores scrolling, and brings back the browser's image context menu. It runs entirely on your device, with no accounts, analytics, or remote code.

## Features

| Feature | What it does |
| --- | --- |
| Login overlay removal | Hides supported login and signup prompts on browsing pages. |
| Image saving | Enables **Save image as…** through the browser's native menu. |
| Native right-click | Stops Pinterest's image context-menu interception. |
| Unrestricted scrolling | Restores scrolling locked by supported login overlays. |
| Dynamic navigation | Handles newly inserted overlays and single-page navigation. |
| International domains | Covers 27 listed Pinterest domains and their subdomains. |

Dedicated account pages and unrelated dialogs remain available. The domain allowlist is maintained in [config/domains.json](config/domains.json).

## Installation

Download the browser-specific ZIP from the [latest release](https://github.com/shookapic/pinterest-unblocker/releases/latest) and extract it.

**Chrome 109+**

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose the extracted Chrome folder containing `manifest.json`.
3. Reload open Pinterest tabs.

**Firefox 140+ — developer preview**

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on** and choose the extracted Firefox `manifest.json`.
3. Reload open Pinterest tabs.

Firefox's temporary installation lasts until the browser restarts. The GitHub ZIP is not a signed Firefox add-on. Marketplace installations are not currently available.

## Usage

Browse Pinterest as usual. Right-click a visible image and select **Save image as…** to save the version delivered by the site. Disable the extension in the browser's extension manager and reload the page to restore normal site behavior.

## Privacy

No data collection, tracking, extension storage, or background service. Content scripts run only on listed Pinterest domains; help, developer, policy, business, and advertising subdomains are excluded. Image downloads use the browser's built-in command.

Read the [privacy policy](PRIVACY.md).

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm test
```

Browser-specific builds are written to `dist/`; packaged ZIPs are written to `artifacts/`. Runtime code has no bundled dependencies.

```text
extension/       Content scripts, popup, and icons
config/          Pinterest domain allowlist
scripts/         Build and icon-generation tools
tests/           DOM, package, and browser integration tests
docs/            Testing documentation
.github/         CI, release automation, and issue templates
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development checks and [testing documentation](docs/TESTING.md) for coverage. CI validates packages, runs the unit suite, checks the Firefox manifest, and tests the installed extension in Chromium before releasing a new version.

## Support

[Report a bug](https://github.com/shookapic/pinterest-unblocker/issues/new?template=bug_report.yml) with the browser version, Pinterest URL, and reproduction steps. Pinterest layout changes can affect overlay detection.

The extension works with content already delivered to the browser. It does not unlock private boards, bypass server-side authentication, or fetch original-resolution images. Saving an image does not grant rights to reuse it.

## License

[MIT](LICENSE). Independent project; not affiliated with or endorsed by Pinterest.
