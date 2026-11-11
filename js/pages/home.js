(function () {
  const v = document.getElementById('heroVideo');
  if (v) v.addEventListener('canplay', () => v.classList.add('loaded'));
 
  const city = document.getElementById('heroCity');
  if (city) {
    let x = 0, s = '', seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    while (x < 1600) {
      const w = 40 + rnd() * 70, h = 80 + rnd() * 260;
      s += `<rect x="${x}" y="${400 - h}" width="${w}" height="${h}" fill="#0d1526" stroke="rgba(52,211,153,.12)"/>`;
      for (let i = 0; i < 9; i++) if (rnd() > .55)
        s += `<rect x="${x + 6 + rnd() * (w - 16)}" y="${400 - h + 10 + rnd() * (h - 30)}" width="4" height="6" fill="rgba(52,211,153,${.25 + rnd() * .5})"/>`;
      x += w + 4;
    }
    city.innerHTML = s;
  }
 
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1400, 1), n = end * (1 - Math.pow(1 - p, 3));
      el.textContent = n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
 
  document.querySelectorAll('.vote-item').forEach(item => {
    const btn = item.querySelector('.vote-btn'), num = item.querySelector('.vnum'), bar = item.querySelector('.vbar i');
    let n = +num.textContent, base = n;
    btn.addEventListener('click', () => {
      const on = btn.classList.toggle('on');
      n = base + (on ? 1 : 0);
      num.textContent = n;
      bar.style.width = Math.min(100, n / 3.2) + '%';
      btn.textContent = on ? 'Voted' : 'Vote';
    });
  });
})();