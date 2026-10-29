/* Ange Koffi, portfolio
   Vanilla JS, sans dépendance. Le contenu reste lisible si ce fichier échoue. */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

  /* ------------------------------------------------------------------
     Thème clair / sombre
     ------------------------------------------------------------------ */
  const themeToggle = $("[data-theme-toggle]");
  const currentTheme = () => root.dataset.theme || (prefersLight.matches ? "light" : "dark");
  const syncThemeToggle = () => {
    const next = currentTheme() === "dark" ? "clair" : "sombre";
    themeToggle?.setAttribute("aria-label", `Passer en thème ${next}`);
  };
  const applyTheme = (next) => {
    root.dataset.theme = next;
    try {
      localStorage.setItem("ak-theme", next);
    } catch {}
    syncThemeToggle();
  };
  themeToggle?.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }
    // Le nouveau thème s'ouvre en cercle depuis le bouton.
    const r = themeToggle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    root.classList.add("vt-theme");
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.finished.finally(() => root.classList.remove("vt-theme"));
  });
  prefersLight.addEventListener("change", syncThemeToggle);
  syncThemeToggle();

  /* ------------------------------------------------------------------
     Titres découpés en mots (ou en lettres) pour la révélation masquée
     ------------------------------------------------------------------ */
  const splitText = (el) => {
    const byChar = el.dataset.split === "chars";
    let index = 0;
    const wrap = (text) => {
      const outer = document.createElement("span");
      const inner = document.createElement("span");
      outer.className = "w";
      outer.setAttribute("aria-hidden", "true");
      inner.textContent = text;
      inner.style.setProperty("--wi", String(index++));
      outer.appendChild(inner);
      return outer;
    };
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else if (byChar) Array.from(part).forEach((ch) => frag.appendChild(wrap(ch)));
          else frag.appendChild(wrap(part));
        });
        child.replaceWith(frag);
      });
    };
    // Le texte reste lisible d'un bloc pour les lecteurs d'écran.
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    el.classList.add("is-split");
  };
  if (!reduceMotion) $$("[data-split]").forEach(splitText);

  /* ------------------------------------------------------------------
     Libellés de bouton qui roulent au survol
     ------------------------------------------------------------------ */
  $$("[data-roll]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    const a = document.createElement("span");
    const b = document.createElement("span");
    a.textContent = text;
    b.textContent = text;
    b.setAttribute("aria-hidden", "true");
    el.append(a, b);
  });

  /* ------------------------------------------------------------------
     En-tête : fond au défilement, escamoté en descendant
     ------------------------------------------------------------------ */
  const header = $("[data-header]");
  let ticking = false;
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 8);
    if (!document.body.classList.contains("menu-open")) {
      if (y > 480 && y > lastY + 6) header?.classList.add("is-hidden");
      else if (y < lastY - 6 || y <= 480) header?.classList.remove("is-hidden");
    }
    lastY = y;
    ticking = false;
  };
  header?.addEventListener("focusin", () => header.classList.remove("is-hidden"));
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
     Menu mobile
     ------------------------------------------------------------------ */
  const toggle = $("[data-nav-toggle]");
  const menu = $("[data-mobile-menu]");
  const setMenu = (open) => {
    if (!menu || !toggle) return;
    document.body.classList.toggle("menu-open", open);
    document.body.classList.toggle("is-locked", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
    } else {
      menu.classList.remove("is-open");
      menu.hidden = true;
    }
  };
  $$("nav a", menu || undefined).forEach((a, k) => a.style.setProperty("--k", String(k)));
  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  $$("a", menu || undefined).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
      setMenu(false);
      toggle?.focus();
    }
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ------------------------------------------------------------------
     Lien de navigation actif
     ------------------------------------------------------------------ */
  const navLinks = $$("[data-nav-link]");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => {
            const active = a.getAttribute("href") === `#${entry.target.id}`;
            a.classList.toggle("is-active", active);
            if (active) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------------------------
     Apparition au défilement
     ------------------------------------------------------------------ */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (targets.get(entry.target) || []).forEach((el) => el.classList.add("is-visible"));
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    // Un élément masqué par clip-path n'a aucune surface visible pour l'observateur :
    // on observe son parent à sa place.
    const targets = new Map();
    revealEls.forEach((el) => {
      let target = el.dataset.reveal === "mask" ? el.parentElement : el;
      // Un parent en display: contents n'a pas de boîte et ne croise jamais l'écran.
      while (target.parentElement && getComputedStyle(target).display === "contents") target = target.parentElement;
      if (!targets.has(target)) targets.set(target, []);
      targets.get(target).push(el);
    });
    targets.forEach((_, target) => io.observe(target));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------
     Parallaxe légère des photos (bureau uniquement)
     ------------------------------------------------------------------ */
  const parallaxEls = $$("[data-parallax]");
  const wide = window.matchMedia("(min-width: 960px)");
  if (parallaxEls.length && !reduceMotion) {
    let pending = false;
    const update = () => {
      pending = false;
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const img = $("img", el);
        if (!img) return;
        if (!wide.matches) {
          img.style.translate = "";
          return;
        }
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const progress = (r.top + r.height / 2 - vh / 2) / vh;
        const range = Number(el.dataset.parallax) || 40;
        img.style.translate = `0 ${(progress * -range).toFixed(1)}px`;
      });
    };
    const request = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     Filtres de projets
     ------------------------------------------------------------------ */
  const filters = $$("[data-filter]");
  const projects = $$("[data-project-grid] .project");
  const empty = $("[data-projects-empty]");
  const matches = (project, f) => f === "all" || (project.dataset.cat || "").split(" ").includes(f);

  filters.forEach((btn) => {
    const count = $("[data-filter-count]", btn);
    if (count) count.textContent = String(projects.filter((p) => matches(p, btn.dataset.filter)).length);

    const apply = () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      let shown = 0;
      projects.forEach((p) => {
        const match = matches(p, f);
        p.classList.toggle("is-hidden", !match);
        if (match) {
          shown += 1;
          $$("[data-reveal]", p).forEach((el) => el.classList.add("is-visible"));
        }
      });
      if (empty) empty.hidden = shown > 0;
    };

    btn.addEventListener("click", () => {
      if (btn.getAttribute("aria-pressed") === "true") return;
      if (!document.startViewTransition || reduceMotion) {
        apply();
        return;
      }
      // Chaque carte garde son identité pendant la transition et glisse à sa nouvelle place.
      projects.forEach((p, i) => (p.style.viewTransitionName = `project-${i}`));
      root.classList.add("vt-filter");
      const transition = document.startViewTransition(apply);
      transition.finished.finally(() => {
        root.classList.remove("vt-filter");
        projects.forEach((p) => (p.style.viewTransitionName = ""));
      });
    });
  });

  /* ------------------------------------------------------------------
     Copier l'adresse
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
        showToast("Adresse copiée dans le presse-papiers");
        if (label) {
          label.textContent = "Adresse copiée";
          setTimeout(() => (label.textContent = "Copier l'adresse"), 2000);
        }
      } catch {
        window.location.href = `mailto:${value}`;
      }
    });
  });

  /* ------------------------------------------------------------------
     Pied de page : année et heure d'Abidjan
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
