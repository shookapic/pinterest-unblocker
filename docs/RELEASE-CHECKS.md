# 1.0.0 verification record

Date: October 7, 2026

- Chrome and Firefox Manifest V3 packages built successfully.
- DOM and archive checks passed locally with Node.js 22.23.2.
- The upload archives contain only extension files, manifest, and license.
- Chromium extension integration tests are included but could not run locally: the environment rejected browser test process creation with `spawn EPERM`.
- Firefox store lint could not run locally: the validator package was unavailable in the local package cache and registry downloads were blocked.
- Live Pinterest acceptance checks have not been completed. The automated page fetch received HTTP 403.
- Store screenshots, listing URLs, publisher account submission, and marketplace review are pending.

Run the remaining checks in an environment with browser process access and network access before submitting to either store. This record is not a claim of store approval or universal live-site compatibility.
