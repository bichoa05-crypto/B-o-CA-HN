/* Windows hay đặt tỉ lệ hiển thị 125%/150% nên khung trình duyệt chỉ còn ~1280-1536px và mọi thứ to hơn hẳn
   MacBook. Trên Windows/Linux, trang tự thu nhỏ đều để bố cục vừa vặn như khung MacBook (~1728px).
   Máy Mac giữ nguyên, không bị đổi gì. */
(function () {
  var d = document.documentElement, ua = navigator.userAgent || '';
  var desktopPC = /Windows|Linux|CrOS/i.test(ua) && !/Android|Mobile/i.test(ua) || /[?&]fitwin\b/.test(location.search);
  if (!desktopPC || !(window.CSS && CSS.supports && CSS.supports('zoom', '0.9'))) return;
  var BASE = 1728, MIN = 1201, FLOOR = 0.72;
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, z = w >= MIN && w < BASE ? Math.max(FLOOR, w / BASE) : 1;
    if (z < 1) {
      d.style.zoom = z; d.classList.add('fit');
      d.style.setProperty('--vw', (w / z / 100) + 'px'); d.style.setProperty('--vh', (h / z / 100) + 'px');
    } else {
      d.style.zoom = ''; d.classList.remove('fit');
      d.style.removeProperty('--vw'); d.style.removeProperty('--vh');
    }
  }
  fit(); window.addEventListener('resize', fit);
})();
