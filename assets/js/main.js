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

  /* ---------- Active nav link based on current page ---------- */
  var segs = window.location.pathname.split("/").filter(Boolean);
  var current = segs.length ? segs[0] : "home";
  document.querySelectorAll("[data-nav-link]").forEach(function (a) {
    var target = a.getAttribute("data-nav-link");
    if (target === current) a.classList.add("active");
    else a.classList.remove("active");
  });

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
    });
  });

  /* ---------- Background hero YouTube (autoplay, muted, looping) ---------- */
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
  });

  /* ---------- Current year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
