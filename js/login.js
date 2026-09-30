import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Efek Animasi Muncul dari Bawah (Smooth Fade-in & Slide-up)
    const loginCard = document.getElementById('loginCard');
    if (loginCard) {
        // Beri sedikit jeda waktu render, lalu jalankan animasi pergerakannya
        setTimeout(() => {
            loginCard.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
            loginCard.style.opacity = "1";
            loginCard.style.transform = "translateY(0)";
        }, 50); // Jeda 50 milidetik
    }
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorLogin = document.getElementById('errorLogin');
    const wrapperEmergencyLogout = document.getElementById('wrapperEmergencyLogout');
    const btnEmergencyLogout = document.getElementById('btnEmergencyLogout');

    // 1. Cek status sesi akun secara realtime
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Jika akun tersangkut di halaman login, tampilkan tombol logout darurat
            if (wrapperEmergencyLogout) {
                wrapperEmergencyLogout.classList.remove('hidden');
            }
            console.log("Sesi aktif terdeteksi atas nama:", user.email);
        } else {
            if (wrapperEmergencyLogout) {
                wrapperEmergencyLogout.classList.add('hidden');
            }
        }
    });

    // 2. Aksi Tombol Paksa Logout (jika sesi nyangkut)
    if (btnEmergencyLogout) {
        btnEmergencyLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
                alert("Sesi berhasil dibersihkan! Silakan coba login kembali.");
                window.location.reload();
            } catch (err) {
                alert("Gagal logout: " + err.message);
            }
        });
    }

    // 3. Proses Submit Form Login dengan Animasi Sinyal Realtime
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorLogin) errorLogin.classList.add('hidden');

            const submitBtn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const loginCard = document.getElementById('loginCard'); // Pastikan elemen kotak login punya id ini

            // Ubah tombol jadi status loading
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            btnText.textContent = "Menghubungkan ke Server...";

            try {
                // Menunggu sinyal realtime balokan sukses dari Firebase Authentication
                await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
                
                // SINYAL BERHASIL DITERIMA! 
                // Jalankan animasi keluar (fade-out / slide ke atas) sebelum pindah halaman
                if (loginCard) {
                    loginCard.style.transition = "all 0.5s ease-in-out";
                    loginCard.style.opacity = "0";
                    loginCard.style.transform = "translateY(-20px)";
                }
                
                btnText.textContent = "Berhasil! Masuk...";

                // Beri jeda 0.5 detik sesuai durasi animasi, lalu pindah ke admin.html
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);

            } catch (err) {
                console.error("Gagal login:", err);
                
                // Kembalikan tombol seperti semula jika gagal
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                btnText.textContent = "Masuk ke Dashboard";

                if (errorLogin) {
                    errorLogin.textContent = "Gagal masuk: Periksa kembali email dan password kamu.";
                    errorLogin.classList.remove('hidden');
                }
            }
        });
    }
});