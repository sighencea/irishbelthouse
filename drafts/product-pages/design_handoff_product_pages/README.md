# Handoff: Handcraftbandit — Belt Product Pages (PDP)

## Overview
Product detail pages for the three belts in the Handcraftbandit collection: **The Everyday Belt**, **The Heritage Belt**, and **The Founder's Belt**. They continue the quiet-luxury, story-led brand language of the homepage — gallery → product info/options → craft story → specifications → lifetime-repairs reminder → cross-sell. They are **story-led, not spec-sheets**: copy leads with materials, craft and philosophy, with the dry particulars confined to one tidy list.

A key behavioral distinction:
- **Everyday** and **Heritage** are **made-to-order purchases** → primary action *Add to Bag*.
- **Founder's** is a **numbered, limited (50/year) commission** → primary action *Enquire to Commission*, which opens an inline enquiry form instead of a cart action. This reinforces exclusivity (no straight "buy").

## About the Design Files
These files are **design references in plain HTML/CSS/JS** — a working prototype of look, copy and behavior, **not** production code to ship as-is. Recreate them inside the target codebase's environment (Shopify/Hydrogen, Next.js, Astro, etc.), mapping the hardcoded product data to real product/variant records and the cart/enquiry actions to real commerce + form endpoints. The vanilla CSS ports directly or maps cleanly to Tailwind / an existing design system (tokens are shared with the homepage handoff — see that README's **Design Tokens**, repeated in brief below).

## Fidelity
**High-fidelity (hifi).** Final colors, type, spacing, copy and interactions as intended. Recreate faithfully. The only placeholders are images — every gallery/story image is an intentional gradient frame whose monospace caption is the **photography brief** for that slot.

## Architecture (important)
This is **one template, three products**, driven by a URL query param:

```
Product.html?belt=everyday
Product.html?belt=heritage
Product.html?belt=founders   (defaults to "everyday" if param missing/invalid)
```

- **`Product.html`** is a static shell: nav, breadcrumb, empty containers (by id), and the section scaffolding (story / details / repair band / related), plus footer.
- **`product.js`** holds a `PRODUCTS` data object (all three belts) and, on load, reads `?belt=`, selects the record, and **renders** into the shell's containers — headline, price, gallery, option groups, CTA/flow, assurances, story, specs, and the two cross-sell cards.
- In a real codebase, replace this client-render with server/SSG rendering from your product catalog. The `PRODUCTS` object is effectively the **content model** — see **Data Model** below.

## Page Structure (top → bottom)

### Nav (shared with homepage)
Same fixed bar and mobile drawer as the homepage, but **always in the solid "paper" state** (there is no dark hero here). This is handled in `main.js`: the nav only stays transparent when a `#hero` element exists on the page; otherwise it gets `.scrolled` immediately. All nav/drawer/footer links point back to `Handcraftbandit Homepage.html#<anchor>`.

### 1 · Breadcrumb (`.crumbs`)
`Home / Collection / <Product Name>` — Jost 12px uppercase, 0.18em tracking, Ink-55 with Ink on hover; current item in Ink.

### 2 · Product top (`.pdp-top`, 2-col grid `1.12fr / .88fr`)
**Left — Gallery:**
- `.pdp-hero` main image (aspect **4/5**) + `.thumbs` row of **4** square thumbnails (aspect 1/1, 4-col grid).
- Clicking a thumb swaps the main image's caption + variant (warm/oak) and moves the `.sel` outline. First thumb selected by default.

**Right — Info (`.pinfo`, `position: sticky; top: ~104px`):**
- Eyebrow (e.g. `II · The Heritage`), H1 product name (`clamp(38px,5.4vw,72px)`), italic Brass tagline.
- Price (`.pprice`, Cormorant `clamp(24px,2.4vw,32px)`) + uppercase note (e.g. "Hand stitched · made to order").
- **Option groups** (`.pgroup`), each with a `.glabel` showing the live selection in bold:
  - **Leather** — round color **swatches** (`.swatch`, 32px); selected gets an outer ring. Label updates "Leather — **Black**".
  - **Buckle** — **pills** (`.pill`); selected is filled Ink/Paper. Label updates.
  - **Size** — for buy products, a styled `<select>` (`.psize`, waist inches 28″–44″, **defaults to 34″**). For Founder's, **no select** — a static label "Size — **Measured to you at commission**".
- **CTA block** (`.pcta`, max-width 380px):
  - *buy mode:* full-width primary button **Add to Bag** → on click shows `.pconfirm` ("Added to your bag — <leather · buckle · size> · made to order"); button briefly reads "Added ✓" then reverts after ~2.2s.
  - *enquire mode (Founder's):* primary button **Enquire to Commission** toggles an inline `.eqform` (name / email / optional message) and the button label flips to **Close**. On valid submit (email regex), the form is replaced with a confirmation: "Thank you — we'll be in touch personally about your Founder's Belt commission." and the button hides.
- **Assurances** (`.passure`): 3–4 brass-bulleted lines (hand-stitched / lifetime repairs / lead time / shipping or numbered-and-signed for Founder's).

### 3 · Craft story (`.pstory`, paper-2)
Two-column (image 4/5 + text). Eyebrow "The Craft", H2 headline, 2 narrative paragraphs, and a `.pq` pullquote (italic, 2px Oxblood left border).

### 4 · Specifications (`.pdetails`, paper)
Eyebrow "Specifications" + H2 "The particulars." Then a **2-column definition list** (`.detail-list`): each row `dt` (uppercase label, Ink-55) ↔ `dd` (Cormorant 18px, right-aligned), hairline divider. ~8 rows per belt (Leather, Tannage/Edition, Hardware, Stitch, Width, Thickness/Finishing, Made, Lead time).

### 5 · Repair band (`.repair-band`, oak-900 dark, centered)
Eyebrow "Lifetime Repairs" + H2 "Made to stay with you." + one paragraph + a tlink "Our repair philosophy →" linking to `Handcraftbandit Homepage.html#repairs`.

### 6 · Related (`.related`, paper)
Eyebrow "From the same hands" + H2 "The rest of the collection." + a **2-col grid** of the *other two* belts as `.card`s (reusing the homepage card pattern), each linking to its `Product.html?belt=<slug>`. The CTA text reads "View" for buy products and "Enquire" for Founder's.

### Footer
Identical to the homepage footer; links resolve back to homepage anchors.

## Interactions & Behavior
- **Thumbnail gallery:** click swaps main image content + `.sel` state (client state only; wire to real image set).
- **Leather/Buckle selection:** single-select per group; updates `.glabel` and `state`.
- **Size:** `<select>` updates `state.size` (buy products only).
- **Add to Bag:** shows inline confirmation with the selected variant summary; transient "Added ✓". **No real cart exists** — wire to your commerce add-to-cart and (optionally) a bag drawer.
- **Enquire (Founder's):** toggles inline form; client-side email validation; inline success message. **Wire to a real enquiry endpoint / CRM / email.**
- **Reveals:** `.reveal` / `.stagger` fade-rise via IntersectionObserver (same as homepage), gated on `prefers-reduced-motion`; when reduced, everything shows immediately.
- **Sticky info column** on ≥980px; everything stacks to one column below 980px (`.pinfo` becomes static, gallery hero stays 4/5, details list goes 1-col).

## State Management
Per-page client state (lift into your framework / commerce layer):
- `belt` (from URL → product record)
- `leatherIndex`, `buckleIndex`, `size` (selected variant)
- `confirmShown` (post-add message), Founder's: `enquiryOpen`, `enquirySubmitted`, `emailError`
- gallery `activeImageIndex`
Products, variants (leather × buckle × size), prices, lead times, and edition limits should be **catalog data**, not hardcoded.

## Data Model (the `PRODUCTS` object — your content model)
Each belt record carries:
```
slug            "everyday" | "heritage" | "founders"
eyebrow         numbered label, e.g. "II · The Heritage"
name, crumb     display name / breadcrumb label
tagline         italic one-liner
price, priceNote   "€245", "Hand stitched · made to order"
mode            "buy" | "enquire"
cta             button label
meta            <meta name="description"> text (set per page)
leathers[]      { name, hex }  → swatches
buckles[]       string[]       → pills
sizes[] | sizeNote   waist options (buy) OR static note (commission)
gallery[]       { note, oak? } → main + thumbnails (note = photo brief)
storyImg        { note, oak }
storyHead, storyBody[], storyQuote
details[]       [label, value] pairs → specs list
assure[]        string[] → bulleted assurances
```
`document.title` and the meta description are set per product on render. The three slugs render in fixed `ORDER` for cross-sell.

## Design Tokens (shared with homepage)
Identical token set to the homepage. Key values:
- **Colors:** Paper `#F7F3EC`, Paper-2 `#F0E9DC`, Ink `#1A1A1A` (70%/55% tints), Oxblood `#6A1F1B` (+ `#561714` hover), Brass `#8A6A44` / `#A6855C`, Oak-900 `#16110D`, Cream `#EDE4D6`. Hairlines: `rgba(26,26,26,.13)` on light, `rgba(237,228,214,.16)` on dark.
- **Type:** Cormorant Garamond (display), Jost (body/UI), system mono (placeholder captions only). Google Fonts import same as homepage.
- **Metrics:** container 1280px, side padding `clamp(20px,5.5vw,88px)`, ease `cubic-bezier(.16,1,.3,1)`. Flat/square — no border-radius language except the round leather swatches.
- **Breakpoints:** 980px (stack to 1 col) and 560px (full-width CTA).
- Selected pill = filled Ink/Paper; selected swatch = outer Ink ring; selected thumb = inset Ink outline.

## Assets
**No real images on these pages — all placeholders.** Each gallery/story `.ph` caption is the photography brief. Shots to commission per belt:
- **Everyday:** full length on linen (soft daylight); brass buckle 3/4 detail; keeper & edge detail; rolled to show thickness; cut from a single length (round knife).
- **Heritage:** full length with raking light on the stitch; saddle-stitch close-up; hand-set buckle; burnished edge full length; two-needle saddle-stitch in progress.
- **Founder's:** dramatic low-light with numbered medallion; numbered & signed detail; hand-aged brass buckle; full-grain macro; the maker's bench with the year's finest hide.
(All product images styled at the listed aspect ratios; convert to AVIF/WebP responsive `<picture>` for production.) Fonts load from Google Fonts — self-host for production if preferred.

## SEO
- Per-product `<title>` set on render: `<Belt Name> — Handcraftbandit | Irish Belt House`.
- Per-product `<meta name="description">` set from each record's `meta`.
- Add `Product` structured data (name, brand, offers/price/availability=MadeToOrder or PreOrder; for Founder's, a limited-edition note) and `BreadcrumbList` in production.

## Files
- **`Product.html`** — PDP shell (containers by id; section scaffolding; nav/footer linking to homepage).
- **`product.css`** — PDP-specific layout/components (gallery, options, CTA, enquiry form, specs, repair band, related). Depends on tokens from `styles.css`.
- **`product.js`** — `PRODUCTS` data + render + option/CTA/enquiry logic.
- **`styles.css`** *(shared)* — base design system + tokens (loaded first).
- **`main.js`** *(shared)* — nav solid-on-no-hero, mobile drawer, reveals, footer year.

To preview: open `Product.html?belt=heritage` (or `everyday` / `founders`) in a browser. From the homepage, the Collection cards' **View** (Everyday/Heritage) and **Enquire** (Founder's) links route here.
