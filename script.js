/* Ange Koffi — Portfolio interactions
   Vanilla JS, no dependencies. Everything degrades gracefully. */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------ */
  const loader = $("[data-loader]");
  if (loader) {
    const seen = sessionStorage.getItem("ak-loaded");
    if (seen || reduceMotion) {
      loader.classList.add("is-skipped");
      document.body.classList.add("is-ready");
    } else {
      $$(".loader-word span", loader).forEach((s, i) => s.style.setProperty("--n", i));
      document.body.classList.add("is-locked");
      const finish = () => {
        loader.classList.add("is-done");
        document.body.classList.remove("is-locked");
        document.body.classList.add("is-ready");
        sessionStorage.setItem("ak-loaded", "1");
      };
      const ready = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(() => setTimeout(finish, 1250));
      setTimeout(finish, 3200); // safety net
    }
  }

  /* ------------------------------------------------------------------
     Hero: split letters, rotating word, particle canvas
     ------------------------------------------------------------------ */
  $$("[data-split]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    Array.from(text).forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.style.setProperty("--n", i);
      s.textContent = ch;
      el.appendChild(s);
    });
  });

  const rotator = $("[data-rotator] .rotator-track");
  if (rotator && !reduceMotion) {
    const words = rotator.children.length; // last one duplicates the first
    let idx = 0;
    setInterval(() => {
      idx += 1;
      rotator.style.transition = "transform 700ms cubic-bezier(0.65, 0, 0.35, 1)";
      rotator.style.transform = `translateY(${-idx * 1.3}em)`;
      if (idx === words - 1) {
        setTimeout(() => {
          rotator.style.transition = "none";
          rotator.style.transform = "translateY(0)";
          idx = 0;
        }, 720);
      }
    }, 2400);
  }

  const canvas = $("[data-hero-canvas]");
  if (canvas && !reduceMotion && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.closest(".hero");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let running = false;
    let raf = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 9000);
      particles = Array.from({ length: Math.min(count, 160) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -Math.random() * 0.22 - 0.05,
        a: Math.random() * Math.PI * 2,
        s: Math.random() * 0.02 + 0.005,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.a += p.s;
        p.x += p.vx + Math.sin(p.a) * 0.15;
        p.y += p.vy;
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500) {
          const f = (1 - d2 / 22500) * 0.6;
          p.x += (dx / Math.sqrt(d2 || 1)) * f;
          p.y += (dy / Math.sqrt(d2 || 1)) * f;
        }
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const alpha = 0.25 + Math.sin(p.a * 3) * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246, 212, 114, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      mouseX = -9999;
      mouseY = -9999;
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
      }).observe(hero);
    } else {
      start();
    }
  }

  /* ------------------------------------------------------------------
     Header: scrolled state, hide on scroll down, progress bar
     ------------------------------------------------------------------ */
  const header = $("[data-header]");
  const progress = $("[data-progress]");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle("is-scrolled", y > 24);
    if (!document.body.classList.contains("menu-open")) {
      header?.classList.toggle("is-hidden", y > 320 && y > lastY + 4);
      if (y < lastY - 4) header?.classList.remove("is-hidden");
    }
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    lastY = y;
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  const toggle = $("[data-nav-toggle]");
  const menu = $("[data-mobile-menu]");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    document.body.classList.toggle("is-locked", open);
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (open) header?.classList.remove("is-hidden");
  };
  toggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ------------------------------------------------------------------
     Active nav link
     ------------------------------------------------------------------ */
  const navLinks = $$("[data-nav-link]");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------
     Counters
     ------------------------------------------------------------------ */
  const counters = $$("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ------------------------------------------------------------------
     Cursor glow + hero parallax (desktop only)
     ------------------------------------------------------------------ */
  const glow = $("[data-cursor]");
  const parallaxEls = $$("[data-parallax]");
  const tiltEl = $("[data-tilt]");
  if (finePointer && !reduceMotion) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let gx = mx;
    let gy = my;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let raf = null;

    const loop = () => {
      gx = lerp(gx, mx, 0.12);
      gy = lerp(gy, my, 0.12);
      if (glow) glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
      px = lerp(px, tx, 0.08);
      py = lerp(py, ty, 0.08);
      parallaxEls.forEach((el) => {
        const f = Number(el.dataset.parallax) || 0;
        el.style.translate = `${px * f * 100}px ${py * f * 100}px`;
      });
      if (tiltEl && tiltEl.classList.contains("is-visible")) {
        tiltEl.style.transform = `perspective(1200px) rotateY(${px * 14}deg) rotateX(${-py * 10}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        glow?.classList.add("is-on");
        if (raf === null) raf = requestAnimationFrame(loop);
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", () => glow?.classList.remove("is-on"));
  }

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     Project cards: spotlight + subtle tilt
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        const rx = (0.5 - y) * 5;
        const ry = (x - 0.5) * 5;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        card.style.transitionDuration = "120ms";
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
        card.style.transitionDuration = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     Project filters
     ------------------------------------------------------------------ */
  const filters = $$("[data-filter]");
  const projects = $$("[data-project-grid] .project");
  const empty = $("[data-projects-empty]");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      let shown = 0;
      projects.forEach((p, i) => {
        const match = f === "all" || (p.dataset.cat || "").split(" ").includes(f);
        p.classList.toggle("is-hidden", !match);
        if (match) {
          shown += 1;
          p.classList.remove("is-visible");
          p.style.setProperty("--i", String(Math.min(i, 8)));
          requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("is-visible")));
        }
      });
      if (empty) empty.hidden = shown > 0;
    });
  });

  /* ------------------------------------------------------------------
     Award hover preview (floating image following the cursor)
     ------------------------------------------------------------------ */
  const preview = $("[data-award-preview]");
  const awardList = $("[data-award-list]");
  if (preview && awardList && finePointer && !reduceMotion) {
    const img = $("img", preview);
    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = null;
    const loop = () => {
      cx = lerp(cx, x, 0.14);
      cy = lerp(cy, y, 0.14);
      preview.style.left = `${cx}px`;
      preview.style.top = `${cy}px`;
      raf = requestAnimationFrame(loop);
    };
    $$(".award", awardList).forEach((row) => {
      row.addEventListener("pointerenter", (e) => {
        img.src = row.dataset.image;
        x = cx = e.clientX;
        y = cy = e.clientY;
        preview.classList.add("is-on");
        if (raf === null) raf = requestAnimationFrame(loop);
      });
      row.addEventListener("pointermove", (e) => {
        x = e.clientX + 40;
        y = e.clientY;
      });
      row.addEventListener("pointerleave", () => {
        preview.classList.remove("is-on");
        if (raf !== null) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Gallery: drag to scroll
     ------------------------------------------------------------------ */
  const strip = $("[data-drag-scroll]");
  if (strip && finePointer) {
    let down = false;
    let startX = 0;
    let startScroll = 0;
    strip.addEventListener("pointerdown", (e) => {
      down = true;
      startX = e.clientX;
      startScroll = strip.scrollLeft;
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) strip.classList.add("is-dragging");
      strip.scrollLeft = startScroll - dx;
    });
    const up = () => {
      down = false;
      strip.classList.remove("is-dragging");
    };
    strip.addEventListener("pointerup", up);
    strip.addEventListener("pointercancel", up);
    strip.addEventListener("pointerleave", up);
  }

  /* ------------------------------------------------------------------
     Copy email + toast
     ------------------------------------------------------------------ */
  const toast = $("[data-toast]");
  let toastTimer = null;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  };
  $$("[data-copy]").forEach((btn) => {
    const label = $("[data-copy-label]", btn);
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        showToast("Email copié ✓");
        if (label) {
          label.textContent = "Copié !";
          setTimeout(() => (label.textContent = "Copier l'email"), 2000);
        }
      } catch {
        window.location.href = `mailto:${value}`;
      }
    });
  });

  /* ------------------------------------------------------------------
     Footer: year + Abidjan local time
     ------------------------------------------------------------------ */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const timeEl = $("[data-local-time]");
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan", hour: "2-digit", minute: "2-digit" });
    const tick = () => {
      timeEl.textContent = fmt.format(new Date());
    };
    tick();
    setInterval(tick, 30000);
  }
})();
