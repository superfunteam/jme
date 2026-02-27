// extract.js — Rebuild content.json from Adlib-annotated HTML
//
// Usage:
//   node extract.js                  # reads index.html → writes content.json
//   node extract.js some-page.html   # reads specific file → stdout
//
// Zero dependencies beyond Node.js built-ins. Parses HTML with regex
// (safe here because we control the output format exactly).

const fs = require('fs');

const inputFile = process.argv[2] || 'index.html';
const writeToFile = !process.argv[2]; // only overwrite content.json when using default

const html = fs.readFileSync(inputFile, 'utf8');

// ─── Helpers ───

function setPath(obj, path, val) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
    if (o[k] === undefined) {
      // Next key determines if we need an array or object
      o[k] = isNaN(keys[i + 1]) ? {} : [];
    }
    o = o[k];
  }
  const last = isNaN(keys[keys.length - 1]) ? keys[keys.length - 1] : parseInt(keys[keys.length - 1]);
  o[last] = val;
}

// Decode HTML entities back to plain text
function decode(s) {
  return s
    .replace(/&ldquo;/g, '')
    .replace(/&rdquo;/g, '')
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '--')
    .replace(/&middot;/g, '\u00B7')
    .replace(/&rarr;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u00A0/g, ' ')
    .trim();
}

// Strip HTML tags to get text content
function textContent(s) {
  // Remove prove-word spans (used for animation) but keep the text
  let text = s.replace(/<span class="prove-word">(.*?)<\/span>/g, '$1');
  // Replace <br> with \n before stripping tags (preserves line breaks)
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Remove all other tags
  text = text.replace(/<[^>]+>/g, '');
  return decode(text);
}

// Get innerHTML but decode entity-encoded tags back to real tags for richtext
function richContent(s) {
  // For richtext, we want to preserve <em> tags but strip everything else
  let text = s.replace(/<(?!\/?em\b)[^>]+>/g, '');
  return decode(text);
}

// ─── Extract all data-adlib-cms elements ───

const content = {};

// Pattern: match elements with data-adlib-cms attribute
// Captures: full opening tag (to read other attrs), and inner content up to next tag boundary
const cmsPattern = /data-adlib-cms="([^"]+)"([^>]*)>([^]*?)(?=<\/\w|<\w)/g;

// More precise: find each data-adlib-cms occurrence and extract its context
const elementPattern = /<([a-z][a-z0-9]*)\s[^>]*?data-adlib-cms="([^"]+)"[^>]*?(?:data-adlib-type="([^"]+)")?[^>]*?(?:data-target="([^"]+)")?[^>]*?>/gi;

// We need to handle self-closing elements (img, source) and content elements differently
const allMatches = [];
let match;

// Reset and use a simpler approach: find all data-adlib-cms attributes
const attrPattern = /data-adlib-cms="([^"]+)"/g;
const positions = [];
while ((match = attrPattern.exec(html)) !== null) {
  positions.push({ path: match[1], pos: match.index });
}

for (const { path, pos } of positions) {
  // Walk backwards to find the opening < of this element
  let tagStart = pos;
  while (tagStart > 0 && html[tagStart] !== '<') tagStart--;

  // Find the end of the opening tag
  let tagEnd = pos;
  while (tagEnd < html.length && html[tagEnd] !== '>') tagEnd++;
  tagEnd++; // include the >

  const openingTag = html.slice(tagStart, tagEnd);

  // Extract tag name
  const tagName = openingTag.match(/^<(\w+)/)?.[1]?.toLowerCase();

  // Extract data-adlib-type
  const typeMatch = openingTag.match(/data-adlib-type="([^"]+)"/);
  const type = typeMatch ? typeMatch[1] : 'text';

  // Extract data-target (for number types)
  const targetMatch = openingTag.match(/data-target="([^"]+)"/);

  // Self-closing / void elements
  if (['img', 'source', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName)) {
    if (type === 'image') {
      const srcMatch = openingTag.match(/\bsrc="([^"]+)"/);
      setPath(content, path, srcMatch ? srcMatch[1] : '');
    } else if (type === 'video') {
      const srcMatch = openingTag.match(/\bsrc="([^"]+)"/);
      setPath(content, path, srcMatch ? srcMatch[1] : '');
    }
    continue;
  }

  // For number type, prefer data-target
  if (type === 'number') {
    setPath(content, path, targetMatch ? Number(targetMatch[1]) : 0);
    continue;
  }

  // Content elements: find the inner HTML up to the closing tag
  // Find the matching close tag (simplified — works for our known structure)
  let depth = 1;
  let cursor = tagEnd;
  const closeTag = `</${tagName}`;

  // Find inner content between opening tag end and closing tag
  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf(`<${tagName}`, cursor);
    const nextClose = html.indexOf(closeTag, cursor);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      cursor = nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) {
        const innerHTML = html.slice(tagEnd, nextClose);

        if (type === 'richtext') {
          setPath(content, path, richContent(innerHTML));
        } else {
          setPath(content, path, textContent(innerHTML));
        }
      }
      cursor = nextClose + 1;
    }
  }
}

// ─── Post-processing ───

// The approach.title has <br> inserted during build — reconstruct the space-separated original
if (content.approach && content.approach.title) {
  content.approach.title = content.approach.title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

// The mission.ctaLink has " →" appended — strip it
if (content.mission && content.mission.ctaLink) {
  content.mission.ctaLink = content.mission.ctaLink.replace(/\s*→?\s*$/, '').trim();
}

// Ensure testimonials have a photo field (defaults to "" when no <img> is rendered)
if (content.testimonials) {
  for (const t of content.testimonials) {
    if (t.photo === undefined) t.photo = '';
  }
}

// Ensure key ordering matches original content.json convention:
// For hero: headline, cta, videoWebm, videoMp4
if (content.hero) {
  const h = content.hero;
  content.hero = {
    headline: h.headline,
    cta: h.cta,
    videoWebm: h.videoWebm || '',
    videoMp4: h.videoMp4 || ''
  };
}

// For about: name, role, lead, bio, photo
if (content.about) {
  const a = content.about;
  content.about = {
    name: a.name,
    role: a.role,
    lead: a.lead,
    bio: a.bio,
    photo: a.photo || ''
  };
}

// For each testimonial: quote, name, title, photo
if (content.testimonials) {
  content.testimonials = content.testimonials.map(t => ({
    quote: t.quote,
    name: t.name,
    title: t.title,
    photo: t.photo || ''
  }));
}

// ─── Output ───

const json = JSON.stringify(content, null, 2) + '\n';

if (writeToFile) {
  fs.writeFileSync('content.json', json);
  console.log(`Extracted content.json (${Object.keys(content).length} sections)`);
} else {
  process.stdout.write(json);
}
