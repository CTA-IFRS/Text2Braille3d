$(function () {
  var button = $('#high_contrast');

  function applyContrast(enabled) { $('body').toggleClass('alto-contraste', enabled); button.attr('aria-pressed', String(enabled)); }
  applyContrast(document.cookie.split(';').some(function (cookie) { return cookie.trim() === 'altocontraste=true'; }));
  button.on('click', function () {
    var enabled = button.attr('aria-pressed') !== 'true';
    applyContrast(enabled);
    document.cookie = 'altocontraste=' + enabled + '; path=/; SameSite=Lax';
  });
});
