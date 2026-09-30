import { db } from './firebase.js';
import { collection, getDocs, query } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Inisialisasi AOS
if (typeof AOS !== 'undefined') {
    AOS.init({ once: true, duration: 800 });
}

// Helper Konversi Google Drive URL ke Direct Link
function fixDriveUrl(url) {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
}

// Fallback Image SVG Base64 (Anti-Loop & Aman Offline)
const FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBmMTcyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NGhiIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+R2FtYmFyIFRpZGFrIFRlcnNlZGlhPC90ZXh0Pjwvc3ZnPg==";

// Toggle Mobile Menu
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
mobileBtn?.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

// Variabel Penampung Data Berita untuk Modal
let articlesData = {};

// Helper Formatting Tanggal
function formatTanggal(rawDate) {
    if (!rawDate) return 'Baru saja';
    try {
        let d;
        if (typeof rawDate.toDate === 'function') {
            d = rawDate.toDate();
        } else {
            d = new Date(rawDate);
        }
        if (isNaN(d.getTime())) return 'Baru saja';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'Baru saja';
    }
}

// Function untuk Mengambil Berita dari Firestore
async function loadArticles() {
    const container = document.getElementById('berita-container');
    if (!container) return;

    try {
        const q = query(collection(db, "berita"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <p class="text-slate-400 text-sm">Belum ada berita yang diterbitkan.</p>
                </div>
            `;
            return;
        }

        let html = '';
        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            const docId = docItem.id;
            articlesData[docId] = data; // Simpan untuk dibuka di modal

            const tanggalFormatted = formatTanggal(data.tanggal || data.createdAt);

            // Ambil URL gambar dan konversi jika link Google Drive
            const rawGambar = data.gambarUrl || data.gambar || data.poster || '';
            const gambarUrl = rawGambar ? fixDriveUrl(rawGambar) : FALLBACK_IMAGE;
            
            // Cek apakah ini berita link eksternal atau berita teks lokal
            const isExternalLink = !!data.urlBerita;
            const ringkasanTeks = data.isi || (isExternalLink ? 'Klik tombol di bawah untuk membaca artikel lengkap di portal berita.' : 'Tidak ada deskripsi tambahan.');

            html += `
                <article class="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between" data-aos="fade-up">
                    <div>
                        <div class="h-48 w-full overflow-hidden bg-slate-900 relative">
                            <img src="${gambarUrl}" 
                                 alt="${data.judul || 'Berita'}" 
                                 class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                                 onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';">
                            <span class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                                📅 ${tanggalFormatted}
                            </span>
                        </div>
                        <div class="p-5">
                            <h3 class="text-lg font-bold text-white line-clamp-2 mb-2 hover:text-emerald-400 transition-colors">${data.judul || 'Tanpa Judul'}</h3>
                            <p class="text-slate-300 text-xs md:text-sm line-clamp-3 leading-relaxed mb-4">${ringkasanTeks}</p>
                        </div>
                    </div>
                    <div class="px-5 pb-5 pt-0">
                        ${isExternalLink ? `
                            <a href="${data.urlBerita}" target="_blank" rel="noopener noreferrer" class="w-full text-center block bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 border border-slate-700/80 font-medium py-2 rounded-xl text-xs transition-all">
                                Baca di Portal Asli →
                            </a>
                        ` : `
                            <button data-id="${docId}" class="btn-read-more w-full text-center bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 border border-slate-700/80 font-medium py-2 rounded-xl text-xs transition-all cursor-pointer">
                                Baca Selengkapnya →
                            </button>
                        `}
                    </div>
                </article>
            `;
        });

        container.innerHTML = html;

        // Tambah Event Listener untuk Tombol Baca Selengkapnya
        document.querySelectorAll('.btn-read-more').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openNewsDetail(id);
            });
        });

    } catch (error) {
        console.error("Gagal memuat berita:", error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-400 text-sm">
                Gagal mengambil data dari server: ${error.message}
            </div>
        `;
    }
}

// Function Buka Modal Detail Berita
function openNewsDetail(id) {
    const article = articlesData[id];
    if (!article) return;

    const modalContent = document.getElementById('modalNewsContent');
    const modal = document.getElementById('newsModal');

    const tanggalFormatted = formatTanggal(article.tanggal || article.createdAt);
    const rawGambarDetail = article.gambar || article.gambarUrl || '';
    const gambarDetail = rawGambarDetail ? fixDriveUrl(rawGambarDetail) : '';

    modalContent.innerHTML = `
        ${gambarDetail ? `<img src="${gambarDetail}" class="w-full h-60 object-cover rounded-xl mb-4 border border-slate-700" onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';">` : ''}
        <div class="flex items-center gap-2 text-xs text-emerald-400 mb-2">
            <span>📅 ${tanggalFormatted}</span>
            <span>•</span>
            <span>✍️ Penulis: ${article.penulis || 'Admin Karta'}</span>
        </div>
        <h2 class="text-2xl font-bold text-white mb-4 leading-snug">${article.judul || 'Tanpa Judul'}</h2>
        <div class="text-slate-300 text-sm leading-relaxed whitespace-pre-line border-t border-slate-700/60 pt-4">
            ${article.isi || 'Tidak ada konten detail untuk berita ini.'}
        </div>
    `;

    modal?.classList.remove('hidden');
}

// Close Modal Handler
const newsModal = document.getElementById('newsModal');
document.getElementById('closeNewsModal')?.addEventListener('click', () => newsModal?.classList.add('hidden'));
newsModal?.addEventListener('click', (e) => {
    if (e.target.id === 'newsModal') newsModal.classList.add('hidden');
});

// Jalankan Fungsi
loadArticles();