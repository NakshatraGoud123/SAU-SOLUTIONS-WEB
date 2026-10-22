# SAU SOLUTIONS Website Brief

## 1. PROJECT OVERVIEW

### Website name, purpose, audience
The site brands itself as **SAU SOLUTIONS** and describes the planned consumer platform as **SAU SERVICES**. Its current role is pre-launch information and a preview of a local marketplace for Hyderabad customers, local shops and vendors, service professionals, mechanics, and delivery partners. README.md explicitly says the planned app is pre-launch; the categories are previews and not proof of live availability. The footer tagline is “More time for what matters. A little less to figure out.”

Visitors can read about the platform and its proposed categories, search preview listings, set an area, read partner information, and reach the business by email or WhatsApp. The source also contains account, booking, cart, checkout, tracking, order, and admin screens and Supabase integration. README.md cautions that deployed workflows must be confirmed; checkout is not payment processing. Some legal draft copy currently describes transaction flows inconsistently, so use the app's UI and README as the current state reference.

### Stack and versions
- React 19.2.8, React DOM 19.2.8, TypeScript ~6.0.2.
- Vite 8.3.0 with `@vitejs/plugin-react` 6.1.1; Tailwind CSS 4.3.3 and `@tailwindcss/vite` 4.3.3 are installed.
- React Router DOM 7.18.4; Supabase JS 2.117.3; Framer Motion 14.0.0; GSAP 3.15.0; Three.js 0.186.1; Lucide React 1.52.0.
- GitHub Actions workflow `.github/workflows/*` builds and deploys GitHub Pages on pushes to `main` and manual dispatch. README says custom domain `sausolution.com` and Pages settings still need to be configured. Package also has `gh-pages` scripts.

### Structure and key files
- `src/main.tsx`: React entry point; `src/App.tsx`: providers, router, lazy-loaded routes, shared Navbar/Footer and route transitions.
- `src/pages/`: route views: Home, About, AppComingSoon, Careers, Categories, CategoryServices, ServiceDetails, Booking, Cart, Checkout, Orders, Products, Tracking, Auth, Profile, PartnerRegistration, Contact, ServiceArea, WhatWeOffer, Admin.
- `src/components/`: Navbar, Footer, Hero, cards, WhatsAppButton, IconGlyph, PhotoImage, NeighborhoodExperience and its styles/copy.
- `src/context/`: preferences, catalog, and commerce providers/hooks. `src/services/`: Supabase service modules for catalog, cart, bookings, auth, admin, address, orders, notifications, categories, products, partners, profiles, reviews, and services. `src/lib/supabase.ts` validates public env credentials before client creation.
- `src/data/`: sample catalog, categories, commerce types, image manifest. `src/assets/`: local images (categories, services, products, illustrations) and starter Vite/React SVGs.
- `src/index.css`, `src/App.css`: global theme and app styles. `index.html`: SEO metadata, theme bootstrap, favicon, React entry.
- `public/`: `favicon.svg`, `icons.svg`, `robots.txt`, `sitemap.xml`, `404.html`. `seo-routes.json` and `scripts/create-pages-fallback.mjs` support route prerender/Pages fallback.
- `supabase/schema.sql`, `seed.sql`, `migrations/001_marketplace_backend.sql`, `MIGRATION-PREFLIGHT.md`, and `proposals/PARTNER-APPROVAL.md`: database setup, seed/demo data and migration guidance. `docs/legal-review/PRIVACY-DRAFT.md`, `TERMS-DRAFT.md`: explicitly internal drafts.
- Root also contains configs (`package.json`, lockfile, `vite.config.ts`, TypeScript configs, `eslint.config.js`, `.gitignore`), `.env.example`, and README. `sau-services/` and `sau-services-web/` are nested Vite app copies with their own package/config and basic starter files. Root package is the main project evidenced by the root scripts, current richer `src/`, Supabase and workflow.
- `node_modules/` and `dist/` are installed/generated output, not hand-authored app sources; the brief focuses on the root app's authored project files. `.env.local` exists but is machine-specific and its values are intentionally not reproduced.

### Run locally
Requirements: Node.js and npm. From the root: `npm ci`, then `npm run dev`. Supabase-dependent flows require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`; `.env.example` documents the variable names. `npm run build` compiles and builds; `npm run lint` runs ESLint. README notes local development uses `/SAU-SOLUTIONS-WEB/` while production build uses `/` for the custom domain.

## 2. PAGES AND SECTIONS

Shared on every route: sticky brand header, route content, then footer. Header links are “Home”, “About Us”, “Explore Services”, “Become a Partner”, “Contact”; controls include location, theme, cart, “Log in”/“Profile”, and “Get started”/“Explore SAU”. Footer groups are Explore, Company, and The details, plus email and Explore SAU CTA.

Routes in `src/App.tsx` (in declared order):
1. `/` Home. Hero (see Hero component; eyebrow, headline, explanatory copy, location/category search, popular search chips and proof cue); “SAU SOLUTIONS PLATFORM” / “Everyday needs, in one place.” with cards “Local services”, “Product categories”, “Partner information”; “HERE FOR YOUR EVERYDAY” / “One place for all the things.” category cards; “CATALOG PREVIEW” / “Explore the planned services.” service cards; “HOW TO EXPLORE SAU” / “Find your way around SAU.” with Explore categories, Review details, Continue where available steps; partner promo “Tell us what you bring to SAU.”; app promo “A local platform in development.”; “OUR VISION” / “Useful services, closer to home.” and pre-launch callout; final “A BETTER KIND OF EVERYDAY” CTA “Everything you need. One platform.”
2. `/about` About. “Connecting local needs with local know-how.”; mission statement; “Make local discovery feel more connected.”; vision section “A useful local network, built around people.”; Mission, Vision, How it works cards; “THE PLATFORM JOURNEY” / “Simple steps toward local connection.”; app pre-launch note and links “SAU SERVICES app information”, “What We Offer”, “Partner interest”.
3. `/app-coming-soon` AppComingSoon. “The app is in pre-launch.”, explanatory pre-launch message, “Explore category previews”, “Contact SAU Solutions”. Wildcard unknown route uses the same page in not-found mode: “Page not found.”, “Go to homepage”, contact link.
4. `/careers` Careers. “Help shape a more connected local future.”; “No current openings.”; “Future team opportunities.” employment-interest cards; “Local partners, working independently.” partner types; enquiry note and Contact options.
5. `/categories` Categories. “Find your kind of help.”; “Browse thoughtful services and everyday essentials, all in one place.”; search input placeholder “Try ‘home cleaning’ or ‘groceries’”; category grid or “SEARCH RESULTS” / “Here’s what we found”, service results, and “No matches just yet” empty state.
6. `/category/:categoryId` and `/categories/:categorySlug` CategoryServices. Category name/description, search within category, “Popular right now”/“Matching for you”, sort by Recommended, Top rated, Price: low to high, Price: high to low; service cards, empty state; related categories “There’s more to discover.”
7. `/service/:serviceId` and `/services/:serviceId` ServiceDetails. Listing image/details, kind, price/rating/availability and relevant action. Exact dynamic listing text comes from `src/data/services.ts` or live catalog; no single fixed title.
8. `/booking` Booking. “Request a service”; preferred date and time slots, saved/new address form, summary and “Submit booking request”; booking must be confirmed. Invalid/non-professional service gives “Choose a professional service first.”
9. `/cart` Cart. “Your bag”; product lines, quantities/removal, summary, “Continue to checkout”; empty state “Your bag is taking a breather.”
10. `/checkout` Checkout. “PRE-LAUNCH ORDER REQUEST” / “Delivery details”; address/order details and order request submission. UI states submission does not confirm availability or delivery; no payment collection.
11. `/orders` Orders. Customer order history/status view; authentication required states as applicable.
12. `/products` Products. Product-category/listing view driven by catalog; dynamic listing cards.
13. `/tracking` Tracking. Tracking/status view for orders; data availability depends on account/backend.
14. `/login` Auth login; `/register` Auth registration. Heading “Good to see you again.” / “Make everyday easier.”, or partner variant “Bring your work to SAU.”; fields Email address and Password, registration adds Your name; password minimum 8; Forgot password and account-switch links.
15. `/profile` Profile. Signed-in profile/account and saved details; sign-in required if anonymous.
16. `/partner/register` PartnerRegistration. Partner onboarding/interest fields and explanatory partner copy; account creation path is also supported through partner auth mode.
17. `/contact` Contact. “Questions about SAU SERVICES?”; general enquiry explanation; email and “Chat with us on WhatsApp”; shortcuts to customer app information and partner information.
18. `/service-area` ServiceArea. “Local focus, pre-launch.”; “Himayatnagar, Hyderabad” as a possible pilot area, explicitly not live coverage; app and contact links.
19. `/what-we-offer` WhatWeOffer. “Local essentials and services, in one place.”; nine offering cards: Local shops and vendors, Grocery and daily essentials, Fruits and vegetables, Milk and dairy, Pharmacy and healthcare products, Restaurants and food businesses, Mechanics and repair services, Home and personal services, Delivery-partner opportunities; service-area disclaimer.
20. `/admin` Admin. Restricted dashboard: administrator sign-in/access error states; authorized view “Platform overview”, live counts, “Recent bookings”, “Recent product orders”, refresh action.
21. Any other URL: wildcard AppComingSoon notFound state.

Catalog data includes 16 category names: Essential Supplies, Home Services, Mechanic Services, Mobility Services, Residential Services, Property & Lifestyle, Home Essentials, Food & Beverages, Education, Business & Professional, Home & Lifestyle, Tech Services, Men's Grooming, Women's Beauty, Healthcare & Pharmacy, More Services. `src/data/services.ts` has seeded examples with INR prices and preview ratings/ETA; examples include Home cleaning, City ride, Airport transfer, One-to-one maths tutor, Pharmacy essentials, and Friendly pet care. They should be understood as sample preview content as the UI says availability is unconfirmed.

## 3. UI DESIGN SYSTEM

- Typeface: Manrope imported from Google Fonts (weights 400, 500, 600, 700, 800). Base is 16px browser default at weight 400. Header links 13px/600; eyebrow/kicker generally 10px/700 with letter spacing; hero headline clamp(40px, 5.2vw, 61px), weight 700, line-height 1.11; button labels typically 13px/700. Body examples 15px and 1.75 line height.
- Core light colors in `src/index.css`: navy `#0f172a`, muted `#64748b`, blue `#2563eb`, blue-dark `#1d4ed8`, violet `#7c3aed`, pale `#eef3fb`, teal `#19a99a`, orchid `#b55ad2`, page `#f7f9fc`; white translucent surfaces. Component CSS also uses accents such as `#3568ee`, `#18243a`, `#f8faff`, greens and category-specific tones.
- Dark theme vars: navy `#eff6ff`, muted `#aab8cc`, blue `#3b82f6`, blue-dark `#2563eb`, violet `#a78bfa`, pale `#17243a`, page `#0b1220`, surface `rgba(19,33,54,.96)`. Theme is stored as `sau-theme-v1`; initial theme follows saved choice or OS preference. A notable implementation check: some component styles use hard-coded light colors, so confirm those in dark mode visually.
- Layout: `.container` max 1160px, width `min(1160px, calc(100% - 64px))`; desktop header height 82px and sticky. Cards use soft borders, white surfaces, rounded corners, and diffuse shadows. Hero market-preview card has 23px radius and layered shadow. Buttons are pill-ish/rounded 9px, primary blue with subtle shadow, 45px min height; hover lift 2px. Search panel 13px radius. Component CSS defines additional exact values.
- Header includes a custom three-bar skewed blue/violet mark and “SAU SOLUTIONS” wordmark; iconography from Lucide React. Cards and controls often use rounded icon badges. Footer is multi-column with brand, link groups and CTA panel.
- Light/dark theme supported; toggle in navbar.
- Image map in `src/data/imageCatalog.ts`: hero `hero-everyday-life.webp`; category webps for all 16 categories; product images `daily-grocery-box.webp`, `drinking-water.webp`, `home-organiser.webp`, `stationery-set.webp`, `fresh-meal.webp`, `coffee-break.webp`, `mens-grooming.webp`, `pharmacy-essentials.webp`; service images such as `home-cleaning.webp`, `electrician.webp`, `plumber.webp`, `car-service.webp`, `bike-repair.webp`, `city-ride.webp`, `airport-transfer.webp`, `home-sanitisation.webp`, `pest-control.webp`, `property-consult.webp`, `moving-help.webp`, `math-tutor.webp`, `language-lessons.webp`, `tax-consult.webp`, `design-consult.webp`, `laundry-care.webp`, `plant-care.webp`, `device-setup.webp`, `wifi-help.webp`, `mens-haircut.webp`, `beauty-at-home.webp`, `wellness-session.webp`, `nurse-visit.webp`, `event-help.webp`, `pet-care.webp`. Descriptive alt strings are defined in the image catalog. `src/assets/hero.png`, vite.svg and react.svg are also present; whether starter graphics appear in the root app is not established. Favicon is `public/favicon.svg`; `public/icons.svg` sprite exists.

## 4. UX AND INTERACTIONS

- Header is sticky, with desktop links and responsive menu toggle. Current page link is styled active. Mobile menu closes after a nav choice. Smooth document scrolling is enabled globally, with scroll padding.
- Location popover supports area/city text search and explicit “Use My Current Location”. Text search sends query to OpenStreetMap Nominatim; GPS is requested only after user action and reverse-geocoded. Saved location label/coordinates live in browser localStorage key `sau-location-v1`. Errors cover permission denied, timeout, unavailable location and no search results.
- Theme toggle switches light/dark, saves to `sau-theme-v1`, initially follows OS preference.
- Hero/category search filters catalog; popular chips can seed search. Category listing search updates results; category page supports four sorts listed above. Cards link to detail pages. Product cards feed cart; professional services lead to booking.
- Cart quantity controls increment/decrement and remove items. Checkout collects delivery details, then creates a pending order request where backend is configured; there is no payment provider or payment verification. Booking requests capture chosen date/time and address. Status and order/booking history require authenticated Supabase-backed account.
- Auth: email/password registration and login, reset password action; session persistence/refresh with Supabase PKCE. Partner registration captures business/provider interest and may upload an avatar via Supabase storage as implemented in its page/service.
- Admin route checks account role, displays access-required/unauthorized/error states; authorized dashboard can refresh counts and recent booking/order data.
- Motion: route transition opacity plus vertical movement, 0.18 sec ease-out (0.01 sec for reduced-motion); page loading dots bounce at 0.8 sec with stagger .15/.3 sec; home category cards fade/slide in at viewport with .3 sec and small stagger; step cards animate in horizontally with .12 sec stagger; hero card hover rotates/lifts over .35 sec; buttons hover lift/transition .2 sec. Global reduced-motion CSS nearly disables animation/transition and smooth scrolling.
- Contact links are `mailto:Sausolution.support@gmail.com`; WhatsApp URL uses `919963182721` and prefilled “Hello SAU SOLUTIONS, I would like to know more about your services.” No website contact form. Footer legal labels open email enquiries, not legal pages.

## 5. RESPONSIVENESS AND ACCESSIBILITY

`src/App.css` contains media queries for responsive layout (inspect exact selectors there); the layout is designed to collapse grids/navigation and expose a mobile menu. Global width supports minimum 320px. Explicit breakpoint values across all individual CSS blocks are not inventoried in this summary; source stylesheet is authoritative. Keyboard focus has global `:focus-visible` 3px violet outline with 3px offset. Buttons/links generally use semantic elements; forms use labels, required attributes, input types, autocomplete, radio fieldsets/legends and status/alert roles. Image alts are supplied via image catalog; decorative art uses `aria-hidden`. Navbar/menu controls include aria-label/expanded/controls. Reduced motion is handled both in CSS and route animation logic. Check modal/popover focus management and dark-theme contrast during QA; no evidence of a full automated accessibility audit.

## 6. CONTENT AND DATA

- Email: `Sausolution.support@gmail.com`.
- WhatsApp: `+91 99631 82721` (link encoded as `919963182721`).
- Address: Not present as business contact details. Himayatnagar, Hyderabad appears only as a possible, unconfirmed pilot area.
- Social media links: Not present.
- Legal routes/pages: Not present. Privacy and terms are internal drafts under `docs/legal-review/`; footer “Privacy enquiries” and “Terms enquiries” are mailto links.
- Placeholder/sample content: product/service catalog includes illustrative prices, ratings and ETA; pre-launch disclaimer says no provider or service availability is confirmed. App launch target mentioned in README/legal drafts is 16 October 2026 and explicitly not guaranteed. Supabase seed data should be treated as sample. `.env.example` has placeholder credentials. Legal drafts contain `[REVIEW REQUIRED: ...]` placeholders and must not be presented as published policy.

## 7. INTEGRATIONS AND SETTINGS

- Supabase backend for catalog, auth/profile, partner, saved addresses, bookings, cart, orders, notifications/admin; SQL schema and migration define tables, policies, functions and triggers. Supabase realtime publication is optionally enabled for bookings/orders/notifications. Storage bucket `partner-avatars` is configured in migration.
- Environment keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; client rejects secret keys and placeholder values. Current deployment connection status cannot be asserted from source alone.
- OpenStreetMap Nominatim for location search/reverse geocoding.
- Google Fonts external request for Manrope.
- No payment gateway, analytics, or form service identified in the reviewed source.
- SEO in `index.html`: title “SAU SOLUTIONS | Local Services & Vendors in Hyderabad”; description references Hyderabad vendors, professionals and delivery partners; robots index/follow; canonical `https://sausolution.com/`; OG and Twitter metadata; theme-color `#f7f9fc`; favicon `%BASE_URL%favicon.svg`. OG/Twitter image points to `https://sausolution.com/og-image.png`; a matching file is Not present in the listed public assets. `seo-routes.json`, sitemap, robots, prerender script and 404 fallback support indexing/hosting. GitHub Pages custom-domain wiring is described but must be verified in repository settings.

## 8. PROBLEMS AND GAPS

- Pre-launch state is explicit; actual provider coverage, app launch and backend production readiness are unconfirmed.
- The root app has many transaction-oriented routes, while README calls the site pre-launch and says checkout does not collect/verify payments. Internal Terms draft says the current website does not process bookings/orders, which conflicts with source flows/schema; legal wording needs factual review before publication.
- OG and Twitter metadata refer to `og-image.png`, not present in `public/` file inventory.
- No public privacy/terms page; footer labels route to email enquiries. Draft legal files have unresolved mandatory placeholders.
- GitHub Pages workflow makes direct route folders for a subset only (`categories`, `about`, `service-area`, `app-coming-soon`, `contact`, `partner/register`); deeper/dynamic routes rely on fallback/prerender behavior. Confirm deep links after deployment.
- Availability, preview ratings/ETAs and pricing can be read as live claims without the surrounding pre-launch disclaimers; maintain disclaimers wherever catalog data appears.
- Hard-coded light color values within component stylesheet may not adapt fully to dark mode.
- Root includes duplicate nested starter projects `sau-services/`, `sau-services-web/`; clarify whether they are intentionally maintained or archival. Not used by root scripts.
- Analytics and payment integration: Not present. Contact form: Not present. Social links: Not present. No TODO markers were identified in the main reviewed source listing; “Not present” rather than implying an integration.
- All exact mobile breakpoint values and every page's dynamic backend-dependent copy are defined in code and may change based on data/state; this brief lists routes and fixed page copy but cannot list every possible live database row.

## 9. SCREENSHOT-STYLE DESCRIPTION

### Home desktop
A pale blue-white hero fills the width below a glassy sticky header. Left side holds a small capsule eyebrow, large dark Manrope headline with blue emphasis, paragraph, wide white search control and chips/proof text. Right side is a layered marketplace/map illustration in a floating tilted card. Below, centered max-width sections alternate white/pale backgrounds: three platform cards, a photo category grid, service listing cards, a dark/how-it-works step section, side-by-side partner/app promotional panels, a vision callout, and a prominent colored CTA panel with orbit artwork. Footer is dark/contrasting multi-column.

### Home mobile
Header condenses to wordmark and menu button; navigation becomes a collapsible panel and controls are rearranged/hidden as CSS specifies. Hero stacks text above visual; search control and chips wrap to fit narrow width. Category and service grids reduce columns, steps stack, partner/app panels become vertical, and CTA artwork is repositioned or reduced. At 320px the global layout permits scrolling without a narrower viewport, though fine overflow should be checked.

### Shared interior pages
Interior pages use a centered 1160px content column, small uppercase blue/gray section labels, large dark headings with occasional blue-highlighted words, rounded white cards, subtle gray borders and soft shadows. Search/list pages place a pale page hero above category/service grids, then responsive cards with imagery, price and badges. Forms use clearly labeled stacked/grouped fields and a separate summary card on wide screens; narrow screens stack form and summary. Empty/error states use centered icon, concise heading and CTA.

### Contact, partner and information screens
Contact is a spacious centered heading followed by a support card with email and WhatsApp buttons and two link shortcuts. About, Careers, What We Offer and Service Area use editorial headings, explanatory text, grids of icon cards and a callout/disclaimer. Their mobile versions stack cards and actions in a single column.

### Account and transaction screens
Login/registration use a focused card layout with brand accent, explanatory heading, labeled fields and full-width submit/button actions. Booking/checkout/cart use a two-column form-and-summary arrangement at desktop, becoming a single column on mobile. Product rows include image, quantity controls and remove icon. Admin uses dashboard panels for counts and recent records, with explicit empty, loading, error, and access-denied cards.

### Dark mode
The overall canvas becomes deep navy (`#0b1220`), panels become dark blue-gray, body text becomes pale, and blue/violet accents brighten. The persistent theme control is in the header. Hard-coded pale/white component surfaces could remain light in some areas, so screenshot parity in dark mode should be verified.
