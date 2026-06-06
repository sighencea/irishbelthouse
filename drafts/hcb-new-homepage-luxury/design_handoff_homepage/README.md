# Handoff: Handcraftbandit — Homepage

## Overview
A single-page marketing homepage for **Handcraftbandit**, an Irish leather belt house in Midleton, County Cork. The page is a "quiet-luxury" brand experience (think Hermès / Brunello Cucinelli / a private whiskey house), **not** an ecommerce catalogue. Its job, in order of priority, is to (1) establish luxury positioning, (2) make belts the hero product, and (3) build trust through founder story and craftsmanship — *before* asking anyone to shop.

It is a long vertical scroll of 10 sections + footer, with cinematic dark-oak/whiskey hero, generous whitespace, scroll-reveal animations, hero parallax, a mobile nav drawer, and an email-capture form.

## About the Design Files
The files in this bundle are **design references created in plain HTML/CSS/JS** — a working prototype that demonstrates the intended look, copy, layout, and behavior. They are **not** production code to ship as-is.

The task is to **recreate this design inside the target codebase's existing environment** using its established conventions:
- If the site will be a **Shopify / Next.js / Astro / Hydrogen / WordPress** build, rebuild these sections as components in that stack, mapping the products and journal entries to real CMS/commerce data.
- If **no codebase exists yet**, choose an appropriate stack for a content-led, SEO-sensitive marketing site (Astro or Next.js are both good fits) and implement there.
- The vanilla CSS here can be ported directly, translated to Tailwind, or mapped to an existing design system — see **Design Tokens** below, which doubles as a Tailwind theme config.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions are all intended as shipped. Recreate pixel-faithfully. The only placeholders are images (see **Assets**) — every non-hero image is an intentional gradient placeholder carrying a monospace note describing the photograph to commission.

---

## Global System

### Layout shell
- Content max-width container (`.wrap`): **1280px**, centered, with horizontal padding `clamp(20px, 5.5vw, 88px)`.
- Section vertical rhythm (`.section`): padding-block `clamp(72px, 11vw, 168px)`.
- Three background grounds, warm family, used to create rhythm:
  - **Paper** `#F7F3EC` (default)
  - **Paper-2** `#F0E9DC` (alternating sections: Collection, Workshop, Leather Goods, Signup)
  - **Oak-900** `#16110D` (immersive dark: Hero, Lifetime Repairs, Footer)

### Typography
- **Display / headings:** *Cormorant Garamond* (Google Fonts), weights 400/500/600 + italics. High-contrast luxury serif.
- **Body / UI / labels:** *Jost* (Google Fonts), weights 300/400/500.
- **Monospace** (placeholder captions only): system mono stack `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`.
- Google Fonts import:
  `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap`

Type roles:
| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| H1 (hero) | Cormorant Garamond | `clamp(54px, 11vw, 142px)` | 500 | line-height 1.02, letter-spacing -0.012em |
| H2 (section) | Cormorant Garamond | `clamp(33px, 5.4vw, 70px)` | 500 | line-height 1.05 |
| Statement (philosophy) | Cormorant Garamond | `clamp(30px, 4.4vw, 58px)` | 500 | italic `<em>` colored Brass |
| H3 (cards/articles) | Cormorant Garamond | `clamp(24px, 2.6vw, 36px)` | 500 | |
| Lede | Cormorant Garamond | `clamp(20px, 2.1vw, 28px)` | 400 | color Ink-70, max-width 34ch |
| Body | Jost | `clamp(15px, .55vw+13px, 17.5px)` | 300 | line-height 1.78, max-width 62ch, color Ink-70 |
| Eyebrow | Jost | 12px | 500 | uppercase, letter-spacing 0.34em, color Brass, preceded by a 34px×1px brass rule |
| Button / nav / tlink | Jost | 12.5px | 500 | uppercase, letter-spacing ~0.2em |
| Placeholder caption | mono | 10.5px | — | uppercase, letter-spacing 0.08em |

### Buttons (`.btn`)
- Padding `1.15em 2.1em`, 1px border, uppercase 12.5px / 0.2em tracking, `white-space:nowrap`.
- Transition all relevant props `0.5s cubic-bezier(.16,1,.3,1)`; hover lifts `translateY(-2px)`.
- **Primary:** background Oxblood `#6A1F1B`, text Paper; hover background `#561714`.
- **Ghost (on light):** transparent, border `rgba(26,26,26,.13)`, text Ink; hover border Ink.
- **Ghost-light (on dark/hero):** transparent, border `rgba(237,228,214,.16)`, text Cream; hover border Cream.
- `.btn--arrow` appends a `→` that slides +5px on hover.

### Text link (`.tlink`)
Uppercase 12.5px label with a left-origin underline that scales from 0→1 on hover (`transform:scaleX`), plus a `→` that nudges +5px.

### Image placeholders (`.ph`)
Every non-hero image is a warm gradient frame with a bottom-left monospace caption describing the shot to commission. Two variants:
- **`.ph--warm`** — light tan, layered radial highlights (brass + faint oxblood) over a `#EFE6D6→#D8C6A8` diagonal.
- **`.ph--oak`** — dark whiskey-lit: amber radial highlight + oxblood radial over `#2A1F16→#120C08`.
Both carry a subtle diagonal hairline texture overlay. **In production, replace each `.ph` with a real `<img>`/`<picture>`** using the aspect-ratio noted per section.

---

## Sections / Views

> Order top→bottom. Each section id is the anchor target used by the nav.

### Nav (`#nav`, fixed)
- Fixed top bar, flex space-between: left wordmark `Handcraft**bandit**` (Jost 14px, 0.32em tracking, uppercase; "bandit" weight 600); right inline nav links + a bordered "Journal List" CTA pill.
- **Transparent over hero** (cream text), transitions to **paper glass** (`rgba(247,243,236,.92)` + blur, ink text, bottom hairline) once `scrollY > 62vh` — JS toggles `.scrolled`.
- Links: Collection / Story / Workshop / Repairs / Journal. Center-origin underline on hover.
- **≤980px:** links hidden, a "Menu" button appears → opens full-screen **drawer** (`#drawer`, oak-900, Cormorant links `clamp(30px,9vw,46px)`), slides down via `translateY(-100%)→0`, locks body scroll, closes on link click / Close button / Esc.

### 1 · Hero (`#hero`, dark, min-height 100svh)
- **Background:** full-bleed photograph (`assets/hero.png`) `center / cover`, inside `.hero__bg` which is over-inset and scaled for **parallax** (JS translates Y by `scrollY * 0.18` + `scale(1.06)`).
- **Scrim** (`.hero__vignette`): left→right darkening so left-aligned text stays legible —
  `linear-gradient(96deg, rgba(8,5,3,.90) 0%, .66 32%, .22 56%, 0 78%)` + bottom fade + radial vignette. On ≤760px the scrim becomes a vertical top/bottom gradient and background-position shifts to `62% center` to keep belt + crate framed.
- **Content** (left-aligned, vertically centered, `.wrap`): eyebrow `MIDLETON · COUNTY CORK · IRELAND`; H1 `Handcraftbandit`; italic Cormorant sub `Irish Belt House` (Brass-light); support paragraph (max 46ch); tagline in italic Cormorant with a left brass border: *"Built to be repaired. Not replaced."*; actions row.
- **CTAs:** Primary `DISCOVER IRISH BELT MAKING` (→ `#collection`), Ghost-light `OUR STORY` (→ `#maker`).
- **Scroll cue** bottom-center: "Scroll" + a 46px vertical brass-gradient line that pulses (scaleY) unless reduced-motion.

### 2 · Philosophy (`#philosophy`, paper)
Two-column grid `1.05fr / .95fr`, gap `clamp(36px,6vw,90px)`, vertically centered. Left: eyebrow "Our Philosophy", statement headline *"In a world of disposable fashion, we make objects worth keeping."* (italic "worth keeping" in Brass), 3 body paragraphs (slow craft / single-length veg-tan / patina-not-obsolescence). Right: `.ph--warm`, aspect 4/5, caption "hands stitching leather". Collapses to 1 column ≤980px (image becomes 16/11).

### 3 · The Collection (`#collection`, paper-2)
- Head row (`.coll-head`, space-between, wraps): left = eyebrow "The Collection" + H2 *"Three belts. **A lifetime each.**"*; right = lede "Not a catalogue — a considered range…".
- **3-column card grid** (`.coll-grid`, gap `clamp(24px,3vw,46px)`), `.stagger` reveal. Each `.card`:
  - `.card__media` aspect **3/4**, `.ph` scales to 1.025 on card hover.
  - `.card__no` mono numeral (Brass; Oxblood on flagship).
  - H3 title, body paragraph (story/materials, **not** spec lists).
  - `.card__foot` (top hairline, space-between): price block (Cormorant 20px + small uppercase sub) + a `View/Enquire` tlink.
  - Cards: **I · Everyday** (`From €145` · Made to order), **II · Heritage** (`From €245` · Hand stitched), **III · Founder's** (`From €480` · Limited to 50/year, `.ph--oak`, `.card--flagship`).
- 1 column ≤980px (max-width 460px).

### 4 · The Maker's Story (`#maker`, paper)
Two-column `1fr/1fr`. Left: `.ph--oak` aspect 4/5 ("founder at the bench"). Right: eyebrow "The Maker's Story", H2 *"A craft learned in Kinsale. A philosophy carried forward in Midleton."*, 2 story paragraphs (Romanian craftsman in Ireland; learned from uncle Dan in Kinsale; preserving disappearing hand skills), then a **pullquote** (`.pullquote`, italic Cormorant `clamp(24px,2.8vw,36px)`, 2px Oxblood left border): *"We do not create seasonal fashion. We create future heirlooms."* Collapses ≤980px.

### 5 · The Workshop (`#workshop`, paper-2)
Centered head (eyebrow + H2 *"Every piece passes through human hands."* + body, max 680px). Below: a **6-column CSS-grid mosaic** (`.ws-grid`, `grid-auto-rows: minmax(120px,auto)`):
- g1 = span 4 cols × 2 rows (leather cutting, warm)
- g2 = span 2 (hand stitching, oak)
- g3 = span 2 (edge finishing, warm)
- g4 = span 2 (traditional tools, warm)
- g5 = span 4 (Italian leather, oak)
On ≤980px collapses to 2 columns (g1 becomes 16/10, g5 spans 2).

### 6 · Lifetime Repairs (`#repairs`, **oak-900 dark**, `.on-dark`)
Two-column `1fr/1fr`. Left: eyebrow "Lifetime Repairs", H2 *"Made to stay **with you**."* (italic Brass emphasis), 2 paragraphs (bring it back / restore not replace; "this is the whole point"), then a `.seal` line — mono Brass-light "Restore · don't replace" with a 30px brass rule. Right: `.ph--oak` aspect 5/4 ("well-worn belt, patina"). This is a deliberate brand pillar — keep it prominent.

### 7 · Limited Production (`#limited`, paper, centered)
Centered column (max 760px): eyebrow "Limited Production", H2 *"Craftsmanship cannot be rushed."*, body paragraph (quality doesn't scale). Then a **giant numeral** `.bignum` = `50` (Cormorant `clamp(120px,22vw,300px)`, Oxblood, line-height .9), with `.bignum-cap` below: "Founder's Belts made each year — numbered, signed, and never repeated". **No countdowns, no urgency.**

### 8 · The Leather Goods (`#goods`, paper-2)
Head like Collection: eyebrow "The Leather Goods" + H2 *"Companions to the belt."* + lede. **2-column** card grid (reuses `.card`, `.card__media` aspect 4/3): **The Wallet** (`From €120`) and **The Card Holder** (`From €75`). Framed explicitly as secondary to belts.

### 9 · Journal (`#journal`, paper)
Head: eyebrow "From the Workshop" + H2 *"The Journal"* + an "All entries" tlink. **3-column** article grid (`.article`): media aspect 3/2 (scales on hover), mono category label (Brass), H3 title, 1-line dek. Articles: *Why vegetable-tanned leather ages beautifully* (Materials), *The story behind the Founder's Belt* (Craft), *Why repair matters* (Philosophy). 1 column ≤980px.

### 10 · Email List (`#signup`, paper-2, centered)
Centered (max 720px): eyebrow "The List" + H2 *"Join The Handcraftbandit Journal"* + a horizontal **perks list** (bulleted with brass dots): New releases / Workshop stories / Limited editions / Craftsmanship insights. Then the **email form** (`.eform`): a single bottom-border row — Cormorant 20px email input + "Join →" submit. On valid submit (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`) the form is replaced inline with a Cormorant confirmation: *"Welcome. Your first letter from the workshop is on its way."* Invalid → input refocus + oxblood border. A fine-print note follows. **Wire this to your real ESP** (Klaviyo/Mailchimp/etc.).

### Footer (`.footer`, oak-900)
4-column top grid `1.4fr/1fr/1fr/1fr`: brand block (Cormorant wordmark + one-line description + mono location "Midleton · County Cork · Ireland") and three link columns — **The House** (Our Story / The Workshop / Lifetime Repairs), **Shop** (The Collection / Leather Goods / Founder's Belt), **More** (Journal / Join the List / Contact mailto). Bottom hairline row: `© <year> Handcraftbandit — Built to be repaired. Not replaced.` + "Midleton, Ireland". Year injected by JS. Collapses to 2 cols then 1 on small screens.

---

## Interactions & Behavior
- **Nav scroll state:** toggle `.scrolled` on `#nav` when `scrollY > innerHeight*0.62` (passive scroll listener).
- **Mobile drawer:** open/close toggles `.open`; sets `aria-hidden`; locks `body` overflow; closes on any drawer link, Close button, or `Escape`.
- **Scroll reveals:** `.reveal` (single) and `.stagger` (children, 0.12s incremental delay up to 5th child) start at `opacity:0; translateY(26px)` and animate to rest with `IntersectionObserver` (threshold 0.12, rootMargin bottom `-8%`), unobserving after first reveal. Transition `~1.1s cubic-bezier(.16,1,.3,1)`.
- **Hero parallax:** on scroll (rAF-throttled, only while `scrollY < 1.2*innerHeight`), set `heroBg.transform = translate3d(0, scrollY*0.18px, 0) scale(1.06)`.
- **Email form:** client-side validate, inline success swap (see §10).
- **Reduced motion:** all reveal/stagger/parallax/scroll-cue animation is gated on `prefers-reduced-motion: no-preference`. When reduced, JS immediately adds `.in` to every reveal so all content is visible, parallax is skipped, and `scroll-behavior` is `auto`. **Preserve this behavior.**
- **Hover states:** buttons lift; tlinks draw underline + nudge arrow; card/article placeholders scale ~1.025–1.03; nav links draw underline; footer links lighten.

## State Management
Minimal — this is a marketing page. State needed if rebuilt in a framework:
- `navScrolled: boolean` (derived from scroll position).
- `drawerOpen: boolean`.
- `emailValue: string`, `emailSubmitted: boolean`, `emailError: boolean`.
- Reveal "has entered viewport" per element (or use an IntersectionObserver hook / CSS `animation-timeline: view()`).
- Products and journal entries should become **data** (CMS/commerce collections), not hardcoded markup.

## Design Tokens
```
/* Color */
--paper:      #F7F3EC   /* page ground */
--paper-2:    #F0E9DC   /* alt sections */
--paper-line: rgba(26,26,26,.13)   /* hairlines on light */
--ink:        #1A1A1A   /* primary text */
--ink-70:     rgba(26,26,26,.70)   /* body text */
--ink-55:     rgba(26,26,26,.55)   /* muted/sub */
--oxblood:    #6A1F1B   /* primary accent: CTAs, flagship, bignum */
--oxblood-dk: #561714   /* primary hover */
--brass:      #8A6A44   /* secondary accent: eyebrows, numerals, dots */
--brass-lt:   #A6855C   /* brass on dark grounds */
--oak-900:    #16110D   /* dark ground (hero/repairs/footer) */
--oak-850:    #1D1611
--oak-800:    #241B14
--oak-line:   rgba(237,228,214,.16)   /* hairlines on dark */
--cream:      #EDE4D6   /* text on dark */
--cream-70:   rgba(237,228,214,.72)   /* body on dark */
--cream-50:   rgba(237,228,214,.52)   /* muted on dark */

/* Type */
--serif: "Cormorant Garamond", Georgia, "Times New Roman", serif;
--sans:  "Jost", system-ui, -apple-system, sans-serif;
--mono:  ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;

/* Metrics */
--measure: 62ch;                       /* body line length */
--pad:     clamp(20px, 5.5vw, 88px);   /* container side padding */
--maxw:    1280px;                     /* container width */
--ease:    cubic-bezier(.16, 1, .3, 1);/* standard easing */

/* Section padding-block: clamp(72px, 11vw, 168px) */
/* Reveal transition: ~1.1s var(--ease); offset translateY(26px) */
/* Breakpoints: 980px (layout collapse), 760px (hero scrim), 560px (footer 1-col, full-width buttons) */
```
There is no rounded-corner / shadow language — the aesthetic is **flat, square, hairline-ruled**. Border-radius is effectively 0 throughout (intentional). Spacing is fluid via `clamp()` rather than a fixed step scale.

## Assets
- **`assets/hero.png`** — the real hero photograph (black leather belt, Irish whiskey bottle + Glencairn glass, "MIDLETON CO. CORK" crate on dark oak). User-supplied; ship as-is (optimize/convert to AVIF/WebP + responsive `<picture>` for production). This is the only real image.
- **All other images are placeholders.** Each `.ph` element's `.ph__note` caption is the **photography brief** for that slot. Shots to commission:
  - Hands stitching leather (saddle stitch, window light) — Philosophy
  - Everyday / Heritage / Founder's belt product shots — Collection (3:4)
  - Founder at the workshop bench (warm tungsten) — Maker's Story
  - Workshop mosaic: leather cutting, hand stitching, edge burnishing, traditional tools, rolled Italian veg-tan hides — Workshop
  - Well-worn belt with patina — Lifetime Repairs
  - Wallet, card holder — Leather Goods (4:3)
  - Journal article thumbnails ×3 (3:2)
- **Fonts** load from Google Fonts (Cormorant Garamond, Jost). Self-host for production if preferred.

## SEO
- `<title>`: `Handcraftbandit — Irish Belt House | Handcrafted Leather Belts, Midleton`
- `<meta name="description">`: *Handcraftbandit is an Irish belt house in Midleton, County Cork, hand-stitching premium Italian vegetable-tanned leather belts using traditional techniques. Built to be repaired. Not replaced.*
- Open Graph title/description/type present; `theme-color` `#16110D`.
- Add structured data in production: `Organization` / `LocalBusiness` (Midleton, Co. Cork) and `Product` for each belt; `Article` for journal posts.

## Files
- **`Handcraftbandit Homepage.html`** — full page markup (semantic sections with `data-screen-label` attributes for review tooling; anchor ids per section).
- **`styles.css`** — complete design system + responsive rules + animations (token `:root` at top).
- **`main.js`** — nav scroll state, mobile drawer, IntersectionObserver reveals, hero parallax, email validation, footer year. Vanilla, no dependencies.
- **`assets/hero.png`** — hero photograph.

Open `Handcraftbandit Homepage.html` in a browser to view the reference prototype.
