import { db } from './firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    onSnapshot, 
    doc, 
    updateDoc,
    deleteDoc,
    query,
    where,
    arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// URL Endpoint Backend Vercel Serverless Function (Sudah Online di Vercel)
const BACKEND_URL = 'https://karta-karyakita.vercel.app/api/send-notification';

// ==========================================
// FUNGSI UMUM HAPUS DATA (DIPAKAI BERSAMA)
// ==========================================
window.hapusData = async (namaKoleksi, id) => {
    if (confirm("Yakin ingin menghapus data ini?")) {
        try {
            await deleteDoc(doc(db, namaKoleksi, id));
            alert("Data berhasil dihapus!");
        } catch (err) {
            alert("Gagal menghapus data: " + err.message);
        }
    }
};

// ==========================================
// 1. TAMBAH AGENDA
// ==========================================
const formAgenda = document.getElementById('formAgenda');
if (formAgenda) {
    formAgenda.addEventListener('submit', async (e) => {
        e.preventDefault();
        const judul = document.getElementById('agendaJudul').value;
        const tanggal = document.getElementById('agendaTanggal').value;
        const lokasi = document.getElementById('agendaLokasi').value;
        const keterangan = document.getElementById('agendaKeterangan').value;

        try {
            await addDoc(collection(db, "agendas"), {
                judul, tanggal, lokasi, keterangan,
                createdAt: new Date().toISOString()
            });
            alert('Agenda berhasil ditambahkan!');
            formAgenda.reset();
        } catch (err) {
            alert('Gagal menyimpan agenda: ' + err.message);
        }
    });
}

// ==========================================
// 2. READ & DELETE AGENDA (REALTIME) + WHATSAPP
// ==========================================
const tabelAgenda = document.getElementById('tabelAgenda');
if (tabelAgenda) {
    onSnapshot(collection(db, "agendas"), (snapshot) => {
        tabelAgenda.innerHTML = '';
        if (snapshot.empty) {
            tabelAgenda.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-500 italic">Belum ada agenda tersimpan.</td></tr>';
            return;
        }
        snapshot.forEach((docItem) => {
            const data = docItem.data();
            const id = docItem.id;
            const linkWebsite = "https://karta-karyakita.vercel.app/"; 
            const pesanWa = `Halo warga RT 07, berikut adalah informasi kegiatan:\n\n*${data.judul}*\n📅 Waktu: ${data.tanggal || '-'}\n📍 Tempat: ${data.lokasi || '-'}\n📝 Keterangan: ${data.keterangan || '-'}\n\nCek info selengkapnya di website kita:\n🌐 ${linkWebsite}\n\nMohon kehadiran dan partisipasinya. Terima kasih!`;
            const encodedPesan = encodeURIComponent(pesanWa);

            tabelAgenda.innerHTML += `
                <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="p-3 font-semibold text-white">
                        ${data.judul}
                        ${data.keterangan ? `<div class="text-[10px] text-slate-400 font-normal mt-0.5">${data.keterangan}</div>` : ''}
                    </td>
                    <td class="p-3">
                        <div>${data.tanggal || '-'}</div>
                        <div class="text-[10px] text-slate-500">${data.lokasi || '-'}</div>
                    </td>
                    <td class="p-3 text-right space-x-1">
                        <a href="https://api.whatsapp.com/send?text=${encodedPesan}" target="_blank" class="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg hover:bg-emerald-500/40 transition-colors text-[11px] font-medium">
                            💬 WA
                        </a>
                        <button onclick="hapusData('agendas', '${id}')" class="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg hover:bg-red-500/40 transition-colors text-[11px] font-medium cursor-pointer">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
    });
}

// ==========================================
// 3. TAMBAH GALERI (MULTI-FOTO DINAMIS & AUTO-MERGE ALBUM)
// ==========================================
const btnTambahFoto = document.getElementById('btn-tambah-foto');
const containerInputFoto = document.getElementById('container-input-foto');

if (btnTambahFoto && containerInputFoto) {
    btnTambahFoto.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2";
        div.innerHTML = `
            <input type="url" name="foto-url" required placeholder="https://... (Foto Tambahan)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
            <button type="button" onclick="this.parentElement.remove()" class="text-xs text-red-400 hover:text-red-300 px-2.5 py-2 bg-red-500/10 rounded-xl shrink-0 cursor-pointer">Hapus</button>
        `;
        containerInputFoto.appendChild(div);
    });
}

const formGaleri = document.getElementById('formGaleri');
if (formGaleri) {
    formGaleri.addEventListener('submit', async (e) => {
        e.preventDefault();
        const album = document.getElementById('galeriAlbum').value.trim();
        const judul = document.getElementById('galeriJudul').value.trim();
        
        const inputFotoElements = document.querySelectorAll('input[name="foto-url"]');
        let fotoArray = [];
        inputFotoElements.forEach(input => {
            if (input.value.trim() !== "") {
                fotoArray.push(input.value.trim());
            }
        });

        if (fotoArray.length === 0) {
            alert('Minimal masukkan 1 link foto!');
            return;
        }

        try {
            const galeriRef = collection(db, "galleries");
            
            const q = query(galeriRef, where("album", "==", album));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingDoc = querySnapshot.docs[0];
                const docRef = doc(db, "galleries", existingDoc.id);

                await updateDoc(docRef, {
                    foto: arrayUnion(...fotoArray),
                    judul: judul || existingDoc.data().judul
                });

                alert(`Berhasil! ${fotoArray.length} foto baru ditambahkan ke album "${album}" yang sudah ada.`);
            } else {
                await addDoc(galeriRef, {
                    album, 
                    judul, 
                    foto: fotoArray,
                    createdAt: new Date().toISOString()
                });
                alert('Album galeri baru berhasil diunggah!');
            }

            formGaleri.reset();
            
            containerInputFoto.innerHTML = `
                <div class="flex items-center gap-2">
                    <input type="url" name="foto-url" required placeholder="https://... (Foto Utama / Pertama)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    <span class="text-[10px] text-emerald-400 font-medium px-2 py-1 bg-emerald-500/10 rounded-lg shrink-0">Utama</span>
                </div>
            `;
        } catch (err) {
            alert('Gagal menyimpan galeri: ' + err.message);
        }
    });
}

// ==========================================
// FUNGSI PEMBANTU: KONVERSI LINK GOOGLE DRIVE
// ==========================================
function convertDriveLink(driveUrl) {
    if (!driveUrl) return '';
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return driveUrl;
}

// ==========================================
// 4. READ & DELETE GALERI (REALTIME) + AUTOLIST DATALIST
// ==========================================
const gridGaleri = document.getElementById('gridGaleri');
const daftarAlbumDatalist = document.getElementById('daftar-album-list');

if (gridGaleri) {
    onSnapshot(collection(db, "galleries"), (snapshot) => {
        gridGaleri.innerHTML = '';
        if (daftarAlbumDatalist) daftarAlbumDatalist.innerHTML = '';

        if (snapshot.empty) {
            gridGaleri.innerHTML = '<p class="col-span-full text-center text-xs text-slate-500 py-4 italic">Belum ada foto di galeri.</p>';
            return;
        }

        const albumSet = new Set();

        snapshot.forEach((docItem) => {
            const data = docItem.data();
            const id = docItem.id;
            
            if (data.album) albumSet.add(data.album);

            const listFoto = data.foto || (data.url ? [data.url] : ['https://via.placeholder.com/300x200?text=No+Image']);
            
            const rawFotoUtama = listFoto[0];
            const fotoUtama = convertDriveLink(rawFotoUtama);
            
            const jumlahFoto = listFoto.length;

            gridGaleri.innerHTML += `
                <div class="relative group rounded-xl overflow-hidden border border-slate-700/80 bg-slate-800">
                    <div class="relative h-28">
                        <img src="${fotoUtama}" alt="${data.judul || 'Galeri'}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x200?text=Gambar+Rusak'">
                        <span class="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-semibold">
                            📷 ${jumlahFoto} Foto
                        </span>
                    </div>
                    <div class="p-2">
                        <p class="text-[10px] text-blue-400 font-semibold">${data.album || 'Galeri'}</p>
                        <p class="text-xs text-white truncate font-medium">${data.judul || 'Tanpa Judul'}</p>
                        <button onclick="hapusData('galleries', '${id}')" class="mt-2 w-full bg-red-500/20 text-red-400 border border-red-500/30 py-1 rounded text-[10px] hover:bg-red-500/40 transition-colors cursor-pointer">
                            Hapus Album
                        </button>
                    </div>
                </div>
            `;
        });

        if (daftarAlbumDatalist) {
            albumSet.forEach(namaAlbum => {
                const opt = document.createElement('option');
                opt.value = namaAlbum;
                daftarAlbumDatalist.appendChild(opt);
            });
        }
    });
}

// ==========================================
// 5. TAMBAH & READ PENGUMUMAN + SEBARKAN NOTIFIKASI
// ==========================================

// Fungsi Mengirim Push Notification FCM via Vercel Backend
async function sendNotificationToAllWarga(judul, isi) {
    try {
        // Ambil token HP warga dari Firestore collection 'fcm_tokens'
        const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
        const tokens = [];
        tokensSnapshot.forEach((doc) => {
            if (doc.data().token) {
                tokens.push(doc.data().token);
            }
        });

        if (tokens.length === 0) {
            console.log("Belum ada perangkat warga terdaftar untuk notifikasi.");
            return;
        }

        // Panggil Vercel Serverless Function untuk memproses kirim notifikasi secara online
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `📢 Pengumuman RT 07: ${judul}`,
                body: isi,
                tokens: tokens
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log('Notifikasi push FCM berhasil terkirim ke warga!');
        } else {
            console.error('Gagal mengirim notifikasi:', result.error);
        }
    } catch (err) {
        console.error('Terjadi kesalahan saat menghubungi server notifikasi:', err);
    }
}

const formPengumuman = document.getElementById('form-pengumuman');
if (formPengumuman) {
    formPengumuman.addEventListener('submit', async (e) => {
        e.preventDefault();
        const judul = document.getElementById('pengumuman-judul').value.trim();
        const isi = document.getElementById('pengumuman-isi').value.trim();

        try {
            // 1. Simpan ke Firestore
            await addDoc(collection(db, "announcements"), {
                judul, isi,
                createdAt: new Date().toISOString()
            });

            // 2. Trigger pengiriman Push Notification online ke HP warga
            await sendNotificationToAllWarga(judul, isi);

            alert('Pengumuman berhasil diterbitkan dan notifikasi terkirim!');
            formPengumuman.reset();
        } catch (err) {
            alert('Gagal menyimpan pengumuman: ' + err.message);
        }
    });
}

const pengumumanContainer = document.getElementById('admin-pengumuman-list');
if (pengumumanContainer) {
    onSnapshot(collection(db, "announcements"), (snapshot) => {
        pengumumanContainer.innerHTML = '';
        if (snapshot.empty) {
            pengumumanContainer.innerHTML = '<p class="text-slate-500 text-sm italic">Belum ada pengumuman tersimpan.</p>';
            return;
        }
        snapshot.forEach((docItem) => {
            const data = docItem.data();
            const id = docItem.id;

            const linkWebsite = "https://karta-karyakita.vercel.app/"; 
            const pesanWa = `📢 *PENGUMUMAN WARGA RT 07*\n\n*${data.judul || 'Tanpa Judul'}*\n${data.isi || '-'}\n\nCek pengumuman & info lengkapnya di website resmi:\n🌐 ${linkWebsite}\n\nTerima kasih atas perhatiannya!`;
            const encodedPesan = encodeURIComponent(pesanWa);

            pengumumanContainer.innerHTML += `
                <div class="flex items-center justify-between p-3.5 bg-slate-900/80 rounded-lg border border-slate-700/80 gap-3">
                    <div class="min-w-0 flex-1">
                        <h4 class="font-semibold text-white text-sm truncate">${data.judul || 'Tanpa Judul'}</h4>
                        <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">📢 ${data.isi || '-'}</p>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <a href="https://api.whatsapp.com/send?text=${encodedPesan}" target="_blank" class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs hover:bg-emerald-500/40 transition-colors font-medium flex items-center gap-1">
                            💬 WA
                        </a>
                        <button onclick="hapusData('announcements', '${id}')" class="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs hover:bg-red-500/40 transition-colors cursor-pointer">
                            Hapus
                        </button>
                    </div>
                </div>
            `;
        });
    });
}

// ==========================================
// 6. PROGRAM KERJA & CHECKLIST
// ==========================================
const formProgram = document.getElementById('form-program');
if (formProgram) {
    formProgram.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('program-nama').value.trim();
        const ikon = document.getElementById('program-ikon').value.trim() || '🚀';
        const deskripsi = document.getElementById('program-deskripsi').value.trim();
        const status = document.getElementById('program-status').value;
        const progress = parseInt(document.getElementById('program-progress').value) || 0;
        
        const tugasRaw = document.getElementById('program-tugas').value.trim();
        const checklist = tugasRaw ? tugasRaw.split(',').map(item => ({ teks: item.trim(), selesai: false })).filter(i => i.teks) : [];

        try {
            await addDoc(collection(db, "programs"), {
                nama, ikon, deskripsi, status, progress, checklist,
                createdAt: new Date().toISOString()
            });
            alert('Program kerja berhasil ditambahkan!');
            formProgram.reset();
            const progVal = document.getElementById('progress-val');
            if(progVal) progVal.innerText = '0';
        } catch (err) {
            alert('Gagal menyimpan program kerja: ' + err.message);
        }
    });
}

const programContainer = document.getElementById('admin-program-list');
if (programContainer) {
    onSnapshot(collection(db, "programs"), (snapshot) => {
        programContainer.innerHTML = '';
        if (snapshot.empty) {
            programContainer.innerHTML = '<p class="text-slate-500 text-sm italic">Belum ada program kerja tersimpan.</p>';
            return;
        }
        snapshot.forEach((docItem) => {
            const data = docItem.data();
            const id = docItem.id;
            const checklist = data.checklist || [];

            let checklistHTML = '';
            checklist.forEach((item, index) => {
                checklistHTML += `
                    <label class="flex items-center gap-2 cursor-pointer bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800 text-xs text-slate-300">
                        <input type="checkbox" ${item.selesai ? 'checked' : ''} onchange="toggleChecklist('${id}', ${index})" class="rounded border-slate-700 text-blue-600 focus:ring-0">
                        <span class="${item.selesai ? 'line-through text-slate-500' : ''}">${item.teks}</span>
                    </label>
                `;
            });

            let statusBadgeClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            if(data.status === "Selesai") statusBadgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            if(data.status === "Belum Dimulai") statusBadgeClass = "bg-slate-700 text-slate-400 border-slate-600";

            programContainer.innerHTML += `
                <div class="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-3">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">${data.ikon || '🚀'}</span>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h4 class="font-bold text-white text-base">${data.nama || 'Tanpa Nama'}</h4>
                                    <span class="text-[10px] px-2 py-0.5 rounded-full border ${statusBadgeClass} font-semibold">${data.status}</span>
                                </div>
                                <p class="text-xs text-slate-400 mt-0.5">${data.deskripsi || '-'}</p>
                            </div>
                        </div>
                        <button onclick="hapusData('programs', '${id}')" class="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs hover:bg-red-500/40 transition-colors flex-shrink-0 cursor-pointer">
                            Hapus
                        </button>
                    </div>
                    <div>
                        <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Progress</span>
                            <span class="font-bold text-blue-400">${data.progress || 0}%</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${data.progress || 0}%"></div>
                        </div>
                    </div>
                    ${checklist.length > 0 ? `
                        <div class="pt-2 border-t border-slate-800 space-y-1.5">
                            <p class="text-[11px] font-semibold text-slate-400">Sub-Tugas / Checklist:</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                ${checklistHTML}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    });
}

window.toggleChecklist = async (programId, itemIndex) => {
    try {
        const programRef = doc(db, "programs", programId);
        onSnapshot(programRef, async (docSnap) => {
            if (docSnap.exists()) {
                let currentData = docSnap.data();
                let currentChecklist = currentData.checklist || [];
                
                if (currentChecklist[itemIndex]) {
                    currentChecklist[itemIndex].selesai = !currentChecklist[itemIndex].selesai;
                    
                    const totalSelesai = currentChecklist.filter(c => c.selesai).length;
                    const newProgress = Math.round((totalSelesai / currentChecklist.length) * 100);

                    await updateDoc(programRef, {
                        checklist: currentChecklist,
                        progress: newProgress,
                        status: newProgress === 100 ? "Selesai" : (newProgress > 0 ? "Sedang Berjalan" : "Belum Dimulai")
                    });
                }
            }
        });
    } catch (err) {
        console.error("Gagal update checklist: ", err);
    }
};

// ==========================================
// 7. EVENT / BANNER SPESIAL
// ==========================================
const formEvent = document.getElementById('form-event');
if (formEvent) {
    formEvent.addEventListener('submit', async (e) => {
        e.preventDefault();
        const judul = document.getElementById('event-judul').value.trim();
        const deskripsi = document.getElementById('event-deskripsi').value.trim();
        const tanggalMulai = document.getElementById('event-tanggal-mulai').value;
        const tanggalTampil = document.getElementById('event-tanggal-tampil').value.trim();
        const lokasi = document.getElementById('event-lokasi').value.trim();
        const posterUrl = document.getElementById('event-poster').value.trim();

        try {
            await addDoc(collection(db, "events"), {
                judul, deskripsi, tanggalMulai, tanggalTampil, lokasi, posterUrl,
                createdAt: new Date().toISOString()
            });
            alert('Poster event berhasil diterbitkan!');
            formEvent.reset();
            loadAdminEvents();
        } catch (err) {
            alert('Gagal menyimpan event: ' + err.message);
        }
    });
}

async function loadAdminEvents() {
    const tbody = document.getElementById('admin-events-list');
    if (!tbody) return;

    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada event yang tersimpan.</td></tr>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            const id = docItem.id;

            html += `
                <tr class="border-b border-slate-800 hover:bg-slate-800/50">
                    <td class="p-3 font-semibold text-white">${data.judul}</td>
                    <td class="p-3 text-slate-400">${data.tanggalTampil}</td>
                    <td class="p-3 text-slate-400">${data.tanggalMulai}</td>
                    <td class="p-3 text-center">
                        <button onclick="hapusData('events', '${id}')" class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error("Gagal memuat daftar event admin:", err);
    }
}
loadAdminEvents();

// ==========================================
// 8. BERITA / ARTIKEL PORTAL
// ==========================================
const formBeritaLink = document.getElementById('form-berita-link');
if (formBeritaLink) {
    formBeritaLink.addEventListener('submit', async (e) => {
        e.preventDefault();
        const judul = document.getElementById('berita-judul').value.trim();
        const urlBerita = document.getElementById('berita-url').value.trim();
        const gambarUrl = document.getElementById('berita-gambar').value.trim();

        try {
            await addDoc(collection(db, "berita"), {
                judul, urlBerita, gambarUrl,
                createdAt: new Date().toISOString()
            });
            alert('Berita berhasil diterbitkan ke website!');
            formBeritaLink.reset();
            loadAdminBerita();
        } catch (err) {
            alert('Gagal menerbitkan berita: ' + err.message);
        }
    });
}

async function loadAdminBerita() {
    const tbody = document.getElementById('admin-berita-list');
    if (!tbody) return;

    try {
        const querySnapshot = await getDocs(collection(db, "berita"));
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="2" class="p-4 text-center text-slate-500">Belum ada berita.</td></tr>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            const id = docItem.id;
            html += `
                <tr class="border-b border-slate-800 hover:bg-slate-800/50">
                    <td class="p-3 font-semibold text-white">${data.judul}</td>
                    <td class="p-3 text-center">
                        <button onclick="hapusData('berita', '${id}')" class="bg-red-600/25 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error("Gagal memuat berita admin:", err);
    }
}

// ==========================================
// 9. BACA & UPDATE STATUS ASPIRASI WARGA (REALTIME WITH FILTER)
// ==========================================
const containerAspirasi = document.getElementById('admin-aspirasi-list');
let currentFilterStatus = 'Menunggu';

function renderAspirasiList(snapshot) {
    if (!containerAspirasi) return;

    if (snapshot.empty) {
        containerAspirasi.innerHTML = `
            <div class="p-6 text-center text-slate-500 italic bg-slate-900/50 rounded-xl border border-slate-800">
                Belum ada aspirasi atau aduan masuk.
            </div>`;
        return;
    }

    let htmlContent = '';
    let countData = 0;

    snapshot.forEach((docItem) => {
        const data = docItem.data();
        const id = docItem.id;
        const statusData = data.status || 'Menunggu';

        if (currentFilterStatus !== 'Semua' && statusData !== currentFilterStatus) {
            return;
        }

        countData++;

        let tanggal = '-';
        if (data.createdAt) {
            let dateObj = null;
            if (typeof data.createdAt.toDate === 'function') {
                dateObj = data.createdAt.toDate();
            } else {
                dateObj = new Date(data.createdAt);
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
                tanggal = dateObj.toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        }

        let statusBadge = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        if (statusData === "Diproses") statusBadge = "bg-blue-500/20 text-blue-400 border-blue-500/30";
        if (statusData === "Selesai") statusBadge = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (statusData === "Ditolak") statusBadge = "bg-red-500/20 text-red-400 border-red-500/30";

        htmlContent += `
            <div class="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-3">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-white text-base">${data.nama || 'Anonim'}</h4>
                            <span class="text-[10px] px-2.5 py-0.5 rounded-full border ${statusBadge} font-semibold">
                                ${statusData}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">
                            📍 ${data.kategori || 'Umum'} • 📅 ${tanggal} ${data.kontak ? `• 📞 ${data.kontak}` : ''}
                        </p>
                    </div>
                    <button onclick="hapusData('aspirasi', '${id}')" class="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs hover:bg-red-500/40 transition-colors shrink-0 cursor-pointer">
                        Hapus
                    </button>
                </div>

                <div class="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 text-xs text-slate-200 leading-relaxed">
                    "${data.pesan || '-'}"
                </div>

                <div class="flex items-center justify-between pt-1 text-xs">
                    <span class="text-slate-400 font-medium">Ubah Status:</span>
                    <select onchange="updateStatusAspirasi('${id}', this.value)" class="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="Menunggu" ${statusData === 'Menunggu' ? 'selected' : ''}>⏳ Menunggu</option>
                        <option value="Diproses" ${statusData === 'Diproses' ? 'selected' : ''}>⚙️ Diproses</option>
                        <option value="Selesai" ${statusData === 'Selesai' ? 'selected' : ''}>✅ Selesai</option>
                        <option value="Ditolak" ${statusData === 'Ditolak' ? 'selected' : ''}>❌ Ditolak</option>
                    </select>
                </div>
            </div>
        `;
    });

    if (countData === 0) {
        containerAspirasi.innerHTML = `
            <div class="p-6 text-center text-slate-500 italic bg-slate-900/50 rounded-xl border border-slate-800">
                Tidak ada aspirasi dengan status "${currentFilterStatus}".
            </div>`;
    } else {
        containerAspirasi.innerHTML = htmlContent;
    }
}

let latestAspirasiSnapshot = null;

if (containerAspirasi) {
    onSnapshot(collection(db, "aspirasi"), (snapshot) => {
        latestAspirasiSnapshot = snapshot;
        renderAspirasiList(snapshot);
    });
}

window.filterAspirasi = (status) => {
    currentFilterStatus = status;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = "filter-btn px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer";
    });

    const activeBtn = document.getElementById(`btn-filter-${status}`);
    if (activeBtn) {
        activeBtn.className = "filter-btn px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer font-semibold";
    }

    if (latestAspirasiSnapshot) {
        renderAspirasiList(latestAspirasiSnapshot);
    }
};

window.updateStatusAspirasi = async (aspirasiId, statusBaru) => {
    try {
        const aspirasiRef = doc(db, "aspirasi", aspirasiId);
        await updateDoc(aspirasiRef, {
            status: statusBaru
        });
    } catch (err) {
        alert("Gagal mengubah status aspirasi: " + err.message);
    }
};

// ==========================================
// FUNGSI CETAK LAPORAN ASPIRASI (PDF/PRINT)
// ==========================================
window.cetakLaporanAspirasi = () => {
    if (!latestAspirasiSnapshot || latestAspirasiSnapshot.empty) {
        alert("Belum ada data aspirasi untuk dicetak!");
        return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    let tableRows = '';
    let no = 1;

    latestAspirasiSnapshot.forEach((docItem) => {
        const data = docItem.data();

        let tanggal = '-';
        if (data.createdAt) {
            let dateObj = (typeof data.createdAt.toDate === 'function') 
                ? data.createdAt.toDate() 
                : new Date(data.createdAt);

            if (dateObj && !isNaN(dateObj.getTime())) {
                tanggal = dateObj.toLocaleDateString('id-ID', { 
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
            }
        }

        tableRows += `
            <tr>
                <td style="text-align: center;">${no++}</td>
                <td>${tanggal}</td>
                <td><b>${data.nama || 'Anonim'}</b></td>
                <td>${data.kategori || 'Umum'}</td>
                <td>${data.pesan || '-'}</td>
                <td style="text-align: center;"><b>${data.status || 'Menunggu'}</b></td>
            </tr>
        `;
    });

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Aspirasi & Aduan Warga RT</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h2 { text-align: center; margin-bottom: 5px; }
                p.subtitle { text-align: center; font-size: 12px; color: #666; margin-top: 0; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 30px; text-align: right; font-size: 12px; }
            </style>
        </head>
        <body>
            <h2>LAPORAN REKAPITULASI ASPIRASI & MASUKAN WARGA</h2>
            <p class="subtitle">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            
            <table>
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="15%">Tanggal</th>
                        <th width="15%">Nama Warga</th>
                        <th width="15%">Kategori</th>
                        <th>Isi Aspirasi / Pesan</th>
                        <th width="12%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <div class="footer">
                <p>Mengetahui,</p>
                <br><br><br>
                <p><b>Pengurus Karya Kita</b></p>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

loadAdminBerita();