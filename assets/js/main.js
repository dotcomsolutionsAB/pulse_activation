/* Pulse Activations — shared behaviour */
(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 30) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.classList.toggle("nav-open", isOpen);
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* ---------- Desktop nav dropdowns (click/touch support) ---------- */
  var navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(function (item) {
    var trigger = item.querySelector(".dropdown-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = item.classList.contains("is-open");
      navItems.forEach(function (other) { other.classList.remove("is-open"); });
      if (!isOpen) item.classList.add("is-open");
    });
  });
  document.addEventListener("click", function () {
    navItems.forEach(function (item) { item.classList.remove("is-open"); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") navItems.forEach(function (item) { item.classList.remove("is-open"); });
  });

  /* ---------- Active nav link based on current page ---------- */
  var segs = window.location.pathname.split("/").filter(Boolean);
  var current = segs.length ? segs[0] : "home";
  document.querySelectorAll("[data-nav-link]").forEach(function (a) {
    var target = a.getAttribute("data-nav-link");
    if (target === current) a.classList.add("active");
    else a.classList.remove("active");
  });

  /* ---------- Sector/experience lookup for analytics event context ----------
     Defined here (immediately after `current` is computed) rather than
     further down the file, because the autoplay hero-video code below runs
     synchronously during page load — not from a later click — so it needs
     pageInterest() available right away rather than only by the time click
     handlers can fire. Event naming separates "sector" (an industry/venue
     page — Shopping Centres, Museums, etc.) from "experience" (a format
     page — Quest, Lockbox, AI & Photo, etc.) so GA4 reports can tell which
     kind of intent a click reflects.
  */
  var SECTOR_PAGES = {
    "shopping-centres": "Shopping Centres",
    "sports-stadiums": "Sports & Stadiums",
    "hotels-resorts": "Hotels & Resorts",
    "marinas-waterfronts": "Marinas & Waterfronts",
    "visitor-attractions": "Visitor Attractions",
    "museums": "Museums",
    "agencies-brands": "Agencies & Brands",
    "awards-branding": "Award Ceremonies & Branding",
  };
  var EXPERIENCE_PAGES = {
    "quest": "Quest",
    "lockbox": "Lockbox",
    "digital-games": "Interactive Digital Games",
    "ai-photo": "AI & Photo Experiences",
    "seasonal-experiences": "Seasonal Experiences",
    "bespoke-builds": "Bespoke Builds",
  };
  function pageInterest() {
    if (SECTOR_PAGES[current]) return { interest_type: "sector", interest_name: SECTOR_PAGES[current] };
    if (EXPERIENCE_PAGES[current]) return { interest_type: "experience", interest_name: EXPERIENCE_PAGES[current] };
    return { interest_type: "other", interest_name: current };
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- YouTube embed helpers ----------
     YouTube embeds only work reliably when the page is served over
     http(s) — opening the HTML file directly (file://) or embedding a
     video an owner has restricted to certain domains will surface a
     "Video player configuration error" (error 153) inside the iframe.
     We use the standard youtube.com embed domain (broader compatibility
     than youtube-nocookie.com for domain-restricted videos), pass a
     same-origin "origin" parameter whenever we're on http/https, and
     always provide a "Watch on YouTube" fallback link so a visitor is
     never stuck looking at YouTube's raw error state.
  */
  var pageOrigin =
    window.location.protocol === "http:" || window.location.protocol === "https:"
      ? window.location.origin
      : "";

  /* ---------- Lazy YouTube embeds ----------
     Markup:
     <div class="video-wrap rounded" data-yt="VIDEO_ID">
       <img class="video-thumb" src="..." alt="">
       <span class="play-btn">...</span>
       <span class="vlabel">Label</span>
     </div>
  */
  document.querySelectorAll("[data-yt]").forEach(function (wrap) {
    var id = wrap.getAttribute("data-yt");

    // Persistent "Watch on YouTube" fallback — always available, even if
    // the inline embed can't play for this video/browser/environment.
    var fallback = document.createElement("a");
    fallback.className = "yt-fallback";
    fallback.href = "https://www.youtube.com/watch?v=" + id;
    fallback.target = "_blank";
    fallback.rel = "noopener";
    fallback.textContent = "Watch on YouTube ↗";
    fallback.addEventListener("click", function (e) {
      e.stopPropagation();
    });
    wrap.appendChild(fallback);

    wrap.addEventListener("click", function loadVideo(e) {
      if (e.target === fallback) return;
      var src =
        "https://www.youtube.com/embed/" +
        id +
        "?autoplay=1&rel=0&modestbranding=1&playsinline=1" +
        (pageOrigin ? "&origin=" + encodeURIComponent(pageOrigin) : "");
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", src);
      iframe.setAttribute("title", "Pulse Activations video");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      );
      iframe.setAttribute("allowfullscreen", "");
      wrap.innerHTML = "";
      wrap.appendChild(iframe);
      wrap.appendChild(fallback); // keep the fallback link on top as a safety net
      wrap.removeEventListener("click", loadVideo);
      var ctx = pageInterest();
      trackEvent("video_play", {
        video_id: id,
        interest_type: ctx.interest_type,
        interest_name: ctx.interest_name,
      });
    });
  });

  /* ---------- Background hero YouTube (autoplay, muted, looping) ----------
     Skipped entirely for visitors who have asked for reduced motion, or
     whose connection reports Save-Data / a slow effective type — those
     visitors get the static poster image (already set as the element's
     background-image) instead of an autoplaying video iframe. This keeps
     the hero honest about bandwidth and respects prefers-reduced-motion
     rather than forcing motion on everyone regardless of their settings.
  */
  var prefersReducedMotion =
    "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  var prefersReducedData =
    !!conn &&
    (conn.saveData === true ||
      conn.effectiveType === "slow-2g" ||
      conn.effectiveType === "2g" ||
      conn.effectiveType === "3g");

  if (!prefersReducedMotion && !prefersReducedData) {
    document.querySelectorAll("[data-yt-bg]").forEach(function (el) {
      var id = el.getAttribute("data-yt-bg");
      var src =
        "https://www.youtube.com/embed/" +
        id +
        "?autoplay=1&mute=1&loop=1&playlist=" +
        id +
        "&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1" +
        (pageOrigin ? "&origin=" + encodeURIComponent(pageOrigin) : "");
      var iframe = document.createElement("iframe");
      iframe.className = "yt-cover yt-bg-frame";
      iframe.setAttribute("src", src);
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("tabindex", "-1");
      el.appendChild(iframe);
      var ctx = pageInterest();
      trackEvent("video_play", {
        video_id: id,
        video_context: "hero_background_autoplay",
        interest_type: ctx.interest_type,
        interest_name: ctx.interest_name,
      });
    });
  } else {
    // Mark the element so CSS can, if desired, tweak the static-poster
    // presentation (e.g. a subtle "video paused for you" affordance).
    document.querySelectorAll("[data-yt-bg]").forEach(function (el) {
      el.classList.add("hero-bg-static");
    });
  }

  /* ---------- Current year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Analytics (GA4) — loaded only after cookie consent ----------
     Replace GA_MEASUREMENT_ID below with your real GA4 Measurement ID
     (sign up free at analytics.google.com, create a GA4 property, and swap
     the ID here). Until then no analytics script is ever loaded — this is
     intentional: the site should not fetch or run a tracking script for a
     visitor who hasn't consented.
  */
  var GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
  var analyticsLoaded = false;
  function loadAnalytics() {
    if (analyticsLoaded || GA_MEASUREMENT_ID.indexOf("XXXX") !== -1) return;
    analyticsLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);
  }
  function trackEvent(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  /* ---------- Cookie consent banner ---------- */
  (function () {
    var banner = document.getElementById("cookieBanner");
    var STORAGE_KEY = "pulse_cookie_consent";

    var stored;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      stored = null; // localStorage unavailable (private browsing, etc.)
    }

    if (stored === "accepted") loadAnalytics();

    if (!banner) return;
    var acceptBtn = document.getElementById("cookieAccept");
    var declineBtn = document.getElementById("cookieDecline");

    function hideBanner() {
      banner.classList.remove("is-visible");
    }
    function setConsent(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (e) {
        /* ignore — nothing more we can do */
      }
      if (value === "accepted") loadAnalytics();
      hideBanner();
    }

    if (!stored) {
      // Show after a brief delay so it doesn't block first paint.
      window.setTimeout(function () {
        banner.classList.add("is-visible");
      }, 600);
    }

    if (acceptBtn) acceptBtn.addEventListener("click", function () { setConsent("accepted"); });
    if (declineBtn) declineBtn.addEventListener("click", function () { setConsent("declined"); });
  })();

  /* ---------- Contact form: real submission, confirmation, spam protection ----------
     Markup expected:
     <form id="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
       <input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off"> (honeypot)
       ...fields...
       <button type="submit" id="contact-submit">Send Enquiry</button>
       <div id="contact-form-success" hidden>...</div>
       <div id="contact-form-error" hidden>...</div>
     </form>
     Spam protection: a honeypot field bots tend to fill in, plus a minimum
     time-on-page check (genuine visitors take more than a couple of seconds
     to fill in a form; bots that submit instantly are silently discarded).
  */
  (function () {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var loadTime = Date.now();
    var submitBtn = document.getElementById("contact-submit");
    var successEl = document.getElementById("contact-form-success");
    var errorEl = document.getElementById("contact-form-error");
    var noteEl = document.getElementById("contact-form-note");
    var MIN_FILL_TIME_MS = 2500;

    function showSuccess() {
      form.hidden = true;
      if (noteEl) noteEl.hidden = true;
      if (successEl) successEl.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;

      // The form carries novalidate so we control validation UX ourselves —
      // this is what actually enforces required fields (name, email, message,
      // consent) rather than leaving them decorative.
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var honeypot = form.querySelector('[name="_gotcha"]');
      var elapsed = Date.now() - loadTime;
      var looksLikeSpam = (honeypot && honeypot.value) || elapsed < MIN_FILL_TIME_MS;

      if (looksLikeSpam) {
        // Don't tip off the bot — show success without actually submitting.
        showSuccess();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            trackEvent("generate_lead", { form_name: "contact_form" });
            showSuccess();
          } else {
            throw new Error("Submission failed");
          }
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Enquiry";
          }
        });
    });
  })();

  /* ---------- Discovery call booking: conversion tracking ---------- */
  document.querySelectorAll("[data-discovery-call]").forEach(function (el) {
    el.addEventListener("click", function () {
      trackEvent("book_discovery_call", { link_text: el.textContent.trim() });
    });
  });

  // CTA button clicks — every .btn sitewide (primary/outline/ghost), tagged
  // with its destination and label plus which sector/experience page it was
  // clicked from.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".btn");
    if (btn && !btn.hasAttribute("data-discovery-call")) {
      var ctx = pageInterest();
      trackEvent("cta_click", {
        cta_text: btn.textContent.trim(),
        cta_href: btn.getAttribute("href") || "",
        interest_type: ctx.interest_type,
        interest_name: ctx.interest_name,
      });
    }
  });

  // Phone number clicks (tel: links) — sitewide, including ones that aren't
  // styled as a .btn (header nav-phone, contact card, mobile bar, footer).
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="tel:"]');
    if (link) {
      var ctx = pageInterest();
      trackEvent("click_phone", {
        link_text: link.textContent.trim(),
        interest_type: ctx.interest_type,
        interest_name: ctx.interest_name,
      });
    }
  });

  // Email link clicks (mailto: links).
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="mailto:"]');
    if (link) {
      var ctx = pageInterest();
      trackEvent("click_email", {
        link_text: link.textContent.trim(),
        interest_type: ctx.interest_type,
        interest_name: ctx.interest_name,
      });
    }
  });

  // Brochure / document downloads — no brochure file exists on the site yet,
  // so this listener currently has nothing to attach to and will not fire.
  // It's wired up so that as soon as a real PDF/brochure link is added
  // anywhere (either via href ending in a document extension, or an
  // explicit data-track-download attribute), it starts tracking with no
  // further code changes needed.
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[data-track-download], a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]');
    if (link) {
      var ctx = pageInterest();
      trackEvent("file_download", {
        link_text: link.textContent.trim(),
        file_url: link.getAttribute("href") || "",
        interest_type: ctx.interest_type,
        interest_name: ctx.interest_name,
      });
    }
  });
})();
