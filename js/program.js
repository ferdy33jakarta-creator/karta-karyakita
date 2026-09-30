import { db } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Toggle Mobile Menu
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
mobileBtn?.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

// Render Program Kerja
async function loadPrograms() {
    const container = document.getElementById('program-container');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "programs"));
        
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <p class="text-slate-400 text-sm">Belum ada program kerja yang ditambahkan.</p>
                </div>
            `;
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Samakan variabel persis dengan screenshot Firebase kamu
            const nama = data.nama || 'Tanpa Nama';
            const ikon = data.Ikon || data.ikon || '🚀';
            const deskripsi = data.deskripsi || 'Tidak ada deskripsi.';
            const status = data.status || 'Sedang Berjalan';
            const progress = data.progress || 0;
            const checklist = data.checklist || [];

            // Badge Status Styling
            let statusBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            if (status === "Selesai" || progress === 100) {
                statusBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            } else if (status === "Belum Dimulai" || progress === 0) {
                statusBadgeClass = "bg-slate-700/50 text-slate-400 border-slate-600/50";
            }

            // Checklist HTML
            let checklistHTML = '';
            if (checklist.length > 0) {
                const listItems = checklist.map(item => `
                    <div class="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40 text-xs text-slate-300">
                        <span>${item.selesai ? '✅' : '⏳'}</span>
                        <span class="${item.selesai ? 'line-through text-slate-500' : ''}">${item.teks}</span>
                    </div>
                `).join('');

                checklistHTML = `
                    <div class="pt-3 border-t border-slate-700/50 space-y-2 mt-4">
                        <p class="text-[11px] font-semibold text-slate-400">Sub-Tugas / Checklist:</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            ${listItems}
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between">
                    <div class="space-y-4">
                        <div class="flex justify-between items-start gap-3">
                            <div class="flex items-center gap-3">
                                <span class="text-3xl p-2.5 bg-slate-800 rounded-xl border border-slate-700/80">${ikon}</span>
                                <div>
                                    <h3 class="text-lg font-bold text-white leading-snug">${nama}</h3>
                                    <span class="inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-full border ${statusBadgeClass} font-semibold">
                                        ${status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p class="text-slate-300 text-sm leading-relaxed">${deskripsi}</p>

                        <!-- Progress Bar -->
                        <div>
                            <div class="flex justify-between text-xs text-slate-400 mb-1.5">
                                <span>Progress</span>
                                <span class="font-bold text-blue-400">${progress}%</span>
                            </div>
                            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
                                <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                            </div>
                        </div>

                        ${checklistHTML}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error("Gagal memuat program kerja:", error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-400 text-sm">
                Gagal mengambil data dari server.
            </div>
        `;
    }
}

loadPrograms();