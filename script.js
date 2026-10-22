(() => {
  'use strict';

  const siteHeader = document.querySelector('.site-header');
  // The navigation wraps on mobile, so anchor targets must clear its actual height.
  const headerOffset = () => Math.ceil(siteHeader.getBoundingClientRect().height) + 8;

  // ============ reveal on scroll ============
  // threshold must stay 0: several .reveal elements (the sticky sidebar, long
  // sections) are far taller than the viewport and can never cross a ratio
  // above ~0.08, so any non-zero threshold leaves them stuck at opacity 0.
  const revealTargets = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -8% 0px' }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  // ============ nav active state ============
  const sections = [...document.querySelectorAll('[data-section]')];
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];
  const linkFor = new Map(
    navLinks.map((link) => [link.getAttribute('href').slice(1), link])
  );

  let ticking = false;

  const syncNav = () => {
    ticking = false;
    const line = headerOffset() + 12;
    let current = sections[0];

    for (const section of sections) {
      // last section whose top edge has passed the header line
      if (section.getBoundingClientRect().top <= line) current = section;
    }

    // near the bottom the final section may never reach the line
    const atBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
    if (atBottom) current = sections[sections.length - 1];

    navLinks.forEach((link) => link.classList.remove('is-active'));
    const active = current && linkFor.get(current.id);
    if (active) active.classList.add('is-active');
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncNav);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  syncNav();

  // ============ anchor scrolling with header offset ============
  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return false;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    return true;
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (ev) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      ev.preventDefault();
      // make the jump target focusable for keyboard and screen-reader users
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      scrollToId(id);
      target.focus({ preventScroll: true });
      history.replaceState(null, '', '#' + id);
    });
  });

  // ============ deep link on load ============
  if (location.hash.length > 1) {
    requestAnimationFrame(() => scrollToId(location.hash.slice(1)));
  }

  // ============ video carousels ============
  // Each carousel keeps every clip in the DOM but only ever gives the active one
  // a real src, so a project with seven takes still costs one video download.
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const slides = [...root.querySelectorAll('.vcarousel-slide')];
    if (!slides.length) return;

    const prev = root.querySelector('.vcarousel-prev');
    const next = root.querySelector('.vcarousel-next');
    const counter = root.querySelector('.vcarousel-counter');
    const dots = [...root.querySelectorAll('.vcarousel-dot')];
    const label = root.querySelector('.vcarousel-label');
    let index = 0;

    const load = (slide) => {
      const video = slide.querySelector('video');
      if (!video || video.dataset.loaded) return;
      // <source data-src> keeps the browser from fetching all of them up front
      video.querySelectorAll('source[data-src]').forEach((s) => {
        s.src = s.dataset.src;
        s.removeAttribute('data-src');
      });
      video.load();
      video.dataset.loaded = '1';
    };

    const show = (target, { autoplay = false } = {}) => {
      const count = slides.length;
      index = ((target % count) + count) % count;

      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        const video = slide.querySelector('video');
        if (!video) return;
        if (active) {
          load(slide);
          if (autoplay) video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });

      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      if (counter) counter.textContent = index + 1 + ' / ' + slides.length;
      if (label) label.textContent = slides[index].dataset.label || '';
    };

    if (prev) prev.addEventListener('click', () => show(index - 1, { autoplay: true }));
    if (next) next.addEventListener('click', () => show(index + 1, { autoplay: true }));
    dots.forEach((dot, i) =>
      dot.addEventListener('click', () => show(i, { autoplay: true }))
    );

    // arrow keys once the carousel has focus
    root.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        show(index - 1, { autoplay: true });
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        show(index + 1, { autoplay: true });
      }
    });

    // load the first clip only when the carousel is actually near the viewport
    const lazy = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          load(slides[index]);
          obs.disconnect();
        });
      },
      { threshold: 0, rootMargin: '200px 0px' }
    );
    lazy.observe(root);

    // pause whatever is playing once it scrolls out of view
    const offscreen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) return;
          const video = slides[index].querySelector('video');
          if (video && !video.paused) video.pause();
        });
      },
      { threshold: 0 }
    );
    offscreen.observe(root);

    show(0);
  });
})();
