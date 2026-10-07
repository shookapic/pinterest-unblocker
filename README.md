# Pinterest Unblocker

A small, privacy-focused browser extension that clears login overlays from Pinterest and restores native image browsing.

- Hides supported login and signup overlays on browsing pages.
- Restores the browser's image context menu and **Save image as…**.
- Removes scroll locks associated with those overlays.
- Handles dynamically inserted overlays and single-page navigation.
- Supports 27 explicitly listed international Pinterest domains and their subdomains.
- Keeps dedicated login, registration, settings, and password pages usable.

No analytics, accounts, remote code, background service, or extension API permissions. Site access is limited to the Pinterest domains in [config/domains.json](config/domains.json). Help, policy, developer, business, and advertising subdomains are excluded.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm test
```

The build creates `dist/chrome`, `dist/firefox`, and versioned upload ZIPs in `artifacts/`. ZIPs contain only the extension files and a browser-specific Manifest V3 manifest. Dependencies are development tools; none are bundled into the extension.

## Install locally

**Chrome:** Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/chrome`.

**Firefox:** Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/firefox/manifest.json`. Temporary installations last until Firefox restarts. Firefox 140 or later is required.

Reload any Pinterest tabs that were already open before installation. To pause the extension, disable it in your browser's extension manager and reload the page.

## Save images

Right-click a visible image and choose **Save image as…** in the browser menu. This saves the image supplied by Pinterest at its displayed resolution. The extension does not fetch original-resolution files or provide bulk downloads.

## Verification

`npm test` covers overlay detection, scroll and accessibility restoration, protected account routes, unrelated dialogs, dynamic navigation, native context-menu events, domain scope, and upload archive contents. Build before running the tests.

```sh
npm run test:browser
npm run lint:firefox
```

Browser checks use locally generated test pages on routed Pinterest URLs, including an actual unpacked extension in Chromium. They do not establish compatibility with every current Pinterest layout. See [the manual acceptance checklist](docs/TESTING.md) for live-site testing before submission.

## Store submission

[Publishing instructions](docs/PUBLISHING.md), [listing copy](docs/STORE-LISTING.md), and a [privacy policy](PRIVACY.md) are included. Store review and signing are required before distribution through either marketplace.

## Limitations

Pinterest changes its page structure regularly. Unsupported overlays may need new selectors. The extension changes locally rendered pages; it does not grant access to private boards, bypass server-side authentication, or load content that Pinterest has not delivered. Saving an image does not grant rights to reuse it.

This project is independent of Pinterest and is not endorsed by or affiliated with Pinterest. The icon is original project artwork.

## License

[MIT](LICENSE).
