# Acceptance checks

## Automated

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run lint:firefox
```

The unit suite uses DOM fixtures. Browser tests use a routed local fixture, and Chromium loads the built unpacked extension. Fixtures test mechanics and regressions; they cannot prove compatibility with every deployed Pinterest layout.

## Live Chrome and Firefox

Use a logged-out browser profile. Load the built extension using the README instructions. Test public pages that actually deliver images and a login overlay.

- Visit public pin, board, and search pages. Confirm supported overlays are hidden and images remain visible.
- Scroll past the first screen. Confirm the page moves and no overlay blocks image interaction.
- Right-click a visible image. Confirm the browser's image menu contains **Save image as…**, save a file, and open it to verify the image.
- Open another pin without a full page reload. Repeat the overlay, scroll, and right-click checks.
- Trigger a delayed overlay. Confirm it is handled without reloading.
- Visit /login/ and /signup/ intentionally. Confirm the forms remain available.
- Open share or report dialogs. Confirm they remain usable and retain normal scroll behavior.
- Test several domains from `config/domains.json`, including .com, .fr, .de, .co.uk, and .jp where those sites are available.
- Visit a non-Pinterest site. Confirm no content script or page changes appear there.
- Disable the extension and reload. Confirm normal site behavior returns.
- Check browser developer tools for extension errors and unexpected network activity.

Record browser versions, exact URLs, dates, and any unsupported layout when reporting results. Do not infer full domain coverage from a successful test on one domain.
