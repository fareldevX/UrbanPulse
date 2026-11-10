(function () {
  /* Feed laporan di hero (data contoh) */
  const feed = document.getElementById('feedList');
  const items = [
    ['Jalan berlubang, Jl. Prof. Moh. Yamin', 'pending', 'Pending', 'baru saja'],
    ['Lampu PJU mati, Slawi', 'progress', 'Diproses', '3 mnt lalu'],
    ['Trotoar amblas, Pasar Slawi', 'resolved', 'Resolved', '12 mnt lalu'],
    ['Halte rusak, Jl. Raya Tegal', 'pending', 'Pending', '20 mnt lalu'],
    ['Drainase tersumbat, Adiwerna', 'progress', 'Diproses', '31 mnt lalu']
  ];
  if (feed) {
    const baris = d => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${d[0]}</strong><span style="display:flex;justify-content:space-between;align-items:center"><span class="badge ${d[1]}">${d[2]}</span><small>${d[3]}</small></span>`;
      return li;
    };
    const tampilkan = daftar => {
      feed.textContent = '';
      if (!daftar.length) { /* state kosong */
        feed.innerHTML = '<li class="feed-state">Belum ada laporan di sekitarmu.</li>';
        return;
      }
      daftar.slice(0, 3).forEach(d => feed.appendChild(baris(d)));
    };
    try {
      tampilkan(items);
    } catch (e) { /* state gagal */
      feed.innerHTML = '<li class="feed-state">Laporan gagal dimuat. Muat ulang halaman ini.</li>';
    }
  }
 
  /* Hitung angka statistik saat terlihat */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1400, 1), n = end * (1 - Math.pow(1 - p, 3));
      el.textContent = n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
 
  /* Demo voting komunitas */
  document.querySelectorAll('.vote-item').forEach(item => {
    const btn = item.querySelector('.vote-btn'), num = item.querySelector('.vnum'), bar = item.querySelector('.vbar i');
    let n = +num.textContent, base = n;
    btn.addEventListener('click', () => {
      const on = btn.classList.toggle('on');
      n = base + (on ? 1 : 0);
      num.textContent = n;
      bar.style.width = Math.min(100, n / 3.2) + '%';
      btn.textContent = on ? 'Sudah vote' : 'Vote';
    });
  });
})();