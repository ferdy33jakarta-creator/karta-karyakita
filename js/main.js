import { db, collection, onSnapshot, query, orderBy, limit } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. LISTEN AGENDA
    const qAgenda = query(collection(db, "agendas"), orderBy("tanggal", "asc"));
    onSnapshot(qAgenda, (snapshot) => {
        const agendaList = document.getElementById('agenda-container');
        if (agendaList) {
            agendaList.innerHTML = '';
            let count = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (count === 0) setupCountdown(data.tanggal, data.judul);

                const itemHTML = `
                    <div class="p-4 bg-slate-800/80 border-l-4 ${data.kategori === 'Rutin' ? 'border-emerald-500' : 'border-blue-500'} rounded-r-xl transform transition-all hover:translate-x-2">
                        <span class="text-xs ${data.kategori === 'Rutin' ? 'text-emerald-400' : 'text-blue-400'} font-semibold uppercase tracking-wider">${data.kategori || 'Kegiatan'}</span>
                        <h3 class="font-semibold text-lg text-white">${data.judul}</h3>
                        <p class="text-sm text-slate-400">${formatTanggal(data.tanggal)} • ${data.lokasi}</p>
                    </div>
                `;
                agendaList.insertAdjacentHTML('beforeend', itemHTML);
                count++;
            });
        }
    });

    // 2. LISTEN PENGUMUMAN
    const qPengumuman = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
    onSnapshot(qPengumuman, (snapshot) => {
        const pengumumanList = document.getElementById('pengumuman-container');
        if (pengumumanList) {
            pengumumanList.innerHTML = '';
            snapshot.forEach((doc) => {
                const data = doc.data();
                const itemHTML = `
                    <div class="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                        <span class="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-md font-medium border border-amber-500/20">${data.label || 'Penting'}</span>
                        <h3 class="font-semibold text-white mt-2">${data.judul}</h3>
                        <p class="text-sm text-slate-400 mt-1">${data.isi}</p>
                    </div>
                `;
                pengumumanList.insertAdjacentHTML('beforeend', itemHTML);
            });
        }
    });

    // 3. LISTEN GALERI (MAGAZINE STORY CARD INTERAKTIF DENGAN MULTI-FOTO & THUMBNAIL)
    const qGaleri = query(collection(db, "galleries"), orderBy("createdAt", "desc"));
    onSnapshot(qGaleri, (snapshot) => {
        const galeriContainer = document.getElementById('galeri-container');
        if (!galeriContainer) return;
        galeriContainer.innerHTML = '';

        if (snapshot.empty) {
            galeriContainer.innerHTML = `<p class="text-sm text-slate-500 italic col-span-full text-center">Belum ada galeri kegiatan.</p>`;
            return;
        }

        const albums = {};

        snapshot.forEach((docItem) => {
            const data = docItem.data();
            const docId = docItem.id;
            
            // Simpan data untuk kebutuhan modal jika diperlukan
            let rawNama = data.album || data.judul || 'Dokumentasi Umum';
            const namaAlbum = rawNama.trim();
            if (!albums[namaAlbum]) albums[namaAlbum] = [];
            albums[namaAlbum].push(data);

            // Ambil daftar foto (array 'foto' atau fallback ke 'url' lama)
            let rawListFoto = data.foto || (data.url ? [data.url] : ['https://placehold.co/600x400?text=No+Image']);
            
            // Konversi SEMUA link Google Drive jadi direct link gambar
            const listFoto = rawListFoto.map(link => convertDriveLink(link));
            
            const fotoUtama = listFoto[0];
            const judulKegiatan = data.judul || 'Tanpa Judul';

            // Generate thumbnail kecil untuk multi-foto di bawah foto utama
            let thumbnailHtml = '';
            listFoto.forEach((f, index) => {
                const activeStyle = index === 0 ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/25' : 'border-slate-700/80 opacity-70';
                thumbnailHtml += `
                    <img src="${f}" alt="Thumbnail" onclick="window.changeMainPhoto('${f}', '${docId}', this)" 
                         class="thumb-${docId} w-16 h-16 object-cover rounded-xl cursor-pointer border-2 ${activeStyle} hover:opacity-100 transition-all duration-200"
                         onerror="this.src='https://placehold.co/100x100?text=Error'">
                `;
            });

            // Layout Kartu Majalah (Grid 12 Kolom: Kiri Foto & Thumbnail, Kanan Detail Album, Judul, & Deskripsi)
            const albumHTML = `
                <div class="col-span-full bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl hover:border-emerald-500/30 transition-all grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    <!-- SISI KIRI: FOTO UTAMA & THUMBNAIL BERDERET -->
                    <div class="lg:col-span-7 space-y-4">
                        <div class="h-72 sm:h-80 md:h-96 w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 relative shadow-inner cursor-zoom-in" onclick="bukaPreviewFoto('${fotoUtama}', '${judulKegiatan.replace(/'/g, "\\'")}')">
                            <img id="main-img-${docId}" src="${fotoUtama}" alt="${judulKegiatan}" class="w-full h-full object-cover transition-all duration-500 hover:scale-105" onerror="this.src='https://placehold.co/600x400?text=Gambar+Rusak'">
                            <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">
                                🔍 Klik untuk Zoom
                            </div>
                        </div>
                        
                        <!-- Barisan Pilihan Thumbnail (Hanya muncul jika foto lebih dari 1) -->
                        ${listFoto.length > 1 ? `
                            <div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                                ${thumbnailHtml}
                            </div>
                        ` : ''}
                    </div>

                    <!-- SISI KANAN: DETAIL MAJALAH (ALBUM, JUDUL, DESKRIPSI) -->
                    <div class="lg:col-span-5 space-y-4">
                        <span class="inline-block bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20">
                            📁 ${namaAlbum}
                        </span>
                        
                        <h3 class="text-2xl font-bold text-white leading-snug">${judulKegiatan}</h3>
                        
                        <p class="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                            Dokumentasi keseruan kegiatan ${namaAlbum} Karang Taruna RT 07. Warga dapat melihat berbagai momen menarik melalui pilihan foto di samping secara langsung.
                        </p>

                        <div class="pt-2 flex items-center justify-between">
                            <span class="text-xs text-slate-400 font-medium">📷 Total: ${listFoto.length} Foto dalam momen ini</span>
                            <button onclick="bukaModalAlbum('${namaAlbum.replace(/'/g, "\\'")}')" class="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl hover:bg-blue-600/40 transition-colors font-semibold cursor-pointer">
                                Lihat Semua Album 📂
                            </button>
                        </div>
                    </div>

                </div>
            `;

            galeriContainer.insertAdjacentHTML('beforeend', albumHTML);
        });

        window.dataGaleriAlbum = albums;
    });

    // Fungsi global untuk mengganti foto utama saat thumbnail diklik
    window.changeMainPhoto = (imageUrl, docId, thumbElement) => {
        const mainImg = document.getElementById(`main-img-${docId}`);
        if (mainImg) {
            mainImg.src = imageUrl;
            mainImg.parentElement.setAttribute('onclick', `bukaPreviewFoto('${imageUrl}', 'Dokumentasi Kegiatan')`);
        }
        document.querySelectorAll(`.thumb-${docId}`).forEach(thumb => {
            thumb.classList.remove('border-emerald-500', 'scale-105', 'shadow-md', 'shadow-emerald-500/25');
            thumb.classList.add('border-slate-700/80', 'opacity-70');
        });
        thumbElement.classList.remove('border-slate-700/80', 'opacity-70');
        thumbElement.classList.add('border-emerald-500', 'scale-105', 'shadow-md', 'shadow-emerald-500/25');
    };

    function convertDriveLink(driveUrl) {
        if (!driveUrl) return '';
        const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
        return driveUrl;
    }

    function setupCountdown(targetISOString, judulAcara) {
        const titleElem = document.getElementById('event-title');
        if (titleElem) titleElem.innerText = judulAcara;

        const targetDate = new Date(targetISOString).getTime();
        setInterval(() => {
            const now = new Date().getTime();
            const diff = targetDate - now;

            if (diff > 0) {
                const days = document.getElementById('cd-days');
                const hours = document.getElementById('cd-hours');
                const minutes = document.getElementById('cd-minutes');
                const seconds = document.getElementById('cd-seconds');

                if (days) days.innerText = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
                if (hours) hours.innerText = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
                if (minutes) minutes.innerText = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
                if (seconds) seconds.innerText = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
            }
        }, 1000);
    }

    function formatTanggal(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
});

/// ----------------------------------------------------
// FUNGSI MODAL ALBUM (DENGAN ANIMASI & LIGHTBOX PREVIEW - SUPPORT MULTI-FOTO & DRIVE)
// ----------------------------------------------------
window.bukaModalAlbum = function(namaAlbum) {
    const daftarFotoData = window.dataGaleriAlbum ? window.dataGaleriAlbum[namaAlbum] : null;
    if (!daftarFotoData) return;

    let allPhotos = [];
    daftarFotoData.forEach(item => {
        if (item.foto && Array.isArray(item.foto)) {
            item.foto.forEach(f => {
                if(f.trim()) allPhotos.push({ url: f, judul: item.judul || namaAlbum });
            });
        } else if (item.url) {
            allPhotos.push({ url: item.url, judul: item.judul || namaAlbum });
        }
    });

    let itemsHTML = '';
    allPhotos.forEach((photo) => {
        let url = photo.url;
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) url = `https://lh3.googleusercontent.com/d/${match[1]}`;

        const judul = photo.judul;
        
        itemsHTML += `
            <div onclick="bukaPreviewFoto('${url}', '${judul.replace(/'/g, "\\'")}')" 
                 class="group relative rounded-2xl overflow-hidden bg-slate-800/80 border border-slate-700/60 shadow-lg cursor-pointer transform transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-blue-500/50">
                
                <div class="aspect-video w-full overflow-hidden bg-slate-950">
                    <img src="${url}" alt="${judul}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" onerror="this.src='https://placehold.co/400x300?text=Gambar+Rusak'">
                </div>
                
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity"></div>
                
                <div class="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                    <p class="text-xs text-slate-100 font-medium truncate pr-2">${judul}</p>
                    <span class="text-[10px] bg-blue-600/80 text-white px-2 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Zoom 🔍</span>
                </div>
            </div>
        `;
    });

    const modalHTML = `
        <div id="modal-album" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
            <div class="bg-slate-900/90 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-modal-pop backdrop-saturate-150">
                
                <div class="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                            🖼️
                        </div>
                        <div>
                            <span class="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Album Foto</span>
                            <h3 class="text-xl font-extrabold text-white tracking-tight">${namaAlbum}</h3>
                        </div>
                    </div>
                    <button onclick="tutupModalAlbum()" class="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all transform hover:rotate-90">
                        ✕
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 custom-scrollbar">
                    ${itemsHTML}
                </div>
            </div>
        </div>
    `;

    const oldModal = document.getElementById('modal-album');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.tutupModalAlbum = function() {
    const modal = document.getElementById('modal-album');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 200);
    }
};

// ----------------------------------------------------
// FUNGSI LIGHTBOX PREVIEW (ZOOM FOTO BESAR)
// ----------------------------------------------------
window.bukaPreviewFoto = function(url, judul) {
    const previewHTML = `
        <div id="modal-preview" onclick="tutupPreviewFoto()" class="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-modal-pop cursor-zoom-out">
            <div class="relative max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" onclick="event.stopPropagation()">
                <img src="${url}" alt="${judul}" class="w-full h-full object-contain max-h-[80vh]">
            </div>
            <p class="mt-4 text-slate-300 font-medium text-sm bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">${judul}</p>
            <p class="text-xs text-slate-500 mt-2">Klik di mana saja untuk menutup</p>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', previewHTML);
};

window.tutupPreviewFoto = function() {
    const preview = document.getElementById('modal-preview');
    if (preview) preview.remove();
};