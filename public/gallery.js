/* Chùm ảnh: khung lướt ảnh trên trang + trình xem toàn màn hình (phóng to/thu nhỏ, kéo, xoay, lật, tự chạy) */
(function () {
  const I = {
    prev: '<path d="m15 5-7 7 7 7"/>', next: '<path d="m9 5 7 7-7 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6M11 8v6"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>',
    rl: '<path d="M3 4v6h6"/><path d="M3.5 10A9 9 0 1 1 6 17.7"/>', rr: '<path d="M21 4v6h-6"/><path d="M20.5 10A9 9 0 1 0 18 17.7"/>',
    fh: '<path d="M12 3v18M8 7l-5 5 5 5V7zM16 7l5 5-5 5V7z"/>', fv: '<path d="M3 12h18M7 8l5-5 5 5H7zM7 16l5 5 5-5H7z"/>',
    play: '<path d="M7 4v16l13-8z"/>', pause: '<path d="M7 4h4v16H7zM14 4h4v16h-4z"/>', reset: '<path d="M4 4v6h6"/><path d="M4.6 15A8 8 0 1 0 6 6.3L4 10"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  };
  const ic = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- trình xem toàn màn hình ---------- */
  let lb = null;
  function viewer(list, start) {
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'lbx'; lb.hidden = true;
      lb.innerHTML = `<div class="lbx-top"><span class="lbx-n"></span><div class="lbx-tools">
        <button data-a="zout" title="Thu nhỏ (−)">${ic('zout')}</button><button data-a="zin" title="Phóng to (+)">${ic('zin')}</button>
        <button data-a="rl" title="Xoay trái">${ic('rl')}</button><button data-a="rr" title="Xoay phải">${ic('rr')}</button>
        <button data-a="fh" title="Lật ngang">${ic('fh')}</button><button data-a="fv" title="Lật dọc">${ic('fv')}</button>
        <button data-a="reset" title="Về ban đầu">${ic('reset')}</button><button data-a="play" title="Tự động chuyển ảnh (Space)">${ic('play')}</button>
        <button data-a="full" title="Toàn màn hình (F)">${ic('full')}</button><button data-a="close" class="x" title="Đóng (Esc)">${ic('x')}</button></div></div>
        <div class="lbx-stage"><img alt="" draggable="false"></div>
        <button class="lbx-nav p" data-a="prev" aria-label="Ảnh trước">${ic('prev')}</button><button class="lbx-nav n" data-a="next" aria-label="Ảnh sau">${ic('next')}</button>
        <div class="lbx-bot"><p class="lbx-cap"></p><div class="lbx-bar"><i></i></div><div class="lbx-th"></div></div>`;
      document.body.append(lb);
    }
    const img = lb.querySelector('img'), stage = lb.querySelector('.lbx-stage'), bar = lb.querySelector('.lbx-bar i');
    let i = start, t = { s: 1, r: 0, fx: 1, fy: 1, x: 0, y: 0 }, timer = null, drag = null;
    const apply = (anim = true) => { img.style.transition = anim ? 'transform .3s cubic-bezier(.22,.8,.24,1)' : 'none'; img.style.transform = `translate(${t.x}px,${t.y}px) rotate(${t.r}deg) scale(${t.s * t.fx},${t.s * t.fy})`; stage.classList.toggle('zoomed', t.s > 1); };
    const reset = () => { t = { s: 1, r: 0, fx: 1, fy: 1, x: 0, y: 0 }; apply(); };
    const show = k => {
      i = (k + list.length) % list.length; reset(); img.style.opacity = 0;
      img.onload = () => { img.style.opacity = 1; }; img.src = list[i].src;
      lb.querySelector('.lbx-n').textContent = `${i + 1} / ${list.length}`;
      lb.querySelector('.lbx-cap').textContent = list[i].caption || '';
      lb.querySelectorAll('.lbx-th button').forEach((b, k2) => b.classList.toggle('on', k2 === i));
      const on = lb.querySelector('.lbx-th .on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      if (timer) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    };
    const zoom = (f, cx, cy) => { const ns = Math.min(6, Math.max(1, t.s * f)); if (cx != null && ns !== t.s) { const r = stage.getBoundingClientRect(), ox = cx - r.left - r.width / 2, oy = cy - r.top - r.height / 2; t.x = ox - (ox - t.x) * ns / t.s; t.y = oy - (oy - t.y) * ns / t.s; } t.s = ns; if (t.s === 1) t.x = t.y = 0; apply(); };
    const play = on => { clearInterval(timer); timer = on ? setInterval(() => show(i + 1), 4000) : null; lb.classList.toggle('playing', !!on); lb.querySelector('[data-a=play]').innerHTML = ic(on ? 'pause' : 'play'); };
    const close = () => { play(false); lb.hidden = true; document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
    lb.querySelector('.lbx-th').innerHTML = list.map((g, k) => `<button data-k="${k}" aria-label="Ảnh ${k + 1}"><img src="${e(g.src)}" alt="" loading="lazy"></button>`).join('');
    lb.onclick = ev => {
      const b = ev.target.closest('button'); if (!b) { if (ev.target === stage) close(); return; }
      if (b.dataset.k) return show(+b.dataset.k), play(false);
      ({ prev: () => show(i - 1), next: () => show(i + 1), zin: () => zoom(1.4), zout: () => zoom(1 / 1.4), rl: () => { t.r -= 90; apply(); }, rr: () => { t.r += 90; apply(); },
        fh: () => { t.fx *= -1; apply(); }, fv: () => { t.fy *= -1; apply(); }, reset, play: () => play(!timer), close,
        full: () => document.fullscreenElement ? document.exitFullscreen() : lb.requestFullscreen && lb.requestFullscreen().catch(() => {}) }[b.dataset.a] || (() => {}))();
    };
    stage.onwheel = ev => { ev.preventDefault(); zoom(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX, ev.clientY); };
    img.ondblclick = ev => zoom(t.s > 1 ? 1 / t.s : 2.5, ev.clientX, ev.clientY);
    stage.onpointerdown = ev => { if (ev.target !== img) return; drag = { x: ev.clientX, y: ev.clientY, tx: t.x, ty: t.y, moved: false }; stage.setPointerCapture(ev.pointerId); };
    stage.onpointermove = ev => { if (!drag) return; const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; if (t.s > 1) { t.x = drag.tx + dx; t.y = drag.ty + dy; apply(false); } };
    stage.onpointerup = ev => { if (drag && t.s === 1 && drag.moved && Math.abs(ev.clientX - drag.x) > 60) show(i + (ev.clientX < drag.x ? 1 : -1)); drag = null; };
    document.onkeydown = ev => {
      if (lb.hidden) return;
      const k = ev.key; if (k === 'Escape') close(); else if (k === 'ArrowRight') show(i + 1); else if (k === 'ArrowLeft') show(i - 1);
      else if (k === '+' || k === '=') zoom(1.4); else if (k === '-') zoom(1 / 1.4); else if (k === ' ') { ev.preventDefault(); play(!timer); }
      else if (k.toLowerCase() === 'r') { t.r += 90; apply(); } else if (k.toLowerCase() === 'f') lb.querySelector('[data-a=full]').click();
    };
    lb.hidden = false; document.body.style.overflow = 'hidden'; show(start);
  }

  /* ---------- khung lướt ảnh trên trang ---------- */
  function mount(root, list) {
    if (!root || !list.length) return;
    root.classList.add('gal');
    root.innerHTML = `<div class="gal-stage"><div class="gal-track">${list.map((g, k) => `<figure class="gal-slide" style="--bg:url('${e(g.src)}')"><img src="${e(g.src)}" alt="${e(g.caption)}" ${k ? 'loading="lazy"' : ''} draggable="false"></figure>`).join('')}</div>
      <button class="gal-nav p" aria-label="Ảnh trước">${ic('prev')}</button><button class="gal-nav n" aria-label="Ảnh sau">${ic('next')}</button>
      <div class="gal-tools"><span class="gal-n"></span><button class="gal-play" title="Tự động chuyển ảnh">${ic('pause')}</button><button class="gal-open" title="Xem toàn màn hình, phóng to, xoay, lật">${ic('expand')}</button></div>
      <div class="gal-bar"><i></i></div></div>
      <p class="gal-cap"></p>
      <div class="gal-th">${list.map((g, k) => `<button data-k="${k}" aria-label="Ảnh ${k + 1}"><img src="${e(g.src)}" alt="" loading="lazy"></button>`).join('')}</div>`;
    const track = root.querySelector('.gal-track'), bar = root.querySelector('.gal-bar i');
    let i = 0, auto = true, timer = null, hover = false, sx = null;
    const go = k => {
      i = (k + list.length) % list.length; track.style.transform = `translateX(${-i * 100}%)`;
      root.querySelector('.gal-n').textContent = `${i + 1} / ${list.length}`;
      root.querySelector('.gal-cap').textContent = list[i].caption || '';
      root.querySelectorAll('.gal-th button').forEach((b, k2) => b.classList.toggle('on', k2 === i));
      const th = root.querySelector('.gal-th'), on = th.querySelector('.on'); if (on) th.scrollTo({ left: on.offsetLeft - th.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
      restart();
    };
    const restart = () => { clearTimeout(timer); bar.style.animation = 'none'; void bar.offsetWidth; const run = auto && !hover && list.length > 1; bar.style.animation = run ? '' : 'none'; root.classList.toggle('paused', !run); if (run) timer = setTimeout(() => go(i + 1), 5000); };
    root.querySelector('.gal-nav.p').onclick = () => go(i - 1);
    root.querySelector('.gal-nav.n').onclick = () => go(i + 1);
    root.querySelector('.gal-th').onclick = ev => { const b = ev.target.closest('[data-k]'); if (b) go(+b.dataset.k); };
    root.querySelector('.gal-play').onclick = ev => { auto = !auto; ev.currentTarget.innerHTML = ic(auto ? 'pause' : 'play'); restart(); };
    const open = () => { auto = false; root.querySelector('.gal-play').innerHTML = ic('play'); restart(); viewer(list, i); };
    root.querySelector('.gal-open').onclick = open;
    track.onclick = open;
    const stage = root.querySelector('.gal-stage');
    stage.onmouseenter = () => { hover = true; restart(); }; stage.onmouseleave = () => { hover = false; restart(); };
    stage.addEventListener('touchstart', ev => { sx = ev.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', ev => { if (sx == null) return; const d = ev.changedTouches[0].clientX - sx; if (Math.abs(d) > 45) go(i + (d < 0 ? 1 : -1)); sx = null; });
    if (list.length < 2) root.classList.add('single');
    go(0);
  }
  window.Gallery = { mount, viewer };
})();
