# RCMS Extraction Feasibility Analysis

## What We Have Today

The JME site runs a homegrown CMS that totals ~1,100 lines of meaningful code across 4 files:

| File | Lines | Role |
|------|-------|------|
| `admin/index.html` | 952 | Admin UI + all client-side JS |
| `netlify/functions/save.js` | 59 | Commits `content.json` to GitHub |
| `netlify/functions/upload-image.js` | 76 | Commits media files to GitHub |
| `build.js` | 461 | Reads JSON, writes static HTML |

Content lives in a single `content.json` (363 lines) that maps 1:1 to every editable slot on the site. No database, no ORM, no migrations.

## The Core Patterns Worth Extracting

The CMS has a handful of genuinely generic primitives hiding inside the JME-specific code:

### 1. Dot-notation field binding (~25 lines)
```html
<input data-field="hero.headline.0">
<textarea data-field="mission.body.1">
```
```js
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}
function setPath(obj, path, val) { /* ... */ }
```
This is the heart of the mad-lib pattern. A `data-field` attribute on any input maps it to a dot-path in the JSON. `populateForms()` fills inputs from JSON, `gatherContent()` reads inputs back to JSON. Completely generic already.

### 2. GitHub-as-backend (~135 lines)
The two serverless functions do exactly one thing each: read the current SHA, write a new commit. The only JME-specific part is the hardcoded upload path whitelist. Replace that with a configurable `allowedUploadPaths` (or just a directory prefix) and these functions are 100% reusable as-is.

### 3. Password auth (~15 lines)
Single password stored in `ADMIN_PASSWORD` env var, checked on every save/upload. Stored in `sessionStorage` for the browser session. Dead simple, totally generic.

### 4. Content lifecycle
```
content.json → build.js → index.html (static)
admin edit → serverless function → GitHub commit → rebuild → deploy
```
This flow is framework-agnostic. Any static site generator, any template engine, any hosting platform that supports deploy-on-push.

## What's JME-Specific (Would NOT Be Extracted)

- The 10 hardcoded content sections (hero, testimonials, services, etc.)
- The hand-built admin sidebar navigation
- All the `render*()` functions (renderTestimonials, renderServices, etc.)
- The build.js HTML template
- All frontend JS animations (script.js)
- All styling (style.css)

These represent ~75% of the admin code. But that's exactly the point: in the extracted version, these would be **auto-generated from a schema**.

## The RCMS Vision: What Extraction Looks Like

### The Schema (what the consuming developer writes)

```js
// rcms.config.js
module.exports = {
  sections: {
    hero: {
      label: "Hero",
      fields: {
        headline:    { type: "text",     label: "Headline" },
        subtitle:    { type: "textarea", label: "Subtitle", rows: 3 },
        background:  { type: "file",     label: "Background Image", accept: "image/*" },
      }
    },
    about: {
      label: "About",
      fields: {
        name:        { type: "text",     label: "Name" },
        bio:         { type: "textarea", label: "Bio", rows: 6 },
        headshot:    { type: "file",     label: "Photo", accept: "image/*" },
      }
    },
    contact: {
      label: "Contact",
      fields: {
        email:       { type: "text",     label: "Email" },
        phone:       { type: "text",     label: "Phone" },
      }
    }
  }
}
```

Three field types. That's it:
- **`text`** — single-line input
- **`textarea`** — multi-line input
- **`file`** — media upload (image or video)

No blocks, no rich text editors, no drag-and-drop. Every field maps to exactly one slot in the output. Mad-lib CMS.

### What RCMS Generates / Provides

1. **`/admin/index.html`** — Auto-generated from the schema. Sidebar nav, form sections, save bar, login screen. The consuming project never touches this file.

2. **`/netlify/functions/rcms-save.js`** — Generic. Reads schema to know the content file path. Commits to GitHub.

3. **`/netlify/functions/rcms-upload.js`** — Generic. Allows uploads to a configured media directory (no hardcoded whitelist).

4. **`content.json`** — Auto-scaffolded from schema with empty/default values.

5. **A tiny client library** (or just documentation) for reading `content.json` in your build step:
```js
const content = require('./content.json');
// content.hero.headline, content.about.bio, etc.
```

### What the Consuming Project Owns

- Their own HTML templates / build script / framework
- Their own CSS and frontend JS
- The schema definition (`rcms.config.js`)
- How content values get rendered (they just read JSON)

## Feasibility Assessment

### Difficulty: Low

The extractable CMS logic is approximately **220 lines of actual code**:
- `getPath`/`setPath` helpers: ~15 lines
- `data-field` binding (populate + gather): ~15 lines
- Admin UI shell (login, sidebar, save bar): ~80 lines
- Save serverless function: ~55 lines
- Upload serverless function: ~60 lines

The main new work is the **schema-driven form generator** (~100-150 lines) that replaces the hand-crafted JME admin sections. Given that we only have 3 field types (text, textarea, file), this is straightforward.

### What Makes This Easy

1. **No database** — JSON file in the repo. Zero infrastructure.
2. **No framework dependency** — Vanilla JS admin, serverless functions. Works with any frontend.
3. **No complex field types** — Three primitives. No blocks, no relations, no computed fields.
4. **GitHub handles versioning** — Every save is a commit. Free rollback, history, and collaboration.
5. **Netlify handles hosting** — Deploy-on-push. No custom server.
6. **The patterns already work** — We've proven them on a production site.

### What Needs Thought

1. **Repeatable groups** — JME has arrays (testimonials, services, clients). The schema needs a `list` or `repeat` concept:
   ```js
   testimonials: {
     label: "Testimonials",
     repeatable: true,
     fields: {
       quote: { type: "textarea", label: "Quote" },
       name:  { type: "text",     label: "Name" },
       photo: { type: "file",     label: "Photo", accept: "image/*" },
     }
   }
   ```
   This adds complexity to the form generator (add/remove buttons, indexing) but it's bounded complexity — we already have working code for this pattern.

2. **Nested groups** — JME's clients have categories with sub-arrays. Could be deferred to v2, or handled with a simple `group` type.

3. **Upload path management** — Instead of a whitelist, use a convention: `media/{section}/{field}-{index}.{ext}`. Auto-generate allowed paths from the schema.

4. **Platform portability** — Currently married to Netlify Functions + GitHub API. Could abstract the storage layer, but for v1, Netlify + GitHub is the right default. These are both free-tier friendly and what agents will reach for first.

5. **Multi-page support** — JME is a single page. For a multi-page site, the schema could have a `pages` wrapper, or each page could have its own `content.json` + schema.

## Proposed Architecture

```
your-project/
├── rcms.config.js          ← You define your content shape
├── content.json             ← Auto-scaffolded, committed to repo
├── admin/
│   └── index.html           ← Auto-generated from schema
├── netlify/
│   └── functions/
│       ├── rcms-save.js     ← Generic, from RCMS package
│       └── rcms-upload.js   ← Generic, from RCMS package
├── media/                   ← Uploaded files go here
├── index.html               ← Your site (reads content.json however you want)
└── package.json
```

### Integration for the consuming developer:

```bash
npx rcms init
# Prompts: "Describe your site's content sections"
# (or reads an existing rcms.config.js)
# Scaffolds: admin/, netlify/functions/, content.json
```

### Agent-first experience:

An AI agent building a static site can:
1. `npm install rcms`
2. Write an `rcms.config.js` based on the site's content slots
3. Run `npx rcms generate` to scaffold the admin and serverless functions
4. Wire `content.json` values into their HTML templates
5. Deploy to Netlify

No dashboard to set up. No account to create. No SaaS to subscribe to. Just a config file and a build step.

## Estimated Effort

| Task | Effort |
|------|--------|
| Schema parser + validator | Small |
| Admin UI generator (3 field types + repeatables) | Medium |
| Generic save/upload functions | Small (mostly copy-paste from JME) |
| CLI (`rcms init`, `rcms generate`) | Medium |
| Documentation + examples | Medium |
| Testing across a few site types | Medium |

**Total: a focused week of work** to get a working v1 that an agent could use.

## Conclusion

**Yes, this extracts cleanly.** The JME CMS is already 80% of the way there conceptually — the gap is replacing hand-crafted admin forms with schema-driven generation. The code is small, the patterns are proven, the field types are intentionally minimal, and the infrastructure choices (JSON file + GitHub + Netlify) mean zero setup friction.

The mad-lib philosophy is the feature, not a limitation. Every field is a blank to fill in. The admin is boring on purpose. The output is predictable on purpose. That's what makes it bulletproof and what makes it perfect for agent-driven integration.
