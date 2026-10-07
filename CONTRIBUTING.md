# Contributing

Focused bug reports and pull requests are welcome. Keep changes scoped to Pinterest browsing, preserve dedicated account pages, and avoid adding permissions or external requests without a demonstrated need.

## Local setup

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm test
npm run lint:firefox
npx playwright install chromium
npm run test:browser
```

On Linux, use `npx playwright install --with-deps chromium` to install browser dependencies. Browser checks load the unpacked extension into an isolated Chromium profile and route test URLs to local fixtures.

## Changes

- Add a regression test for a behavior change.
- Keep runtime code readable and dependency-free.
- Use the domain allowlist for host changes; do not request access to unrelated sites.
- Preserve the Firefox add-on ID.
- Update `package.json` and the lockfile version for a new extension release.
- Include the problem, resulting behavior, and relevant validation in pull requests.

Generated builds, packages, dependency directories, and test output must remain untracked. CI must pass before merging.

## Reports

Use the bug-report template for browser versions, exact reproduction steps, and affected public URLs. Avoid posting account credentials or private board content. See [SECURITY.md](SECURITY.md) for vulnerability reporting.
