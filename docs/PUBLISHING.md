# Publishing

## Release preparation

1. Run `npm ci`, `npm run build`, and `npm test`.
2. Run `npm run test:browser` and `npm run lint:firefox`.
3. Complete the live acceptance checks in [TESTING.md](TESTING.md), on both browsers.
4. Keep the Firefox add-on ID stable: `pinterest-unblocker@shookapic`.
5. Host [PRIVACY.md](../PRIVACY.md) at a public HTTPS URL and use that URL in both listings. The public repository file URL can be used when available. Add the actual support repository URL to each listing.
6. Capture genuine screenshots from the installed extension on public Pinterest pages. Do not submit fixture screenshots as evidence of live-site functionality.

The release ZIPs are generated in `artifacts/`. Source remains readable and unobfuscated, with no runtime dependencies.

## Chrome Web Store

1. Sign in to the [developer dashboard](https://chrome.google.com/webstore/devconsole) using the publisher account. Complete developer registration if needed.
2. Create a new item and upload `artifacts/pinterest-unblocker-chrome-1.0.0.zip`.
3. Fill the listing using [STORE-LISTING.md](STORE-LISTING.md). Supply a support URL, privacy URL, and required listing graphics and screenshots in the dimensions shown by the dashboard.
4. Complete the privacy practices and single-purpose sections. No user data is collected and no remote code is used. Explain Pinterest-only page access.
5. Review the draft and submit it for store review.

See [Chrome's publishing guide](https://developer.chrome.com/docs/webstore/publish) and [listing requirements](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## Firefox Add-ons

1. Sign in to the [Developer Hub](https://addons.mozilla.org/developers/).
2. Submit a new add-on for distribution on addons.mozilla.org and upload `artifacts/pinterest-unblocker-firefox-1.0.0.zip`.
3. Use the listing, privacy URL, and genuine screenshots prepared above. Follow the validator's current requirements.
4. If source is requested, provide the repository source and explain that the build copies readable extension files and generates the manifest and ZIP. It performs no transpilation or minification.
5. Submit for review and signing. Store users receive the signed add-on.

The manifest declares `data_collection_permissions.required: ["none"]` and requires Firefox 140 or newer. See [Mozilla's data-consent documentation](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/) and [submission guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).

## Updates

Change the version in `package.json`, rebuild, rerun the checks, and upload the new browser-specific ZIP to the existing store items. Do not change the Firefox ID. Existing listings, publisher identity, and review approval cannot be created by the build script.
