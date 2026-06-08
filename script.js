const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
};

const closeNav = () => {
  document.body.classList.remove("nav-open");
  nav?.classList.remove("is-open");
  header?.classList.remove("nav-visible");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Ouvrir le menu");
};

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open") ?? false;
  document.body.classList.toggle("nav-open", isOpen);
  header?.classList.toggle("nav-visible", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeNav();
});

setHeaderState();
