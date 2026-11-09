/* Scopus Research Publishers — site interactions (no dependencies) */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mqMobile = window.matchMedia("(max-width: 1080px)");

  /* ---------- Header shadow on scroll + floating WhatsApp ---------- */
  var header = document.querySelector(".site-header");
  var wa = document.querySelector(".wa-float");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (wa) wa.classList.toggle("is-visible", y > window.innerHeight * 0.6);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setNav(!document.body.classList.contains("nav-open"));
    });
  }
  // Close the drawer when a real link is followed
  // (the Services toggle is excluded: it only opens its submenu)
  document.querySelectorAll(".primary-nav a:not(.has-mega > .nav-link)").forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); closeMega(); });
  });
  mqMobile.addEventListener && mqMobile.addEventListener("change", function (e) {
    if (!e.matches) setNav(false);
    closeMega();
  });

  /* ---------- Services mega menu ---------- */
  var megaItem = document.querySelector(".has-mega");
  var megaBtn = megaItem ? megaItem.querySelector(".nav-link") : null;
  var hoverTimer;
  function openMega() {
    if (!megaItem) return;
    megaItem.classList.add("is-open");
    megaBtn.setAttribute("aria-expanded", "true");
  }
  function closeMega() {
    if (!megaItem) return;
    megaItem.classList.remove("is-open");
    megaBtn.setAttribute("aria-expanded", "false");
  }
  if (megaItem) {
    megaBtn.addEventListener("click", function (e) {
      e.preventDefault();
      megaItem.classList.contains("is-open") ? closeMega() : openMega();
    });
    megaItem.addEventListener("mouseenter", function () {
      if (mqMobile.matches) return;
      clearTimeout(hoverTimer); openMega();
    });
    megaItem.addEventListener("mouseleave", function () {
      if (mqMobile.matches) return;
      hoverTimer = setTimeout(closeMega, 160);
    });
    document.addEventListener("click", function (e) {
      if (!mqMobile.matches && !megaItem.contains(e.target)) closeMega();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (megaItem && megaItem.classList.contains("is-open")) { closeMega(); megaBtn.focus(); }
      if (document.body.classList.contains("nav-open")) { setNav(false); toggle && toggle.focus(); }
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-img");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count-up metrics ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var start = null, dur = 1600;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- FAQ: smooth accordion, one open at a time ---------- */
  var items = document.querySelectorAll(".faq-item");
  items.forEach(function (item) {
    var summary = item.querySelector("summary");
    var answer = item.querySelector(".faq-answer");
    summary.addEventListener("click", function (e) {
      if (reduceMotion || !answer.animate) {
        // let the browser toggle natively, but still close the others
        if (!item.open) items.forEach(function (o) { if (o !== item) o.open = false; });
        return;
      }
      e.preventDefault();
      if (item.open) {
        collapse(item, answer);
      } else {
        items.forEach(function (o) { if (o !== item && o.open) collapse(o, o.querySelector(".faq-answer")); });
        item.open = true;
        var h = answer.scrollHeight;
        answer.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.22,.61,.36,1)" });
      }
    });
  });
  function collapse(item, answer) {
    var h = answer.scrollHeight;
    var anim = answer.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 320, easing: "cubic-bezier(.22,.61,.36,1)" });
    anim.onfinish = function () { item.open = false; };
  }

  /* ---------- Highlight the current section in the menu ---------- */
  var page = document.body.getAttribute("data-page");
  if (page) {
    document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) { a.setAttribute("aria-current", "page"); });
  }

  /* ---------- Blog index: live search filter ---------- */
  var search = document.querySelector("[data-post-search]");
  if (search) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-post-card]"));
    var empty = document.querySelector("[data-post-empty]");
    var count = document.querySelector("[data-post-count]");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var hit = !q || c.getAttribute("data-post-card").indexOf(q) !== -1;
        c.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (count) count.textContent = shown;
    });
  }

  /* ---------- Article: copy link ---------- */
  document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var done = function () {
        var label = btn.querySelector("span");
        if (!label) return;
        var old = label.textContent; label.textContent = "Link copied";
        setTimeout(function () { label.textContent = old; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done);
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");
    var submit = form.querySelector('button[type="submit"]');
    function setStatus(type, msg) {
      status.hidden = false;
      status.className = "form-status form-status--" + type;
      status.textContent = msg;
    }
    // Result of a non-JavaScript submission (send.php redirects back here)
    if (/[?&]sent=1/.test(location.search)) setStatus("ok", "Thank you — your message has been sent. A specialist will reply shortly.");
    if (/[?&]error=1/.test(location.search)) setStatus("error", "Sorry, the message could not be sent. Please email info@scopusresearchpublishers.com or message us on WhatsApp.");
    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return;            // let the browser show field errors
      if (!window.fetch || location.protocol === "file:") return; // fall back to a normal POST
      e.preventDefault();
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            setStatus("ok", "Thank you — your message has been sent. A specialist will reply shortly.");
          } else {
            setStatus("error", (res && res.error) || "Sorry, the message could not be sent. Please email info@scopusresearchpublishers.com or message us on WhatsApp.");
          }
        })
        .catch(function () {
          setStatus("error", "Sorry, the message could not be sent. Please email info@scopusresearchpublishers.com or message us on WhatsApp.");
        })
        .then(function () { submit.disabled = false; submit.removeAttribute("aria-busy"); });
    });
  }

  /* ---------- Current year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
