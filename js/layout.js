/* WargaCare - Layout dasar: menyisipkan Navbar & Footer di semua halaman.
   Cara pakai di setiap halaman:
   <div id="app-navbar"></div> ... <main>...</main> ... <div id="app-footer"></div>
   <script src="js/layout.js"></script>                                     */
(function () {
  const NAV = [
    { href: 'index.html',     label: 'Beranda' },
    { href: 'peta.html',      label: 'Peta Laporan' },
    { href: 'statistik.html', label: 'Statistik' },
    { href: 'tentang.html',   label: 'Tentang Kami' }
  ];
  const ico = {
    pulse: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
    menu:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    plus:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    mail:  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    pin:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    x:     '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7L17.8 3z"/></svg>',
    ig:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    gh:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.600 11.600 0 0 0-6 0C6.500 2.500 5.500 2.800 5.500 2.800a4.300 4.300 0 0 0-.1 3.200A4.600 4.600 0 0 0 4 9.200c0 4.600 2.800 5.700 5.500 6A3 3 0 0 0 8.700 17.500V21"/></svg>'
  };
 
  const page = location.pathname.split('/').pop() || 'index.html';
 
  const navbar = `
  <header class="navbar" id="navbar">
    <div class="container">
      <a class="brand" href="index.html" aria-label="WargaCare - Beranda">
        <span class="brand-mark">${ico.pulse}</span>
        <span class="brand-name">WargaCare<small class="brand-sub">Platform Partisipasi Publik</small></span>
      </a>
      <nav aria-label="Navigasi utama">
        <ul class="nav-links" id="navLinks">
          ${NAV.map(n => `<li><a href="${n.href}" ${n.href === page ? 'class="active" aria-current="page"' : ''}>${n.label}</a></li>`).join('')}
        </ul>
      </nav>
      <div class="nav-actions">
        <a class="btn btn-primary" href="lapor.html">${ico.plus}<span>Buat Laporan</span></a>
        <button class="nav-toggle" id="navToggle" aria-label="Buka menu" aria-expanded="false" aria-controls="navLinks">${ico.menu}</button>
      </div>
    </div>
  </header>`;
 
  const footer = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html"><span class="brand-mark">${ico.pulse}</span><span class="brand-name">WargaCare</span></a>
          <p class="footer-desc">Platform civic tech independen yang memberdayakan warga untuk melaporkan, memantau, dan memilih prioritas perbaikan infrastruktur kota.</p>
          <span class="status-chip"><i></i>Status sistem: Semua layanan beroperasi normal</span>
          <div class="socials">
            <a href="#" aria-label="X">${ico.x}</a><a href="#" aria-label="Instagram">${ico.ig}</a><a href="https://github.com/fareldevX/UrbanPulse" target="_blank" rel="noopener" aria-label="Repositori GitHub WargaCare">${ico.gh}</a>
          </div>
        </div>
        <div>
          <h4>Navigasi Cepat</h4>
          <ul>${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}<li><a href="lapor.html">Buat Laporan</a></li></ul>
        </div>
        <div>
          <h4>Kategori Laporan</h4>
          <ul><li><a href="peta.html?kategori=jalan">Jalan rusak</a></li><li><a href="peta.html?kategori=fasum">Fasilitas umum</a></li><li><a href="peta.html?kategori=lampu">Lampu penerangan</a></li></ul>
        </div>
        <div>
          <h4>Kontak</h4>
          <ul><li>${ico.mail}<a href="mailto:halo@wargacare.id">halo@wargacare.id</a></li><li>${ico.pin} Kabupaten Tegal, Indonesia</li></ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; <span id="year"></span> WargaCare. Kategori Smart City &amp; Urban Innovation (SDG 9 &amp; 11).</span>
        <nav><a href="#">Privasi</a><a href="#">Ketentuan</a></nav>
      </div>
    </div>
  </footer>`;
 
  const mount = (id, html) => { const el = document.getElementById(id); if (el) el.outerHTML = html; };
  mount('app-navbar', navbar);
  mount('app-footer', footer);
 
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
 
  const nav = document.getElementById('navbar'), links = document.getElementById('navLinks'),
        toggle = document.getElementById('navToggle');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  if (toggle) {
    const closeMenu = () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', e => { if (e.target.tagName === 'A') closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); });
  }
})();
 