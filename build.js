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
const ctaHTML = mission.ctaQuestions.map((q, i) => {
  if (i === mission.ctaQuestions.length - 1) {
    // Last question gets word-by-word reveal spans
    const words = q.split(' ').map(w => `<span class="prove-word">${esc(w)}</span>`).join(' ');
    return `          <p class="cta-question cta-prove"><em>${words}</em></p>`;
  }
  return `          <p class="cta-question">${esc(q)}</p>`;
}).join('\n');

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
  `<svg class="pillar-icon" aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="m84.145 25.043-9.1875-9.1875c-0.14453-0.14844-0.34375-0.23047-0.55078-0.23047h-58c-0.20703 0-0.40625 0.082031-0.55078 0.23047-0.14844 0.14453-0.23047 0.34375-0.23047 0.55078v58c0 0.20703 0.082031 0.40625 0.23047 0.55078l9.1875 9.1875c0.14453 0.14844 0.34375 0.23047 0.55078 0.23047h58c0.20703 0 0.40625-0.082031 0.55078-0.23047 0.14844-0.14453 0.23047-0.34375 0.23047-0.55078v-58c0-0.20703-0.082031-0.40625-0.23047-0.55078zm-21.039 10.508h-26.664l-8.9883-9.1758h35.652zm0 1.5625v25.777h-26.211v-25.777zm-26.211 27.34h26.664l8.9883 9.1719h-35.652zm-19.707-47.266h56.438v55.305l-8.957-9.1406v-37.758c0-0.20703-0.082031-0.40625-0.22656-0.55078-0.14844-0.14844-0.34766-0.23047-0.55469-0.23047h-38.293c-0.20703 0-0.40625 0.082031-0.55078 0.23047-0.14844 0.14453-0.23047 0.34375-0.23047 0.55078v56.113l-7.625-7.625zm65.625 65.625h-56.438v-55.305l8.957 9.1406v37.758c0 0.20703 0.082031 0.40625 0.23047 0.55078 0.14453 0.14844 0.34375 0.23047 0.55078 0.23047h38.293c0.20703 0 0.40625-0.082031 0.55078-0.23047 0.14844-0.14453 0.23047-0.34375 0.23047-0.55078v-56.113l7.625 7.625z" fill="currentColor"/>
            </svg>`,
  `<svg class="pillar-icon" aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="m86.613 35.328-5.5625-9.6523c-0.14062-0.24219-0.39844-0.39062-0.67578-0.39062h-21.57l-5.3438-9.2695c-0.13672-0.24219-0.39453-0.39062-0.67578-0.39062h-33.156c-0.27734 0-0.53516 0.14844-0.67578 0.39062l-5.5664 9.6602c-0.14062 0.24219-0.14062 0.53906 0 0.78125l10.785 18.715-5.3398 9.2656c-0.13672 0.24219-0.13672 0.53906 0 0.78125l16.578 28.766c0.14062 0.24219 0.39844 0.39062 0.67578 0.39062h11.137c0.27734 0 0.53516-0.14844 0.67578-0.39062l10.785-18.715h10.676c0.28125 0 0.53906-0.14848 0.67578-0.39062l16.578-28.766v-0.003906c0.14062-0.24219 0.14062-0.53906 0-0.78125zm-7.5938-8.4805-15.672 27.199h-20.609l4.6797-7.9688h10.883c0.27734 0 0.53906-0.14848 0.67578-0.39062l5.5664-9.6602c0.14062-0.24219 0.14062-0.53906 0-0.78125l-4.8398-8.3984zm-47.473 27.98 9.9609-17.285 4.5547 7.7578-5.3633 9.1289c-0.14453 0.24609-0.14453 0.54687 0 0.79297l5.6719 9.6602c0.14062 0.23828 0.39453 0.38672 0.67188 0.38672h9.8398l-9.6602 16.758zm15.223-27.98 10.184 17.668h-9.5391l-5.2383-8.9258c-0.14062-0.23828-0.39844-0.38281-0.67578-0.38281h-11.133c-0.27734 0-0.53906 0.14844-0.67578 0.39062l-4.6172 8.0117-9.6602-16.762zm-15.949 9.9219h9.3281l-9.957 17.277h-9.3281zm-0.17969 18.055h0.003906l-0.003906 0.003906zm16.852 8.8828-4.7539-8.0977h20.602l4.668 8.0977zm16.301-8.875zm-0.82812-19.195-4.6641 8.0977-10.18-17.668 4.6641-8.0938zm-42.883-18.449h31.352l-4.668 8.0977h-31.352zm0.78125 38.422h9.332l15.676 27.203h-9.332zm48.496 7.3125-4.6602-8.0898 15.676-27.199 4.6602 8.0898z" fill="currentColor"/>
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
        <a href="#home" class="nav-link active">Home</a>
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

    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C240,65 480,5 720,35 C960,65 1200,10 1440,40 L1440,80 L0,80 Z" fill="#F5F9F8"/>
      </svg>
    </div>

    <!-- ==================== MARQUEE ==================== -->
    <div class="marquee-band" aria-label="Areas of focus">
      <div class="marquee-track" id="marqueeTrack">
${marqueeHTML}
      </div>
    </div>


    <!-- ==================== MISSION ==================== -->
    <section id="mission" class="section mission-section">
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

    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,50 C360,10 720,70 1080,20 C1260,0 1380,30 1440,25 L1440,80 L0,80 Z" fill="#F5F9F8"/>
      </svg>
    </div>

    <!-- ==================== OUR APPROACH ==================== -->
    <section id="approach" class="section approach-section">
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

    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,20 C180,55 540,5 720,40 C900,75 1260,15 1440,45 L1440,80 L0,80 Z" fill="#E8F0EE"/>
      </svg>
    </div>

    <!-- ==================== SERVICES ==================== -->
    <section id="services" class="section services-section">
      <div class="container">

        <h2 class="section-title fade-in">Our Services</h2>
        <div class="section-title-line" aria-hidden="true"></div>

        <div class="services-list">
${servicesHTML}
        </div>

      </div>

    </section>

    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C360,70 720,10 1080,50 C1260,65 1380,30 1440,35 L1440,80 L0,80 Z" fill="#F5F9F8"/>
      </svg>
    </div>

    <!-- ==================== WHO WE SERVE ==================== -->
    <section id="clients" class="section clients-section">
      <div class="container">

        <h2 class="section-title fade-in">Who We Serve</h2>
        <div class="section-title-line" aria-hidden="true"></div>
        <p class="section-subtitle fade-in">We have been blessed to serve the following exceptional organizations.</p>

        <div class="client-categories">
${clientsHTML}
        </div>

      </div>

    </section>

    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,25 C240,60 600,5 840,40 C1080,75 1320,20 1440,45 L1440,80 L0,80 Z" fill="#E8F0EE"/>
      </svg>
    </div>

    <!-- ==================== ABOUT ==================== -->
    <section id="about" class="section about-section">
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

    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,45 C300,15 600,65 900,25 C1200,0 1380,50 1440,35 L1440,80 L0,80 Z" fill="#F5F9F8"/>
      </svg>
    </div>

    <!-- ==================== CONTACT ==================== -->
    <section id="contact" class="section contact-section">
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
    <div class="footer-wave" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C300,60 600,10 900,45 C1200,75 1380,20 1440,40 L1440,80 L0,80 Z" fill="#0F1F25"/>
      </svg>
    </div>
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
