# Store listing copy

## Name

Pinterest Unblocker

## Summary

Hide Pinterest login overlays, restore scrolling and native right-click, and save visible images across international domains.

## Description

Browse Pinterest with fewer interruptions.

Pinterest Unblocker hides supported login prompts that cover images, restores scrolling, and brings back the browser's native image right-click menu. Save a visible image by right-clicking it and choosing “Save image as…”.

Features:

- Hide supported login and signup overlays on browsing pages.
- Restore native right-click on images.
- Save visible images using your browser.
- Restore scrolling when a supported login overlay locks the page.
- Handle overlays that appear after navigation or loading more pins.
- Support 27 listed international Pinterest domains, including .com, .fr, .de, .co.uk, .jp, and .com.au.

Runs locally. No tracking, analytics, accounts, remote code, or data collection.

Dedicated login and settings pages remain available. This extension affects content already delivered to your browser; it does not unlock private content or guarantee access when Pinterest requires server-side authentication. Images are saved at the resolution delivered by the site. Pinterest page changes can affect compatibility.

Independent project. Not affiliated with or endorsed by Pinterest.

## Single purpose

Restore unobstructed browsing of already delivered Pinterest images by removing supported login overlays and their related scroll and context-menu restrictions.

## Site access justification

Content scripts run only on listed Pinterest domains. Page access is needed to detect supported login overlays, restore scrolling, and stop image context-menu interception. No unrelated website access is requested.

## Privacy declarations

- No user data is collected or transmitted.
- No user data is sold or shared.
- No remote code is executed.
- No extension API permissions are requested.

## Reviewer notes

Install the extension and reload a logged-out Pinterest browsing page or public pin page on a supported domain. Supported login walls should disappear and scrolling should work. Right-click a visible pin image; the browser's native image menu should appear. Verify that a dedicated /login/ page and unrelated dialogs remain usable. Layouts and availability may vary by region and session.

No account is required by the extension. Test cases and local installation steps are available in the repository.
