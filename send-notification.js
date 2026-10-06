const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

// Inisialisasi Firebase Admin jika belum diinisialisasi
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({
    credential: cert(serviceAccount)
  });
}

module.exports = async (req, res) => {
  // Izinkan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method tidak diizinkan.' });
  }

  const { title, body, tokens } = req.body || {};

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

    return res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Gagal mengirim notifikasi:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};