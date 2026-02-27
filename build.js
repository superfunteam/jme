const fs = require('fs');
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

// HTML-encode dangerous chars + typographic niceties
function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&rsquo;')
    .replace(/--/g, '&mdash;');
}

// Like esc() but allows <em> tags through
function richEsc(s) {
  return esc(s)
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>');
}

// Generate initials from a name (first + last)
function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Convert \n to <br> in category titles
function br(s) {
  return esc(s).replace(/\n/g, '<br>');
}

const { hero, testimonials, marquee, mission, approach, services, clients, about, contact, footer } = content;

// Build marquee (original + duplicate for seamless loop)
const marqueeItems = marquee.map(item =>
  `        <span class="marquee-item">${esc(item)}</span>\n        <span class="marquee-sep" aria-hidden="true">&middot;</span>`
).join('\n');

const marqueeHTML = marqueeItems + '\n        <!-- duplicate for seamless loop -->\n' + marqueeItems;

// Build testimonial dots
const testimonialDots = testimonials.map((_, i) =>
  `                <button class="testimonial-dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Testimonial ${i + 1}"></button>`
).join('\n');

// Build testimonial slides
const testimonialSlides = testimonials.map((t, i) => {
  const photoHTML = t.photo
    ? `<img src="${esc(t.photo)}" alt="${esc(t.name)}" class="attribution-photo" loading="${i === 0 ? 'eager' : 'lazy'}">`
    : `<div class="attribution-avatar">${initials(t.name)}</div>`;
  return `                <div class="testimonial${i === 0 ? ' active' : ''}" data-index="${i}">
                  <blockquote>
                    <p>&ldquo;${esc(t.quote)}&rdquo;</p>
                  </blockquote>
                  <div class="testimonial-attr">
                    ${photoHTML}
                    <div class="attribution-text">
                      <strong>${esc(t.name)}</strong>
                      <span>${esc(t.title)}</span>
                    </div>
                  </div>
                </div>`;
}).join('\n');

// Build mission CTA questions
const ctaHTML = (() => {
  const qs = mission.ctaQuestions;
  const last = qs.length - 1;
  const lines = [];
  // Combine all non-last questions into one flowing paragraph
  const combined = qs.slice(0, last).map(q => esc(q)).join(' ');
  lines.push(`          <p class="cta-question">${combined}</p>`);
  // Last question gets word-by-word reveal spans
  const words = qs[last].split(' ').map(w => `<span class="prove-word">${esc(w)}</span>`).join(' ');
  lines.push(`          <p class="cta-question cta-prove"><em>${words}</em></p>`);
  return lines.join('\n');
})();

// Build stats
const statsHTML = mission.stats.map(s =>
  `          <div class="stat fade-in" data-counter>
            <div class="stat-top"><span class="stat-number" data-target="${s.number}">0</span><span class="stat-plus">+</span></div>
            <span class="stat-label">${esc(s.label)}</span>
          </div>`
).join('\n');

// Build approach title with <br>
const approachTitleParts = approach.title.split(' ');
const approachTitleHTML = approachTitleParts.length >= 2
  ? approachTitleParts[0] + '<br>' + approachTitleParts.slice(1).join(' ')
  : approach.title;

// Build principles list
const principlesHTML = approach.principles.map(p =>
  `              <li>${esc(p)}</li>`
).join('\n');

// Pillar SVG icons (design elements, not content)
const pillarIcons = [
  `<svg class="pillar-icon pillar-icon--listening" aria-hidden="true" viewBox="0 0 68.8 68.7" xmlns="http://www.w3.org/2000/svg">
              <path d="M68.5,9.4L59.3.2c-.1-.1-.3-.2-.6-.2H.8c-.2,0-.4,0-.6.2C0,.4,0,.6,0,.8v58c0,.2,0,.4.2.6l9.2,9.2c.1.1.3.2.6.2h58c.2,0,.4,0,.6-.2.1-.1.2-.3.2-.6V10c0-.2,0-.4-.2-.6ZM47.5,19.9h-26.7l-9-9.2h35.7v9.2ZM47.5,21.5v25.8h-26.2v-25.8h26.2ZM21.3,48.8h26.7l9,9.2H21.3v-9.2ZM1.6,1.6h56.4v55.3l-9-9.1V10c0-.2,0-.4-.2-.6-.1-.1-.3-.2-.6-.2H10c-.2,0-.4,0-.6.2-.1.1-.2.3-.2.6v56.1l-7.6-7.6V1.6ZM67.2,67.2H10.8V11.9l9,9.1v37.8c0,.2,0,.4.2.6.1.1.3.2.6.2h38.3c.2,0,.4,0,.6-.2.1-.1.2-.3.2-.6V2.7l7.6,7.6v56.9Z" fill="currentColor"/>
            </svg>`,
  `<svg class="pillar-icon" aria-hidden="true" viewBox="0 0 73.2 68.8" xmlns="http://www.w3.org/2000/svg">
              <path d="M73.2,19.7l-5.6-9.7c-.1-.2-.4-.4-.7-.4h-21.6L40.1.4c-.1-.2-.4-.4-.7-.4H6.2c-.3,0-.5.1-.7.4L0,10.1c-.1.2-.1.5,0,.8l10.8,18.7-5.3,9.3c-.1.2-.1.5,0,.8l16.6,28.8c.1.2.4.4.7.4h11.1c.3,0,.5-.1.7-.4l10.8-18.7h10.7c.3,0,.5-.1.7-.4l16.6-28.8h0c.1-.2.1-.5,0-.8h0ZM65.6,11.2l-15.7,27.2h-20.6l4.7-8h10.9c.3,0,.5-.1.7-.4l5.6-9.7c.1-.2.1-.5,0-.8l-4.8-8.4h19.3ZM18.2,39.2l10-17.3,4.6,7.8-5.4,9.1c-.1.2-.1.5,0,.8l5.7,9.7c.1.2.4.4.7.4h9.8l-9.7,16.8-15.7-27.2ZM33.4,11.2l10.2,17.7h-9.5l-5.2-8.9c-.1-.2-.4-.4-.7-.4h-11.1c-.3,0-.5.1-.7.4l-4.6,8L2,11.2h31.4ZM17.4,21.1h9.3l-10,17.3H7.5l10-17.3ZM17.3,39.2h0,0s0,0,0,0ZM34.1,48.1l-4.8-8.1h20.6l4.7,8.1h-20.5ZM49.6,20l-4.7,8.1-10.2-17.7,4.7-8.1,10.2,17.7ZM6.7,1.6h31.4l-4.7,8.1H2L6.7,1.6ZM7.5,40h9.3l15.7,27.2h-9.3l-15.7-27.2ZM56,47.3l-4.7-8.1,15.7-27.2,4.7,8.1-15.7,27.2Z" fill="currentColor"/>
            </svg>`
];

// Build pillars
const pillarsHTML = approach.pillars.map((p, i) =>
  `          <div class="pillar fade-in scale-in">
            ${pillarIcons[i] || ''}
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
          </div>`
).join('\n');

// Build services
const servicesHTML = services.map((s, i) => {
  const num = String(i + 1).padStart(2, '0');
  const deliverables = s.deliverables.map(d =>
    `                    <li>${esc(d)}</li>`
  ).join('\n');
  return `
          <div class="service-row fade-in" data-service>
            <span class="service-number">${num}</span>
            <div class="service-content">
              <div class="service-header">
                <h3>${esc(s.name)}</h3>
                <span class="service-toggle" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </span>
              </div>
              <p class="service-description">${esc(s.description)}</p>
              <div class="service-body">
                <div class="service-body-inner">
                  <h4>${esc(s.listHeading)}</h4>
                  <ul>
${deliverables}
                  </ul>
                </div>
              </div>
            </div>
          </div>`;
}).join('\n');

// Build client categories
const animClasses = ['slide-right', '', 'slide-left'];
const clientsHTML = clients.map((cat, ci) => {
  const clientItems = cat.clients.map(c =>
    `              <li><strong>${esc(c.name)}</strong> <span class="client-location">${esc(c.location)}</span></li>`
  ).join('\n');
  const animClass = animClasses[ci] ? ' ' + animClasses[ci] : '';
  return `
          <div class="client-category fade-in${animClass}">
            <h3 class="category-title">${br(cat.category)}</h3>
            <ul class="client-list">
${clientItems}
            </ul>
          </div>`;
}).join('\n');

// Build bio paragraphs (allow <em> for book titles)
const bioHTML = about.bio.map(p =>
  `              <p>${richEsc(p)}</p>`
).join('\n');

// Phone number for tel: link
const phoneDigits = contact.phone.replace(/\D/g, '');

// ─── Assemble the full HTML ───
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JME Group | Nonprofit Advancement Consulting</title>
  <meta name="description" content="JME Group is a boutique consulting firm in Austin, TX specializing in advancement strategies for nonprofit organizations. Strategic planning, resource development, and community relations.">
  <meta name="keywords" content="nonprofit consulting, strategic planning, resource development, community relations, Austin TX, mission advancement">
  <meta property="og:title" content="JME Group | Nonprofit Advancement Consulting">
  <meta property="og:description" content="Our mission is advancing yours. Boutique consulting for nonprofit organizations.">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%235A8F8F'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='serif' font-size='18' font-weight='600' fill='%23F5F9F8'%3EJ%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <!-- Scroll Progress -->
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

  <!-- Navigation -->
  <nav class="main-nav" id="mainNav">
    <div class="nav-container">
      <a href="#home" class="nav-logo">JME Group</a>
      <div class="nav-links" id="navLinks">
        <button class="nav-close" id="navClose" aria-label="Close navigation menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
        <a href="#home" class="nav-link active">Our Mission</a>
        <a href="#approach" class="nav-link">Our Approach</a>
        <a href="#services" class="nav-link">Services</a>
        <a href="#clients" class="nav-link">Who We Serve</a>
        <a href="#about" class="nav-link">About</a>
        <a href="#contact" class="nav-link nav-cta">Contact</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </nav>

  <main>

    <!-- ==================== HERO ==================== -->
    <section id="home" class="hero-section">
      ${hero.videoWebm || hero.videoMp4 ? `<video class="hero-video" autoplay muted loop playsinline aria-hidden="true">
        ${hero.videoWebm ? `<source src="${esc(hero.videoWebm)}" type="video/webm">` : ''}
        ${hero.videoMp4 ? `<source src="${esc(hero.videoMp4)}" type="video/mp4">` : ''}
      </video>` : ''}
      <div class="container">
        <div class="hero-grid">
          <div class="hero-headline" data-parallax="0.12">
            <h1>
              <span class="hero-line">${esc(hero.headline[0])}</span>
              <span class="hero-line">${esc(hero.headline[1])}</span>
              <span class="hero-line hero-em"><em>${esc(hero.headline[2])}</em></span>
            </h1>
          </div>
          <div class="hero-sidebar fade-in slide-left">
            <div class="testimonial-card">
              <div class="testimonial-nav" aria-label="Testimonial navigation">
${testimonialDots}
              </div>
              <div class="testimonial-carousel" id="testimonialCarousel">
${testimonialSlides}
              </div>
              <a href="#contact" class="btn btn-primary hero-btn">${esc(hero.cta)}</a>
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- ==================== MARQUEE ==================== -->
    <div class="marquee-band" aria-label="Areas of focus">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-sage-mobile.png"><img src="images/wave-sage.png" alt=""></picture>
      <div class="marquee-overflow">
        <div class="marquee-track" id="marqueeTrack">
${marqueeHTML}
        </div>
      </div>
    </div>


    <!-- ==================== MISSION ==================== -->
    <section id="mission" class="section mission-section">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-off-white-mobile.png"><img src="images/wave-off-white.png" alt=""></picture>
      <div class="container">

        <p class="mission-lead text-reveal">${esc(mission.lead)}</p>

        <div class="mission-body fade-in slide-right">
          <p>${esc(mission.body[0])}</p>
          <p>${esc(mission.body[1])}</p>
        </div>
        <div class="stats-row">
${statsHTML}
        </div>

        <div class="mission-cta fade-in">
          <div class="cta-divider" aria-hidden="true"></div>
${ctaHTML}
          <a href="#contact" class="cta-link">${esc(mission.ctaLink)} &rarr;</a>
        </div>

      </div>

    </section>

    <!-- ==================== OUR APPROACH ==================== -->
    <section id="approach" class="section approach-section">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-sage-mobile.png"><img src="images/wave-sage.png" alt=""></picture>
      <div class="container">

        <div class="approach-header">
          <div class="approach-title-block fade-in slide-right">
            <h2 class="approach-title">${approachTitleHTML}</h2>
            <p class="approach-intro">${esc(approach.intro)}</p>
          </div>
          <div class="approach-principles fade-in slide-left">
            <p class="principles-lead">${esc(approach.principlesLead)}</p>
            <ul>
${principlesHTML}
            </ul>
          </div>
        </div>

        <div class="approach-pillars">
${pillarsHTML}
        </div>

      </div>

    </section>

    <!-- ==================== SERVICES ==================== -->
    <section id="services" class="section services-section">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-off-white-mobile.png"><img src="images/wave-off-white.png" alt=""></picture>
      <div class="container">

        <h2 class="section-title fade-in">Our Services</h2>
        <div class="section-title-line" aria-hidden="true"></div>

        <div class="services-list">
${servicesHTML}
        </div>

      </div>

    </section>

    <!-- ==================== WHO WE SERVE ==================== -->
    <section id="clients" class="section clients-section">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-sage-mobile.png"><img src="images/wave-sage.png" alt=""></picture>
      <div class="container">

        <h2 class="section-title fade-in">Who We Serve</h2>
        <div class="section-title-line" aria-hidden="true"></div>
        <p class="section-subtitle fade-in">We have been blessed to serve the following exceptional organizations.</p>

        <div class="client-categories">
${clientsHTML}
        </div>

      </div>

    </section>

    <!-- ==================== ABOUT ==================== -->
    <section id="about" class="section about-section">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-off-white-mobile.png"><img src="images/wave-off-white.png" alt=""></picture>
      <div class="container">

        <div class="about-layout">
          <div class="about-photo-col fade-in slide-right">
            <img src="${esc(about.photo)}" alt="${esc(about.name)}, founder of JME Group" class="about-photo" loading="lazy">
          </div>
          <div class="about-text-col">
            <h2 class="about-name fade-in">${esc(about.name)}</h2>
            <p class="about-role fade-in">${esc(about.role)}</p>
            <p class="about-lead fade-in">${esc(about.lead)}</p>
            <div class="about-body fade-in">
${bioHTML}
            </div>
          </div>
        </div>

      </div>

    </section>

    <!-- ==================== CONTACT ==================== -->
    <section id="contact" class="section contact-section">
      <picture class="section-wave" aria-hidden="true"><source media="(max-width: 680px)" srcset="images/wave-sage-mobile.png"><img src="images/wave-sage.png" alt=""></picture>
      <div class="container">

        <h2 class="section-title fade-in">Get in Touch</h2>
        <div class="section-title-line" aria-hidden="true"></div>

        <div class="contact-content">

          <div class="contact-info fade-in slide-right">
            <p class="contact-intro">${esc(contact.intro)}</p>
            <div class="contact-detail">
              <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <div>
                <span class="contact-label">Phone</span>
                <a href="tel:${phoneDigits}" class="contact-value">${esc(contact.phone)}</a>
              </div>
            </div>
            <div class="contact-detail">
              <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <div>
                <span class="contact-label">Email</span>
                <a href="mailto:${contact.email}" class="contact-value">${esc(contact.email)}</a>
              </div>
            </div>
            <div class="contact-detail">
              <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div>
                <span class="contact-label">Location</span>
                <span class="contact-value">${esc(contact.location)}</span>
              </div>
            </div>
          </div>

          <div class="contact-form-wrapper fade-in slide-left">
            <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="contact-form">
              <input type="hidden" name="form-name" value="contact">
              <p class="visually-hidden">
                <label>Don&rsquo;t fill this out if you&rsquo;re human: <input name="bot-field"></label>
              </p>
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Name</label>
                  <input type="text" id="name" name="name" required autocomplete="name">
                </div>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" required autocomplete="email">
                </div>
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
          </div>

        </div>

      </div>
    </section>

  </main>


  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-body">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo">JME Group</span>
            <p class="footer-tagline">${esc(footer.tagline)}</p>
          </div>
          <div class="footer-contact">
            <a href="tel:${phoneDigits}">${esc(contact.phone)}</a>
            <a href="mailto:${contact.email}">${esc(contact.email)}</a>
            <span>${esc(contact.location)}</span>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} JME Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
`;

fs.writeFileSync('index.html', html);
console.log('Built index.html (' + html.length + ' bytes)');
