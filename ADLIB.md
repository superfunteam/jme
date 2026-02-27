# Adlib CMS

**HTML-first content management through data attributes.**

Adlib treats the rendered HTML as the single source of truth for content structure. Every content-bearing element in the build output carries a `data-adlib-cms` attribute that maps it to a path in the content model. This means any tool — a scraper, an LLM, a build script, the admin portal — can extract a complete `content.json` from the HTML alone.

No template language. No framework. The HTML *is* the schema.

---

## Core Concept

The current JME build pipeline:

```
content.json  →  build.js  →  index.html
                                  ↑
                            (plain HTML, no metadata)
```

With Adlib:

```
content.json  →  build.js  →  index.html
                                  ↑
                            (every content element stamped
                             with data-adlib-cms="path")
                                  ↓
                            extract.js  →  content.json
```

Round-trip. The HTML can regenerate the JSON that built it.

---

## Attribute Reference

### `data-adlib-cms`

The primary attribute. Its value is a **dot-notation path** into the content model.

```html
<!-- Simple text field -->
<span data-adlib-cms="hero.headline.0">Our mission</span>

<!-- Image -->
<img data-adlib-cms="about.photo" src="images/jeanne-marie-ellis.jpg">

<!-- Link text -->
<a data-adlib-cms="hero.cta" href="#contact">Start a Conversation</a>
```

The path must exactly match the corresponding key path in `content.json`. Array indices are numeric: `hero.headline.0`, `hero.headline.1`, `hero.headline.2`.

### `data-adlib-type`

Tells extractors *how* to read the element's value. Defaults to `text` if omitted.

| Type       | Reads from         | Example                                                                 |
|------------|--------------------|-------------------------------------------------------------------------|
| `text`     | `textContent`      | `<span data-adlib-cms="hero.headline.0">Our mission</span>`            |
| `richtext` | `innerHTML`        | `<p data-adlib-cms="about.bio.1" data-adlib-type="richtext">She co-authored <em>Doing More Together</em>...</p>` |
| `image`    | `src` attribute    | `<img data-adlib-cms="about.photo" data-adlib-type="image">`           |
| `video`    | `src` attribute    | `<source data-adlib-cms="hero.videoWebm" data-adlib-type="video">`     |
| `number`   | `data-target` or `textContent` | `<span data-adlib-cms="mission.stats.0.number" data-adlib-type="number" data-target="30">` |
| `href`     | `href` attribute   | `<a data-adlib-cms="contact.email" data-adlib-type="href">`            |

### `data-adlib-section`

Marks a container element as a named section. Purely organizational — helps tools group fields visually and aids extraction by establishing context boundaries.

```html
<section data-adlib-section="hero" id="home" class="hero-section">
  ...
</section>
```

### `data-adlib-each`

Marks a **repeating container** — an element that is rendered once per item in an array.

```html
<div class="testimonial" data-adlib-each="testimonials" data-adlib-index="0">
  <p data-adlib-cms="testimonials.0.quote">...</p>
  <strong data-adlib-cms="testimonials.0.name">...</strong>
</div>
```

### `data-adlib-index`

The numeric index of a repeated item within its `data-adlib-each` group. Extraction uses this to reconstruct arrays.

---

## Path Convention

Paths use dot notation mirroring the `content.json` structure:

```
section.field              → content.section.field
section.field.index        → content.section.field[index]
section.index.field        → content.section[index].field
```

### Full path map for this site

```
hero.headline.0                    text      "Our mission"
hero.headline.1                    text      "is advancing"
hero.headline.2                    text      "yours."
hero.cta                           text      "Start a Conversation"
hero.videoWebm                     video     "images/hero-bg.webm"
hero.videoMp4                      video     "images/hero-bg.mp4"

testimonials.{i}.quote             text      (per testimonial)
testimonials.{i}.name              text
testimonials.{i}.title             text
testimonials.{i}.photo             image

marquee.{i}                        text      (per marquee item)

mission.lead                       text
mission.body.{i}                   text      (2 paragraphs)
mission.stats.{i}.number           number
mission.stats.{i}.label            text
mission.ctaQuestions.{i}            text      (3 questions)
mission.ctaLink                    text

approach.title                     text
approach.intro                     text
approach.principlesLead            text
approach.principles.{i}            text      (4 principles)
approach.pillars.{i}.title         text
approach.pillars.{i}.description   text

services.{i}.name                  text      (4 services)
services.{i}.description           text
services.{i}.listHeading           text
services.{i}.deliverables.{j}      text

clients.{i}.category               text      (3 categories)
clients.{i}.clients.{j}.name       text
clients.{i}.clients.{j}.location   text

about.name                         text
about.role                         text
about.lead                         text
about.bio.{i}                      richtext  (3 paragraphs, may contain <em>)
about.photo                        image

contact.intro                      text
contact.phone                      text
contact.email                      text
contact.location                   text

footer.tagline                     text
```

---

## Build Rules

When `build.js` renders content into HTML, every element that holds content from `content.json` gets annotated:

### 1. Stamp the path

```js
// Before (plain):
`<span class="hero-line">${esc(hero.headline[0])}</span>`

// After (annotated):
`<span class="hero-line" data-adlib-cms="hero.headline.0">${esc(hero.headline[0])}</span>`
```

### 2. Add type when not `text`

```js
// Image:
`<img data-adlib-cms="about.photo" data-adlib-type="image" src="${esc(about.photo)}">`

// Rich text (contains <em>):
`<p data-adlib-cms="about.bio.1" data-adlib-type="richtext">${richEsc(p)}</p>`

// Number:
`<span data-adlib-cms="mission.stats.0.number" data-adlib-type="number" data-target="30">0</span>`
```

### 3. Mark sections

```js
`<section data-adlib-section="hero" id="home" class="hero-section">`
```

### 4. Mark repeating groups

```js
`<div class="testimonial" data-adlib-each="testimonials" data-adlib-index="${i}">`
```

### 5. Skip duplicates

The marquee track duplicates items for seamless looping. Only the *first* set gets `data-adlib-cms` attributes. The duplicate set (the `<!-- duplicate for seamless loop -->` block) gets no annotation.

Similarly, footer contact info mirrors the contact section. The footer values get a `data-adlib-mirror` attribute instead of `data-adlib-cms`, signaling they're read-only echoes:

```html
<a data-adlib-mirror="contact.phone" href="tel:5128017905">512-801-7905</a>
```

---

## Extraction

Extraction is the reverse of build: read the annotated HTML, reconstruct `content.json`.

### Algorithm

```
1. Parse HTML
2. querySelectorAll('[data-adlib-cms]')
3. For each element:
   a. path  = element.dataset.adlibCms
   b. type  = element.dataset.adlibType || 'text'
   c. value = read(element, type)
4. setPath(content, path, value)
5. JSON.stringify(content)
```

Reading by type:

```js
function readValue(el, type) {
  switch (type) {
    case 'image':    return el.getAttribute('src') || '';
    case 'video':    return el.getAttribute('src') || '';
    case 'href':     return el.getAttribute('href') || '';
    case 'number':   return Number(el.getAttribute('data-target') || el.textContent);
    case 'richtext': return el.innerHTML;
    case 'text':
    default:         return el.textContent;
  }
}
```

### Usage

```bash
node extract.js                  # reads index.html → writes content.json
node extract.js some-page.html   # reads specific file → stdout
```

---

## Admin Portal Alignment

The admin portal's `data-field` attributes already use the same dot-notation paths. Adlib doesn't replace the admin — it makes the *output* self-describing so that content can be extracted without the admin or `content.json` at all.

The paths are intentionally identical:

| Admin (input)                     | Build output (Adlib)                          |
|-----------------------------------|-----------------------------------------------|
| `<input data-field="hero.cta">`   | `<a data-adlib-cms="hero.cta">...</a>`        |
| `<textarea data-field="about.bio.0">` | `<p data-adlib-cms="about.bio.0">...</p>` |

Same paths, different roles. `data-field` is for writing. `data-adlib-cms` is for reading.

---

## Why "Adlib"

The CMS works like a mad lib — the HTML structure is fixed, and the content fills in the blanks. Every blank has a label (`data-adlib-cms`). Fill them in, and you have a page. Read them out, and you have the data.

---

## Implementation Checklist

- [x] `ADLIB.md` — this file (attribute spec, path map, extraction algorithm)
- [x] `build.js` — stamp `data-adlib-cms`, `data-adlib-type`, `data-adlib-section`, `data-adlib-each`, `data-adlib-index` on all content elements (142 bindings, 9 sections, 61 repeaters, 3 mirrors)
- [x] `extract.js` — Node script that parses annotated HTML and outputs `content.json` (round-trips perfectly)
- [x] `admin/index.html` — no changes needed (already uses matching paths via `data-field`)
- [x] `styles.css` — no changes needed (attributes don't affect styling unless you want `[data-adlib-cms]` highlight styles for debug)
