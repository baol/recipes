// Category chips on narrow screens: one category open at a time.
(() => {
    "use strict";
    const chips = [...document.querySelectorAll(".ricette-chip")];
    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const opening = chip.getAttribute("aria-expanded") !== "true";
            chips.forEach((other) => {
                other.setAttribute("aria-expanded", String(opening && other === chip));
                document.getElementById(other.getAttribute("aria-controls")).hidden = !(opening && other === chip);
            });
        });
    });
    // Keep the current category's chip in view.
    document.querySelector(".ricette-chip.is-current")?.scrollIntoView({ inline: "center", block: "nearest" });
})();

// The site name in the header also leads home, like the logo.
(() => {
    const logo = document.querySelector(".md-header__button.md-logo");
    const name = document.querySelector(".md-header__topic:first-child .md-ellipsis");
    if (!logo || !name || name.querySelector("a")) return;
    const link = document.createElement("a");
    link.href = logo.getAttribute("href");
    link.className = "sito-home";
    link.textContent = name.textContent.trim();
    name.replaceChildren(link);
})();
