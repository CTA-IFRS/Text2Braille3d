document.querySelectorAll('[data-menu-toggle]').forEach(function (button) {
  var menu = document.querySelector(button.getAttribute('data-menu-toggle'));
  function closeMenu() { menu.classList.remove('show'); button.setAttribute('aria-expanded', 'false'); }
  button.addEventListener('click', function () { button.setAttribute('aria-expanded', String(menu.classList.toggle('show'))); });
  function handleEscape(event) {
    if (event.key === 'Escape' && menu.classList.contains('show')) {
      event.preventDefault();
      closeMenu();
      button.focus();
    }
  }
  button.addEventListener('keydown', handleEscape);
  menu.addEventListener('keydown', handleEscape);
  menu.querySelectorAll('a[href^="#"]').forEach(function (link) { link.addEventListener('click', closeMenu); });
});
var backToTop = document.getElementById('btn-back-to-top');
function updateBackToTop() { backToTop.style.display = window.scrollY > 20 ? 'flex' : 'none'; }
window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener('click', function () {
    var target = document.getElementById(link.hash.slice(1));
    if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
});
