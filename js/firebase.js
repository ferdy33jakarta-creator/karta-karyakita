// Import Modul Firebase (versi Web Modular SDK v10+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tambahkan import Auth di sini!
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Konfigurasi Firebase Project Kamu
const firebaseConfig = {
    apiKey: "AIzaSyAtXcbkaCVs_c9BNMLhnurSx54hF01CYD0",
    authDomain: "karta-karya-kita.firebaseapp.com",
    projectId: "karta-karya-kita",
    storageBucket: "karta-karya-kita.firebasestorage.app",
    messagingSenderId: "526981647271",
    appId: "1:526981647271:web:dfe4ae2dc6d27faff5c482"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Inisialisasi Auth di sini!

// Export db, auth, beserta fungsi-fungsi Firestore lainnya
export { 
    db, 
    auth, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    deleteDoc, 
    doc 
};