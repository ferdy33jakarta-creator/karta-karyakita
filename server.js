const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

// 1. Load Kredensial Firebase (Dukungan untuk Lokal dan Cloud/Render)
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Jika berjalan di cloud (Render/Railway), ambil dari Environment Variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Jika berjalan di laptop/lokal, ambil dari file json lokal
  serviceAccount = require('./service-account.json');
}

// 2. Inisialisasi Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// Tes route
app.get('/', (req, res) => {
  res.send('Server FCM Backend RT 07 Berjalan!');
});

// 3. Endpoint Pengiriman Notifikasi
app.post('/api/send-notification', async (req, res) => {
  const { title, body, tokens } = req.body;

  if (!tokens || tokens.length === 0) {
    return res.status(400).json({ success: false, message: 'Token warga tidak ditemukan.' });
  }

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: title,
        body: body
      },
      webpush: {
        fcmOptions: {
          link: 'https://karta-karyakita.vercel.app/'
        }
      }
    });

    console.log(`Notifikasi terkirim! Sukses: ${response.successCount}, Gagal: ${response.failureCount}`);
    res.json({ success: true, response });
  } catch (error) {
    console.error('Gagal mengirim notifikasi:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server FCM Backend running on port ${PORT}`));