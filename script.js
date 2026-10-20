// SCRIPT.JS - semua fitur interaktif (filter galeri, lightbox, musik latar, animasi scroll).
// Biasanya tidak perlu kamu ubah.

document.getElementById('yr').textContent = new Date().getFullYear();

const works = [...document.querySelectorAll('.work')];

// Ambil kode video dari link YouTube biasa / shorts / youtu.be (atau dari kode langsung)
const ytId = v => {
  const m = String(v).match(/(?:youtu\.be\/|shorts\/|embed\/|[?&]v=)([\w-]{11})/);
  return m ? m[1] : String(v).trim();
};

// Sampul video otomatis + placeholder jika gambar belum ada
works.forEach(w => {
  const img = w.querySelector('img');
  if (w.dataset.video) img.src = 'https://i.ytimg.com/vi/' + ytId(w.dataset.video) + '/hqdefault.jpg';
  const empty = () => { img.remove(); w.classList.add('empty'); };
  img.addEventListener('error', empty);
  if (img.complete && img.naturalWidth === 0 && img.src) empty();
});

// ===== MUSIK LATAR =====
const bgm = document.getElementById('bgm');
const player = document.getElementById('player');
const pp = document.getElementById('pp');
const vol = document.getElementById('vol');
let userPaused = false;     // true jika pengunjung sendiri yang menekan jeda
let videoOpen = false;      // true selama video dibuka di lightbox
let resumeAfterVideo = false;

bgm.volume = 0.5;
const setUI = () => {
  const on = !bgm.paused;
  player.classList.toggle('playing', on);
  pp.setAttribute('aria-label', on ? 'Jeda musik' : 'Putar musik');
};
const play = () => bgm.play().then(setUI).catch(() => {});

bgm.addEventListener('play', setUI);
bgm.addEventListener('pause', setUI);
bgm.addEventListener('error', () => { player.hidden = true; });  // file mp3 tidak ditemukan

pp.addEventListener('click', () => {
  if (bgm.paused) { userPaused = false; play(); }
  else { userPaused = true; bgm.pause(); }
});
vol.addEventListener('input', () => { bgm.volume = vol.value; });

// Browser memblokir suara otomatis, jadi musik mulai saat pengunjung pertama kali klik/ketuk/tekan tombol
play();
const events = ['pointerdown', 'keydown', 'touchend'];
const firstInteract = e => {
  if (e.target.closest && e.target.closest('#player, [data-video]')) return;
  if (!userPaused && !videoOpen) play();
};
events.forEach(ev => addEventListener(ev, firstInteract));
bgm.addEventListener('playing', () => events.forEach(ev => removeEventListener(ev, firstInteract)), { once: true });

// ===== FILTER KATEGORI =====
const btns = document.querySelectorAll('.filters button');
btns.forEach(b => b.addEventListener('click', () => {
  btns.forEach(x => x.setAttribute('aria-pressed', x === b));
  works.forEach(w => {
    w.hidden = b.dataset.f !== 'all' && w.dataset.cat !== b.dataset.f;
    if (!w.hidden) { w.classList.add('in'); w.classList.remove('show'); void w.offsetWidth; w.classList.add('show'); }
  });
}));

// ===== LIGHTBOX =====
const lb = document.getElementById('lb'), lbc = document.getElementById('lbc');
const open = w => {
  const img = w.querySelector('img');
  const v = w.dataset.video;
  if (v && !v.startsWith('GANTI')) {
    const short = /shorts\//.test(v);
    lbc.innerHTML = '<div class="vid' + (short ? ' short' : '') + '"><iframe allowfullscreen allow="autoplay; encrypted-media" src="https://www.youtube.com/embed/' + ytId(v) + '?autoplay=1&rel=0&playsinline=1"></iframe></div>';
    // Lagu berhenti selama video diputar
    resumeAfterVideo = !bgm.paused;
    videoOpen = true;
    bgm.pause();
  } else if (img) {
    lbc.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '">';
  } else return;
  lb.showModal();
};
works.forEach(w => {
  w.addEventListener('click', () => open(w));
  w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(w); } });
});
// Klik area kosong (di luar foto/video) menutup lightbox
lb.addEventListener('click', e => { if (!e.target.closest('img, iframe')) lb.close(); });
lb.addEventListener('close', () => {
  lbc.innerHTML = '';
  if (videoOpen) {
    videoOpen = false;
    if (resumeAfterVideo && !userPaused) play();   // lagu lanjut lagi setelah video ditutup
  }
});

// ===== ANIMASI =====
// 1. Nama di hero muncul huruf per huruf (otomatis, ikut berubah kalau kamu ganti teks <h1>)
const h1 = document.querySelector('.hero h1');
const nama = h1.textContent;
h1.setAttribute('aria-label', nama);
h1.innerHTML = [...nama].map((c, i) => '<span aria-hidden="true" style="--i:' + i + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>').join('');

// 2. Elemen muncul halus saat di-scroll
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12 });
works.forEach((w, i) => w.style.transitionDelay = (i % 3) * .12 + 's');
document.querySelectorAll('.work, #karya, .filters, .about, .contact').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

// 3. Garis progres scroll di atas halaman
const bar = document.getElementById('bar');
addEventListener('scroll', () => {
  const h = document.documentElement;
  bar.style.transform = 'scaleX(' + h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1) + ')';
}, { passive: true });

// ===== LAYAR SAMBUTAN =====
// Klik "Enter" = interaksi pertama pengunjung, sehingga browser mengizinkan musik langsung diputar
const splash = document.getElementById('splash');
const enterBtn = document.getElementById('enter');
if (splash && enterBtn) {
  enterBtn.focus();
  enterBtn.addEventListener('click', () => {
    document.body.classList.remove('locked');
    splash.classList.add('out');
    setTimeout(() => splash.remove(), 800);
    userPaused = false;
    play();
  });
}
