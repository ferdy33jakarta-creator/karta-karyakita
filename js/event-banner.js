import { db } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

async function loadDynamicEvents() {
    const container = document.getElementById('dynamic-event-container');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        if (querySnapshot.empty) return;

        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD hari ini
        let html = '';

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            const tanggalMulai = data.tanggalMulai || '2026-01-01';

            // OTOMATIS TAMPIL: Hanya jika hari ini belum melewati batas tanggal event
            if (today <= tanggalMulai) {
                html += `
                    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-500/30 p-6 md:p-8 shadow-2xl mb-6">
                        <div class="absolute -top-10 -right-10 w-60 h-60 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div class="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                            <div class="space-y-3 text-center lg:text-left">
                                <div class="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold text-red-400">
                                    <span class="animate-pulse">🔴</span> PROGRAM PERDANA • EVENT SPESIAL
                                </div>
                                <h2 class="text-2xl md:text-3xl font-extrabold text-white">
                                    ${data.judul}
                                </h2>
                                <p class="text-slate-300 text-sm max-w-xl leading-relaxed">
                                    ${data.deskripsi}
                                </p>
                                <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-slate-300 pt-1">
                                    <span>📅 <strong>${data.tanggalTampil}</strong></span>
                                    <span>📍 <strong>${data.lokasi}</strong></span>
                                </div>
                            </div>

                            <div class="flex flex-col items-center gap-3 flex-shrink-0">
                                ${data.posterUrl ? `
                                    <button onclick="openPosterModal('${data.posterUrl}', '${data.judul}')" class="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer">
                                        🖼️ Lihat Poster Eksklusif
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    } catch (err) {
        console.error("Gagal memuat event:", err);
    }
}

// Fungsi Modal Pop-up Poster
window.openPosterModal = (url, title) => {
    let modal = document.getElementById('globalPosterModal');
    if (!modal) {
        const modalHtml = `
            <div id="globalPosterModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl">
                    <button onclick="document.getElementById('globalPosterModal').remove()" class="absolute top-3 right-3 bg-slate-800 text-slate-300 hover:text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 border border-slate-700 cursor-pointer">✕</button>
                    <div class="text-center">
                        <h3 id="modalTitleText" class="text-lg font-bold text-white mb-3"></h3>
                        <div class="max-h-[75vh] overflow-y-auto flex justify-center bg-slate-950 rounded-xl p-2 border border-slate-800">
                            <img id="modalImgSource" src="" alt="Poster" class="max-w-full h-auto object-contain rounded-lg">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('globalPosterModal');
    }
    document.getElementById('modalTitleText').innerText = title;
    document.getElementById('modalImgSource').src = url;
};

loadDynamicEvents();