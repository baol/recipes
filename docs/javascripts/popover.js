// Recipe-list sheet for browsers without the HTML popover attribute.
// Loaded by overrides/main.html only there; modern browsers open the sheet
// natively. Without this script the list stays in the page after the recipe.
(function () {
  var nav = document.getElementById("ricette-nav");
  var button = document.querySelector('[popovertarget="ricette-nav"]');
  if (!nav || !button || !nav.hasAttribute("popover")) return;

  document.documentElement.classList.add("ricette-foglio");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "ricette-nav");

  function isOpen() {
    return nav.classList.contains("ricette-aperta");
  }
  function open() {
    nav.classList.add("ricette-aperta");
    button.setAttribute("aria-expanded", "true");
    // The list sits before the button in the page: move focus into it.
    var start =
      nav.querySelector("[aria-current]") || nav.querySelector("summary");
    if (start) start.focus();
  }
  function close(returnFocus) {
    nav.classList.remove("ricette-aperta");
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus();
  }

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    if (isOpen()) close(true);
    else open();
  });
  // Like a popover: Escape or a tap outside closes it.
  document.addEventListener("keydown", function (event) {
    if (isOpen() && (event.key === "Escape" || event.key === "Esc"))
      close(true);
  });
  document.addEventListener("click", function (event) {
    if (isOpen() && !nav.contains(event.target)) close(false);
  });
})();
