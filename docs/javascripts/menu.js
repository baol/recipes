// Recipe list: categories slide open and closed, one at a time.
// An extra only: without this script <details name="categoria"> opens them at once.
(() => {
  const nav = document.querySelector(".ricette-nav");
  if (!nav || !Element.prototype.animate) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const all = [...nav.querySelectorAll("details")];
  // The script keeps one category open itself, so it can animate the one closing.
  all.forEach((d) => d.removeAttribute("name"));

  function slide(details, opening) {
    const list = details.querySelector(":scope > ul");
    if (opening) details.open = true;
    details.classList.toggle("ricette-chiude", !opening);
    const height = list.scrollHeight + "px";
    list.style.overflow = "hidden";
    const frames = [{ height: "0px" }, { height }];
    const animation = list.animate(opening ? frames : frames.reverse(), {
      duration: 250,
      easing: "ease",
    });
    details.animation = animation;
    animation.onfinish = () => {
      list.style.overflow = "";
      details.classList.remove("ricette-chiude");
      if (!opening) details.open = false;
      details.animation = null;
    };
  }

  all.forEach((details) => {
    details.querySelector("summary").addEventListener("click", (event) => {
      if (reduce.matches) {
        if (!details.open)
          all.forEach((d) => d !== details && (d.open = false));
        return;
      }
      event.preventDefault();
      if (all.some((d) => d.animation)) return;
      if (details.open) {
        slide(details, false);
      } else {
        all.forEach((d) => d.open && slide(d, false));
        slide(details, true);
      }
    });
  });
})();
