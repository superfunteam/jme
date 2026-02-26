document.addEventListener('DOMContentLoaded', () => {

  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const progressBar = document.getElementById('scrollProgress');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ── Scroll progress bar ──
  function updateProgress() {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }


  // ── Nav background on scroll ──
  function updateNav() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }


  // ── Hero parallax ──
  const heroHeadline = document.querySelector('[data-parallax]');
  function updateParallax() {
    if (prefersReducedMotion || !heroHeadline) return;
    const rate = parseFloat(heroHeadline.dataset.parallax);
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroHeadline.style.transform = `translateY(${scrollY * rate}px)`;
    }
  }


  // ── Marquee scroll-linked movement ──
  const marqueeTrack = document.getElementById('marqueeTrack');
  let marqueeBasePos = 0;
  let marqueeScrollOffset = 0;
  let lastScrollY = window.scrollY;

  function updateMarquee() {
    if (!marqueeTrack) return;

    // Constant drift
    marqueeBasePos -= 0.4;

    // Seamless loop
    const halfWidth = marqueeTrack.scrollWidth / 2;
    if (halfWidth > 0) {
      const totalOffset = marqueeBasePos + marqueeScrollOffset;
      const normalizedOffset = ((totalOffset % halfWidth) + halfWidth) % halfWidth;
      marqueeTrack.style.transform = `translateX(${-normalizedOffset}px)`;
    }

    requestAnimationFrame(updateMarquee);
  }

  function onScrollMarquee() {
    const delta = window.scrollY - lastScrollY;
    marqueeScrollOffset += delta * 0.3;
    lastScrollY = window.scrollY;
  }


  // ── Text reveal (word-by-word opacity) ──
  function initTextReveal() {
    document.querySelectorAll('.text-reveal').forEach(el => {
      const text = el.textContent.trim();
      el.innerHTML = text.split(/\s+/).map((word, i) =>
        `<span class="reveal-word" style="--word-i:${i}">${word}</span>`
      ).join(' ');
      el.dataset.wordCount = text.split(/\s+/).length;
    });
  }

  function updateTextReveal() {
    document.querySelectorAll('.text-reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const wordCount = parseInt(el.dataset.wordCount) || 1;

      // Progress: 0 when element enters viewport, 1 when it's fully in view
      const startThreshold = viewH * 0.85;
      const endThreshold = viewH * 0.3;
      const progress = Math.max(0, Math.min(1,
        (startThreshold - rect.top) / (startThreshold - endThreshold)
      ));

      const wordsToReveal = Math.floor(progress * wordCount * 1.2);
      el.querySelectorAll('.reveal-word').forEach((word, i) => {
        word.style.opacity = i < wordsToReveal ? '1' : '0.12';
      });
    });
  }


  // ── Counter animation ──
  function animateCounter(el) {
    const numberEl = el.querySelector('.stat-number');
    if (!numberEl || numberEl.dataset.animated) return;
    numberEl.dataset.animated = 'true';

    const target = parseInt(numberEl.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      numberEl.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }


  // ── Service row expand/collapse ──
  document.querySelectorAll('[data-service]').forEach(row => {
    const header = row.querySelector('.service-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const wasExpanded = row.classList.contains('expanded');

      // Close all others
      document.querySelectorAll('[data-service].expanded').forEach(other => {
        if (other !== row) other.classList.remove('expanded');
      });

      row.classList.toggle('expanded', !wasExpanded);
    });
  });


  // ── Intersection Observer: fade-in, slide, scale ──
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);

          // Trigger counter if stat
          if (entry.target.hasAttribute('data-counter')) {
            animateCounter(entry.target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  }


  // ── Unified scroll handler ──
  function onScroll() {
    updateProgress();
    updateNav();
    updateParallax();
    onScrollMarquee();
    updateTextReveal();
  }

  window.addEventListener('scroll', onScroll, { passive: true });


  // ── Mobile menu toggle ──
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });


  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      const navHeight = nav.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });


  // ── Active nav link on scroll ──
  const sections = document.querySelectorAll('section[id]');
  const navLinksList = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    const scrollY = window.scrollY + nav.offsetHeight + 100;
    let current = '';
    sections.forEach(section => {
      if (scrollY >= section.offsetTop) {
        current = section.getAttribute('id');
      }
    });
    navLinksList.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });


  // ── Testimonial carousel ──
  const carousel = document.getElementById('testimonialCarousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.testimonial-dot');
    let currentSlide = 0;
    let carouselTimer = null;

    function showSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      currentSlide = index;
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
      showSlide((currentSlide + 1) % slides.length);
    }

    function startCarousel() {
      carouselTimer = setInterval(nextSlide, 6000);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        clearInterval(carouselTimer);
        showSlide(parseInt(dot.dataset.slide));
        startCarousel();
      });
    });

    if (!prefersReducedMotion) {
      startCarousel();
    }
  }


  // ── Init ──
  initTextReveal();
  updateNav();
  updateProgress();
  updateActiveLink();

  if (!prefersReducedMotion) {
    requestAnimationFrame(updateMarquee);
  }

});
