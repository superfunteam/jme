# Adlib Landing Page — Build Spec

## Font
Stack Sans Notch from Google Fonts. Load via Fontsource CDN:
```
https://cdn.jsdelivr.net/fontsource/fonts/stack-sans-notch@latest/latin-{weight}-normal.woff2
```
Weights needed: 300 (body), 600 (labels), 700 (headlines). Fallback: `system-ui, sans-serif`.

## Vibe
Black background. White text. One accent gradient (cyan `#00d4ff` → purple `#a855f7`). Monospace for code. Huge type. Lots of negative space. Feels like Linear or Vercel marketing but bolder. Single-page vertical scroll.

## Sections (in order)

### 1. Nav (fixed)
- Left: wordmark "adlib" (the "lib" in accent color)
- Right: "Get Started" pill link → anchors to #start
- Backdrop-blur, transparent bg, border appears on scroll

### 2. Hero (full viewport)
- Label: `AGENT-FIRST CMS` (tiny, uppercase, accent color, tracked wide)
- Title: two lines, massive (`clamp(3rem, 11vw, 10rem)`), weight 700:
  ```
  Your agent
  is your CMS.
  ```
  Second line uses the accent gradient on text.
- Subtitle: "One HTML attribute. Full content round-trip. Zero everything else." — weight 300, muted color, max 40ch
- Code block with copy button:
  ```html
  <h1 data-adlib-cms="hero.headline">
    Your Text Here
  </h1>
  ```
  Copy button copies just `data-adlib-cms="hero.headline"`. Shows "Copied" state for 2s.
- Below code: "Add it to your HTML. Run **one command**. Your agent handles the rest."
- Animated scroll-down chevron at bottom center

### 3. Workflow — "Four steps. Three are automatic."
Four cards in a responsive grid:
1. **Annotate** — Add `data-adlib-cms` attributes to your HTML. One attribute per content field. That's your whole schema.
2. **Extract** — Your agent reads the HTML, finds every annotation, produces structured `content.json`. Automatically.
3. **Edit** — Update the JSON. Change a headline, swap an image, add a testimonial. Plain data, no API calls.
4. **Build** — JSON → HTML. Push. Ship. Deterministic — same content in, same page out.

Each card: step number in large gradient text (01–04), bold title, muted description. Subtle border, rounded corners.

### 4. Zero Everything — "Zero everything."
Six items in a 2- or 3-column grid:
| Item | Description |
|------|-------------|
| 0 deps | No frameworks. No npm install. Just Node and your HTML. |
| 0 config | No YAML. No env files. The HTML *is* the config. |
| 0 database | Content lives in a JSON file. Version it with git. |
| 0 dashboard | No CMS UI to build. Your agent *is* the interface. |
| 0 lock-in | Remove the attributes. You still have a working site. |
| 0 learning | If you can write an HTML attribute, you already know adlib. |

The "0" is muted, the word is bold and large. Each item separated by a bottom border.

### 5. Philosophy — "Built for agents. Not dashboards."
Single paragraph, large weight-300 text, muted with key phrases bolded white:
> Traditional CMSs were built for humans clicking buttons in browsers. Adlib was built for **agents reading and writing files**. Your client's content already lives in the HTML they shipped. Annotate it once and **let your agent handle the rest** — extraction, editing, rebuilding, deploying. No middleware. No APIs. **Just files.**

### 6. CTA — "Ship it tonight."
Centered. Big title. Subtitle: "Clone. Annotate. Extract. Push. That's the whole thing."
Code block with copy:
```
$ node extract.js index.html > content.json
→ 23 fields extracted. Done.
```

### 7. Footer
One line, centered, muted: `adlib — the agent-first CMS for static sites`

## Animation

### WebGL Background
Full-viewport `<canvas>` fixed behind all content. Simple fragment shader: 2–3 slowly moving gradient blobs (cyan/purple on black) at ~12% opacity. Soft, organic, alive but not distracting. Cap DPR at 1.5 for performance. Pause on tab hidden (Page Visibility API). Hide entirely for `prefers-reduced-motion: reduce`.

### Element Animations (use motion.dev)
Load from CDN: `https://cdn.jsdelivr.net/npm/motion@11/+esm`
- **Hero**: elements stagger-reveal on load (fade up, 0.12s stagger, 0.8s duration, ease-out)
- **All other sections**: `inView()` triggers fade-up reveal when section enters viewport (0.08s stagger, 0.7s duration)
- Use CSS class `.reveal` (starts `opacity:0; transform:translateY(40px)`) on every animating element
- `prefers-reduced-motion: reduce` → skip all animation, show everything immediately

## Accessibility (non-negotiable)
- Skip-to-content link
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<footer>`, proper heading hierarchy (one `<h1>`, then `<h2>`s)
- Every section has `aria-labelledby` pointing to its heading
- Canvas is `aria-hidden="true"` with `pointer-events: none`
- Copy buttons have `aria-label`
- Code blocks use `role="figure"` with `aria-label`
- Focus-visible styles (accent outline, 4px offset)
- All contrast ratios pass WCAG AAA (white on black = 21:1)
- `prefers-reduced-motion` respected everywhere
- `lang="en"` on `<html>`

## Technical Constraints
- Single self-contained HTML file (`landing.html`)
- All styles inline in `<style>` (no external CSS)
- No build step, no dependencies beyond the two CDN loads (font + motion.dev)
- WebGL script in a plain `<script>`, motion.dev script in `<script type="module">`
- Responsive: works from 320px to ultrawide. Use `clamp()` for all type sizes. Grid collapses to single column on mobile.
- Hide scroll chevron on mobile
