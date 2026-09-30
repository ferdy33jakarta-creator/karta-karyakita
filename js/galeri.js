import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBmMTcyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NGhiIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+R2FtYmFyIFRpZGFrIFRlcnNlZGlhPC90ZXh0Pjwvc3ZnPg==";

function convertDriveUrl(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}=s1000`;
        }
    }
    return url;
}

let albumsData = [];
let currentFilter = 'semua';
let searchQuery = '';

async function loadGalleryAlbums() {
    const container = document.getElementById('galeri-container');
    if (!container) return;

    try {
        const q = query(collection(db, "galleries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <i class="fa-regular fa-folder-open text-3xl text-slate-600 mb-2"></i>
                    <p class="text-slate-400 font-medium text-xs">Belum ada album galeri.</p>
                </div>`;
            return;
        }

        albumsData = [];

        querySnapshot.docs.forEach((docItem) => {
            const data = docItem.data();
            const albumTitle = data.album || data.judul || data.keterangan || 'Album Kegiatan';
            const category = data.kategori || data.category || 'umum';
            
            let rawPhotos = [];
            if (Array.isArray(data.foto) && data.foto.length > 0) {
                rawPhotos = data.foto;
            } else if (Array.isArray(data.imageUrl) && data.imageUrl.length > 0) {
                rawPhotos = data.imageUrl;
            } else {
                const single = data.imageUrl || data.url || data.gambarUrl || data.gambar || data.foto || '';
                if (single) rawPhotos.push(single);
            }

            const processedPhotos = rawPhotos.map(url => convertDriveUrl(url)).filter(url => url !== '');
            if (processedPhotos.length === 0) processedPhotos.push(FALLBACK_IMAGE);

            albumsData.push({
                id: docItem.id,
                title: albumTitle,
                category: category.toLowerCase(),
                photos: processedPhotos,
                count: processedPhotos.length
            });
        });

        renderAlbums();

    } catch (error) {
        console.error("Gagal memuat galeri:", error);
        container.innerHTML = `<p class="text-xs text-red-400 col-span-full text-center py-8">Gagal memuat data galeri.</p>`;
    }
}

function renderAlbums() {
    const container = document.getElementById('galeri-container');
    if (!container) return;

    const filteredAlbums = albumsData.filter(album => {
        const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = (currentFilter === 'semua') || 
                                (album.category.includes(currentFilter)) || 
                                (album.title.toLowerCase().includes(currentFilter));
        return matchesSearch && matchesCategory;
    });

    if (filteredAlbums.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
                <i class="fa-solid fa-magnifying-glass text-2xl text-slate-600 mb-2"></i>
                <p class="text-slate-300 font-bold text-xs">Album tidak ditemukan</p>
                <p class="text-slate-500 text-[11px] mt-0.5">Coba kata kunci lain atau filter "Semua".</p>
            </div>`;
        return;
    }

    let html = '';

    filteredAlbums.forEach((album, index) => {
        const delay = (index % 6) * 60;
        const coverPhoto = album.photos[0];

        html += `
            <div onclick="openAlbumModal('${album.id}')" 
                 class="group relative cursor-pointer select-none animate-fade-in-up w-full overflow-hidden"
                 style="animation-delay: ${delay}ms;">
                
                <div class="glass-card folder-shadow rounded-2xl overflow-hidden border border-slate-800 group-hover:border-blue-500/50 transition-all duration-300 w-full">
                    <div class="relative w-full aspect-[16/10] bg-slate-950 overflow-hidden flex items-center justify-center">
                        <img src="${coverPhoto}" class="absolute inset-0 w-full h-full object-cover blur-sm opacity-30 scale-105">
                        <img src="${coverPhoto}" 
                             alt="${album.title}" 
                             loading="lazy"
                             class="relative z-10 max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                             onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';">
                        
                        <div class="absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>

                        <div class="absolute top-2.5 left-2.5 z-30 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <i class="fa-solid fa-folder text-blue-400"></i> ALBUM
                        </div>

                        <div class="absolute top-2.5 right-2.5 z-30 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <i class="fa-solid fa-images text-[10px]"></i>
                            <span>${album.count}</span>
                        </div>
                    </div>

                    <div class="p-3.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-2 w-full">
                        <div class="min-w-0 flex-1">
                            <h3 class="text-white font-bold text-xs sm:text-sm group-hover:text-blue-400 transition-colors truncate">
                                ${album.title}
                            </h3>
                            <p class="text-[10px] text-slate-400 mt-0.5">Klik untuk lihat album</p>
                        </div>
                        <div class="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <i class="fa-solid fa-chevron-right text-[10px]"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.openAlbumModal = function(albumId) {
    const album = albumsData.find(a => a.id === albumId);
    if (!album) return;

    document.getElementById('modalAlbumTitle').innerText = album.title;
    document.getElementById('modalAlbumCount').innerText = `${album.count} Foto Tersedia`;

    const grid = document.getElementById('modalPhotoGrid');
    let gridHtml = '';

    album.photos.forEach((photoUrl) => {
        gridHtml += `
            <div onclick="openSinglePhoto('${photoUrl}')" 
                 class="group relative aspect-square bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500/80 transition-all">
                <img src="${photoUrl}" 
                     loading="lazy" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                     onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';">
            </div>
        `;
    });

    grid.innerHTML = gridHtml;
    document.getElementById('albumModal').classList.remove('hidden');
};

window.openSinglePhoto = function(photoUrl) {
    const fullImg = document.getElementById('fullSizeImg');
    if (fullImg) fullImg.src = photoUrl;
    document.getElementById('singlePhotoModal').classList.remove('hidden');
};

// Event Listeners
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (searchQuery !== '') {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        renderAlbums();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderAlbums();
    });
}

const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
            b.className = "filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition bg-slate-950 text-slate-400 border border-slate-800 hover:text-white shrink-0";
        });

        btn.className = "filter-btn active-filter px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition bg-blue-600 text-white border border-blue-500 shrink-0";
        
        currentFilter = btn.getAttribute('data-category');
        renderAlbums();
    });
});

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileDrawer = document.getElementById('mobileDrawer');
const hamburgerIcon = document.getElementById('hamburgerIcon');

if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileDrawer.classList.toggle('hidden');
        if (mobileDrawer.classList.contains('hidden')) {
            hamburgerIcon.className = "fa-solid fa-bars text-base w-5 h-5 flex items-center justify-center";
        } else {
            hamburgerIcon.className = "fa-solid fa-xmark text-base w-5 h-5 flex items-center justify-center";
        }
    });
}

document.getElementById('closeModalBtn')?.addEventListener('click', () => {
    document.getElementById('albumModal').classList.add('hidden');
});

document.getElementById('closeSinglePhotoBtn')?.addEventListener('click', () => {
    document.getElementById('singlePhotoModal').classList.add('hidden');
});

loadGalleryAlbums();