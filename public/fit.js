/* Cho trang hiển thị đúng tỉ lệ như trên màn hình MacBook (khung ~1440px) dù máy Windows đặt
   tỉ lệ 125%/150% khiến khung chữ chỉ còn ~1280px: thu nhỏ đều cả trang thay vì để mọi thứ to đùng. */
(function () {
  var d = document.documentElement, BASE = 1440, MIN = 1201;
  if (!(window.CSS && CSS.supports && CSS.supports('zoom', '0.9'))) return;
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, z = w >= MIN && w < BASE ? w / BASE : 1;
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
