importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAtXcbkaCVs_c9BNMLhnurSx54hF01CYD0",
    authDomain: "karta-karya-kita.firebaseapp.com",
    projectId: "karta-karya-kita",
    storageBucket: "karta-karya-kita.firebasestorage.app",
    messagingSenderId: "526981647271",
    appId: "1:526981647271:web:dfe4ae2dc6d27faff5c482"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || '📢 Pengumuman Baru!';
    const notificationOptions = {
        body: payload.notification.body || 'Ada informasi baru dari Karta RT 07.',
        icon: 'assets/logo.jpg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});