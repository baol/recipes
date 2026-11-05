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
