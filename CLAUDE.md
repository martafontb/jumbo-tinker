# Shopify Theme Development — Claude Code Guidelines

This file provides frontend best practices and conventions for Claude Code when working on any Shopify theme project. Follow these guidelines unless the project's README or a team member explicitly overrides them.

---

## Project Structure

- Follow the standard Shopify theme directory structure: `assets/`, `config/`, `layout/`, `sections/`, `snippets/`, `templates/`, `locales/`.
- Never create directories outside this structure without explicit justification.
- Keep `layout/theme.liquid` lean — load scripts and styles via `{% render %}` snippets or section includes, not inline.
- Use `templates/` for JSON templates (Online Store 2.0). Avoid `.liquid` templates unless supporting a legacy theme.

---

## Liquid Templating

- Prefer `{% render %}` over `{% include %}`. `render` has a sandboxed scope; `include` leaks parent variables and is deprecated.
- Never use `{% include %}` in new code.
- Keep logic out of templates. Move conditional blocks and loops into snippets.
- Avoid deeply nested Liquid logic (>3 levels). Refactor into named snippets for readability.
- Use `liquid` tag blocks (`{% liquid %}`) to group multiple tags without extra whitespace output.
- Strip whitespace with `{%- -%}` and `{{- -}}` in performance-sensitive areas (loops, large partials).
- Always provide fallback values for variables: `{{ product.title | default: 'Untitled' }}`.
- Never output raw user-controlled data without appropriate filters (e.g., `escape`, `strip_html`).

---

## Sections & Blocks (Online Store 2.0)

- Every merchant-editable area must be a section or a block inside a section.
- Define schema settings (`{% schema %}`) for all configurable content — never hardcode merchant-facing copy.
- Use `presets` in section schemas so sections are available in the Theme Editor.
- Sections must be self-contained and re-renderable in isolation (required by the section rendering API).
- Use `blocks` for repeatable elements (e.g., slides, tabs, FAQ items). Set a reasonable `max_blocks` limit.
- Always define a `name` and `class` in the section schema for Editor discoverability.
- Validate that schema `type` values match Shopify's supported input types (text, richtext, image_picker, url, color, range, select, checkbox, radio, product, collection, etc.).
- App Blocks must be declared in section schemas under `"blocks": [{ "type": "@app" }]` to support app integrations cleanly.

---

## Metafields & Metaobjects (Read-Only in Theme)

- Themes can only **read** metafields — never attempt to write or update them from Liquid or client-side JS.
- Access metafields via `product.metafields.namespace.key` — never construct dynamic metafield keys at runtime.
- Always check for existence before outputting: `{% if product.metafields.custom.tagline != blank %}`.
- Metafield values have a **16 KB per-value cap**. If a value appears truncated, flag it — the fix is on the data/admin side, not in the theme.
- Document every custom metafield namespace and key the theme depends on inside `README.md`, so developers know what needs to be configured in the store.

---

## Performance

- Lazy-load all images below the fold using `loading="lazy"` and Shopify's `image_url` filter with explicit `width` and `height`.
- Always use the `image_url` filter with a `width` parameter — never output raw CDN URLs or hardcoded sizes.
- Use `srcset` for responsive images. Shopify's `image_tag` filter generates srcset automatically.
- Defer non-critical JavaScript with `defer` or `type="module"`.
- Never use `document.write()`.
- Avoid loading third-party scripts in `<head>` — use `async` or move to end of `<body>`.
- Limit the number of section-level `<script>` tags; consolidate theme JS into `assets/`.
- Use `preload` for critical fonts and above-the-fold images.
- Target a Lighthouse performance score ≥ 80 on mobile for all new features.

---

## JavaScript

- Write vanilla JS unless the project already uses a framework. Do not introduce React, Vue, or Alpine.js without team approval.
- Use Web Components or custom elements for encapsulated interactive UI (carousels, modals, accordions). Shopify Dawn uses this pattern.
- Avoid jQuery. It is not included in modern Shopify themes.
- Namespace all global variables and custom events under a project-specific prefix (e.g., `window.ThemeName`).
- Use `CustomEvent` for cross-component communication. Dispatch events on `document` and listen from any component.
- Always use `addEventListener` — never inline `onclick` attributes.
- Handle errors gracefully; wrap Fetch calls and Cart API calls in try/catch with user-visible fallback messaging.

---

## Cart (Client-Side)

- Use the **Cart API** (`/cart/add.js`, `/cart/update.js`, `/cart/change.js`) for all cart mutations — never rely on full-page form submissions where a dynamic cart experience is expected.
- Dispatch Shopify's standard cart events (`cart:refresh`, `cart:updated`) after mutations so other components (mini-cart, header count, etc.) can react without tight coupling.
- Always optimistically update the UI and roll back on API error with a visible message.
- Never redirect to `/checkout` directly from JS — use `window.location` only after a confirmed cart state, or use the standard checkout button.

---

## CSS & Styling

- Use CSS custom properties (variables) for all design tokens: colors, spacing, typography, border-radius.
- Define theme color and font settings in `config/settings_schema.json` and expose them as CSS variables in `layout/theme.liquid`.
- Avoid `!important`. If needed, it indicates a specificity problem — fix the selector instead.
- Do not use inline styles in Liquid templates except for dynamically injected CSS custom properties.
- Scope component styles using a BEM-like convention or web component selectors — avoid broad tag selectors.
- Minify production CSS. Use Shopify CLI's build pipeline or a documented build step.

---

## Localization & Accessibility

- All customer-facing strings must use `{{ 'key' | t }}` translation keys defined in `locales/`.
- Never hardcode English strings in templates — even for single-locale stores.
- Always provide `alt` text for images: use the product/image alt attribute, a metafield setting, or a schema setting fallback. Never leave `alt` empty on meaningful images.
- All interactive elements (buttons, links, modals) must be keyboard accessible and have visible focus styles.
- Use semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<button>`.
- Every form input must have an associated `<label>` (visible or visually hidden via `.visually-hidden`).
- Modals and drawers must trap focus and support `Escape` to close.
- Target WCAG 2.1 AA compliance as a minimum baseline.

---

## Shopify CLI

- Use **Shopify CLI 3.x** (`shopify theme dev`, `shopify theme push`, `shopify theme pull`) for all local development.
- Never push directly to a live theme. Use a development theme or a duplicate.
- Add `config/settings_data.json` to `.gitignore` for team projects unless you have a deliberate sync strategy — it contains live merchant customizations.
- Always include a `.shopifyignore` to prevent pushing files that should not overwrite the remote theme.

---

## Git

- Use **feature branches** for all work. Never commit directly to `main` or `production`. Branch naming convention: `feature/`, `fix/`, `chore/` prefixes (e.g., `feature/product-page-tabs`, `fix/cart-drawer-mobile`).
- Keep commits small and focused — one logical change per commit. Avoid "catch-all" commits that bundle unrelated changes.
- Write commit messages in the imperative mood and reference the area of the theme: `Add sticky header behaviour`, `Fix quantity input on mobile cart`, `Refactor product form into snippet`.
- Open a pull request for every change, even solo projects. PRs create a record of intent and make rollbacks easier to scope.
- Require at least one review approval before merging to `main` on team projects.
- Squash commits on merge to keep the main branch history linear and readable.
- Tag every release on `main` with semantic versioning: `v1.0.0`, `v1.1.0`, `v1.2.0-beta`.
- Never commit secrets, tokens, or credentials. Use environment variables or Shopify CLI's authenticated sessions.
- Keep the following in `.gitignore`: `config/settings_data.json`, `node_modules/`, `.env`, `.DS_Store`, and any build artefact directories.
- Before opening a PR, run `shopify theme check` and resolve all errors so reviewers are not blocked by avoidable issues.

---

## Testing & Quality

- Run `shopify theme check` before every commit and resolve all errors. Treat warnings as errors for new code.
- Validate all schema JSON — malformed schema silently breaks the Theme Editor.
- Test on real Shopify preview URLs, not just `localhost` — cart, redirects, and some Liquid objects behave differently locally.
- Test across: Chrome, Firefox, Safari (desktop + iOS), and Chrome Android.
- Test with a screen reader (VoiceOver on macOS/iOS, NVDA on Windows) for accessibility-critical flows.
- Test Theme Editor functionality: every section must be addable, removable, and reorderable without JS errors.

---

## Documentation

- Every section must have a comment block at the top describing its purpose and any non-obvious schema settings.
- Document all metafield namespaces and keys the theme reads in `README.md`.
- Add inline `{% comment %}` blocks for non-obvious Liquid workarounds explaining the reason.
- Maintain a `CHANGELOG.md` using [Keep a Changelog](https://keepachangelog.com/) format.