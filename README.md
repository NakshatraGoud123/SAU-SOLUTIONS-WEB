# SAU SOLUTIONS website

Pre-launch website for SAU SOLUTIONS and the planned SAU SERVICES customer app. The codebase includes Supabase-backed catalog, account, booking-request, cart, and pending product-order flows when configured. Checkout does not collect or verify payments, and production availability of those workflows must be confirmed against the deployed Supabase project.

## Local development

Requirements: Node.js and npm.

```sh
npm ci
npm run dev
```

## Build and checks

```sh
npm run build
npm run lint
```

The production build uses the root path for the `sausolution.com` custom domain; local development uses the repository subpath `/SAU-SOLUTIONS-WEB/`. The build creates `dist/404.html` and prerenders the public routes listed in `seo-routes.json`. The GitHub Pages workflow uploads `dist`; the repository's Pages and custom-domain settings must still be configured in GitHub.

## Launch messaging

16 October 2026 is a target date only, not a confirmed release date. Do not present it as a guaranteed launch date.

## Legal page drafts

Drafts in `docs/legal-review/` are internal review material. They are not connected to the application routes or footer and must not be published until the factual placeholders are resolved and the wording is reviewed.
