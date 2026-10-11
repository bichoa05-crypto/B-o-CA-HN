/* Windows/Linux: chuẩn hoá giao diện về đúng tỉ lệ MacBook và cuộn chuột mượt.
   - Màn hình Windows hay đặt 125%/150% hoặc có kích thước khác nên mọi thứ to/nhỏ lệch so với Mac. Trang tự co giãn đều
     để bố cục (khoảng cách, chữ, nút) luôn giống hệt khung chuẩn ~1680px, rồi vừa khít chiều ngang cửa sổ.
   - Con lăn chuột trên Windows nhảy từng nấc; thêm cuộn mượt giống trackpad Mac.
   Máy Mac giữ nguyên, không bị đổi gì. */
(function () {
  var d = document.documentElement, ua = navigator.userAgent || '';
  var pc = (/Windows|Linux|CrOS/i.test(ua) && !/Android|Mobile/i.test(ua)) || /[?&]fitwin\b/.test(location.search);
  if (!pc) return;
  var BASE = 1680, MIN = 1201, ZMIN = 0.72, ZMAX = 1.15;
  if (window.CSS && CSS.supports && CSS.supports('zoom', '0.9')) {
    var fit = function () {
      var w = window.innerWidth, h = window.innerHeight;
      var z = w >= MIN ? Math.min(ZMAX, Math.max(ZMIN, w / BASE)) : 1;
      if (Math.abs(z - 1) > 0.01) {
        d.style.zoom = z; d.classList.add('fit');
        d.style.setProperty('--vw', (w / z / 100) + 'px'); d.style.setProperty('--vh', (h / z / 100) + 'px');
      } else {
        d.style.zoom = ''; d.classList.remove('fit');
        d.style.removeProperty('--vw'); d.style.removeProperty('--vh');
      }
    };
    fit(); window.addEventListener('resize', fit);
  }

  // cuộn mượt cho con lăn chuột (bỏ qua touchpad, ô nhập liệu, vùng tự cuộn, thu phóng Ctrl+lăn)
  var target = null, raf = 0;
  function loop() {
    var cur = window.scrollY, diff = target - cur;
    if (Math.abs(diff) < 0.5) { window.scrollTo({ top: target, behavior: 'instant' }); raf = 0; target = null; return; }
    window.scrollTo({ top: cur + diff * 0.14, behavior: 'instant' }); raf = requestAnimationFrame(loop);
  }
  function scrollable(el) {
    for (; el && el !== document.body && el !== d; el = el.parentElement) {
      var s = getComputedStyle(el), oy = s.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return true;
      if (el.tagName === 'TEXTAREA') return true;
    }
    return false;
  }
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented || e.deltaMode !== 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaY) < 40 || scrollable(e.target) || getComputedStyle(document.body).overflow === 'hidden') return;
    e.preventDefault();
    var max = d.scrollHeight - window.innerHeight;
    target = Math.max(0, Math.min(max, (target == null ? window.scrollY : target) + e.deltaY * 1.1));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: false });
  window.addEventListener('keydown', function () { target = null; });
  window.addEventListener('mousedown', function () { target = null; });
})();
