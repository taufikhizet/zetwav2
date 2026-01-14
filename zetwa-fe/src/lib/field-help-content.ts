/**
 * Field Help Content - Comprehensive explanations for all form fields
 * Used by FieldHelp component to display detailed information
 */

import { FieldHelpContent } from '@/components/ui/field-help'

// ============================================
// SESSION FIELDS
// ============================================

export const SESSION_HELP: Record<string, FieldHelpContent> = {
  // Basic Info
  sessionName: {
    title: 'Nama Session',
    description: 'Identifier unik untuk membedakan setiap koneksi WhatsApp Anda.',
    details: {
      whatItDoes: 'Nama session digunakan sebagai pengenal unik untuk koneksi WhatsApp ini. Nama ini akan muncul di dashboard dan digunakan dalam API calls untuk mengidentifikasi session mana yang ingin Anda gunakan.',
      whenToUse: 'Pilih nama yang deskriptif dan mudah diingat. Misalnya, jika Anda memiliki beberapa nomor WhatsApp untuk berbagai keperluan, beri nama sesuai fungsinya.',
      examples: [
        'customer-support',
        'marketing-bot',
        'notification-service',
        'sales-team-01',
      ],
      tips: [
        'Gunakan huruf kecil untuk konsistensi',
        'Gunakan tanda hubung (-) untuk memisahkan kata',
        'Hindari spasi dan karakter khusus',
        'Buat nama yang menjelaskan fungsi session',
      ],
      notes: [
        'Nama session tidak bisa diubah setelah dibuat',
        'Hanya boleh mengandung huruf, angka, underscore (_) dan tanda hubung (-)',
        'Nama harus unik dalam akun Anda',
      ],
    },
  },

  description: {
    title: 'Deskripsi',
    description: 'Catatan tambahan tentang kegunaan session ini.',
    details: {
      whatItDoes: 'Deskripsi adalah catatan bebas yang membantu Anda mengingat tujuan dan konteks dari session ini. Deskripsi hanya untuk referensi internal dan tidak mempengaruhi fungsi session.',
      whenToUse: 'Tambahkan deskripsi jika Anda memiliki banyak session atau tim yang berbeda menggunakan dashboard ini. Deskripsi membantu komunikasi antar tim.',
      examples: [
        'Session untuk menangani pertanyaan customer via bot',
        'Kirim notifikasi transaksi ke customer',
        'Bot marketing untuk campaign promo Ramadhan 2026',
      ],
      tips: [
        'Tulis siapa yang bertanggung jawab atas session ini',
        'Catat tujuan utama penggunaan',
        'Tambahkan informasi kontak jika perlu',
      ],
    },
  },

  autoStart: {
    title: 'Mulai Session Otomatis',
    description: 'Apakah session langsung diaktifkan setelah dibuat.',
    details: {
      whatItDoes: 'Ketika diaktifkan, sistem akan langsung menginisialisasi koneksi WhatsApp setelah session dibuat. Anda akan melihat QR code untuk di-scan dengan aplikasi WhatsApp di HP Anda.',
      whenToUse: 'Aktifkan jika Anda ingin langsung menghubungkan WhatsApp. Matikan jika Anda hanya ingin menyiapkan konfigurasi terlebih dahulu dan menghubungkan nanti.',
      defaultValue: 'Aktif (true)',
      tips: [
        'Biarkan aktif untuk pengalaman setup yang lebih cepat',
        'Matikan jika Anda perlu mengkonfigurasi webhook terlebih dahulu',
      ],
    },
  },

  // Debug & Development
  debugMode: {
    title: 'Mode Debug',
    description: 'Aktifkan logging detail untuk troubleshooting.',
    details: {
      whatItDoes: 'Mode debug mengaktifkan pencatatan (logging) yang sangat detail tentang semua aktivitas session. Ini termasuk koneksi WebSocket, pesan yang dikirim/diterima, dan error yang terjadi.',
      whenToUse: 'Aktifkan hanya ketika Anda mengalami masalah dan perlu mendiagnosis apa yang salah. Mode ini menghasilkan banyak log yang bisa memperlambat sistem.',
      defaultValue: 'Nonaktif (false)',
      tips: [
        'Gunakan hanya untuk debugging, bukan di production',
        'Periksa log di console browser atau server log',
        'Matikan setelah selesai debugging',
      ],
      notes: [
        'Mode debug dapat memperlambat performa',
        'Log mungkin berisi informasi sensitif',
        'Tidak disarankan untuk penggunaan produksi',
      ],
    },
  },

  // Device Identification
  deviceName: {
    title: 'Nama Device',
    description: 'Nama sistem operasi yang ditampilkan di WhatsApp.',
    details: {
      whatItDoes: 'Mengatur bagaimana session ini muncul di daftar "Perangkat Tertaut" (Linked Devices) di aplikasi WhatsApp HP Anda. Nilai ini ditampilkan sebagai nama sistem operasi.',
      whenToUse: 'Ubah jika Anda ingin membedakan berbagai session di daftar perangkat tertaut, atau untuk menyamarkan bahwa ini adalah bot.',
      examples: [
        'Windows',
        'macOS',
        'Linux',
        'Ubuntu',
        'Server Bot',
      ],
      defaultValue: 'Otomatis berdasarkan sistem',
      tips: [
        'Gunakan nama yang familiar agar tidak mencurigakan',
        'Beri nama unik jika memiliki banyak session',
      ],
    },
  },

  browserName: {
    title: 'Nama Browser',
    description: 'Nama browser yang ditampilkan di WhatsApp.',
    details: {
      whatItDoes: 'Sama seperti Device Name, ini mengatur nama browser yang ditampilkan di daftar perangkat tertaut WhatsApp.',
      whenToUse: 'Ubah untuk membedakan session atau menyamarkan penggunaan bot.',
      examples: [
        'Chrome',
        'Firefox',
        'Safari',
        'Edge',
      ],
      defaultValue: 'Chrome (default)',
    },
  },

  // Proxy Configuration
  useProxy: {
    title: 'Gunakan Proxy',
    description: 'Aktifkan routing traffic melalui proxy server.',
    details: {
      whatItDoes: 'Ketika diaktifkan, semua koneksi WhatsApp akan dirutekan melalui server proxy yang Anda tentukan. Ini mengubah alamat IP yang terlihat oleh WhatsApp.',
      whenToUse: 'Gunakan proxy jika: (1) IP server Anda diblokir oleh WhatsApp, (2) Anda perlu mengakses dari lokasi geografis tertentu, (3) Untuk privasi dan keamanan tambahan, (4) Untuk menghindari rate limiting.',
      tips: [
        'Gunakan proxy yang stabil dan cepat',
        'Pilih lokasi proxy yang dekat dengan pengguna',
        'Pastikan proxy mendukung WebSocket',
      ],
      notes: [
        'Proxy yang lambat akan mempengaruhi kecepatan pengiriman pesan',
        'Beberapa proxy gratis mungkin tidak stabil',
        'WhatsApp mungkin memblokir IP proxy yang dikenal',
      ],
    },
  },

  proxyServer: {
    title: 'Alamat Proxy Server',
    description: 'URL lengkap server proxy termasuk protokol dan port.',
    details: {
      whatItDoes: 'Menentukan alamat server proxy yang akan digunakan untuk semua koneksi WhatsApp. Format harus lengkap dengan protokol (http/https/socks5) dan port.',
      whenToUse: 'Masukkan alamat proxy yang valid. Pastikan proxy server aktif dan dapat diakses dari server Anda.',
      examples: [
        'http://proxy.example.com:8080',
        'https://secure-proxy.com:443',
        'socks5://proxy.server.com:1080',
        'http://192.168.1.100:3128',
      ],
      tips: [
        'Test koneksi proxy terlebih dahulu',
        'Gunakan HTTPS proxy untuk keamanan lebih',
        'Simpan informasi login proxy dengan aman',
      ],
      notes: [
        'Port harus disertakan dalam URL',
        'Pastikan firewall mengizinkan koneksi ke proxy',
      ],
    },
  },

  proxyUsername: {
    title: 'Username Proxy',
    description: 'Username untuk autentikasi ke proxy server.',
    details: {
      whatItDoes: 'Jika proxy server Anda memerlukan autentikasi, masukkan username di sini. Kredensial ini akan dikirim ke proxy server saat membuat koneksi.',
      whenToUse: 'Hanya diperlukan jika proxy server memerlukan login. Proxy publik biasanya tidak memerlukan ini.',
      tips: [
        'Jangan gunakan kredensial yang sama dengan akun lain',
        'Gunakan akun proxy khusus untuk aplikasi ini',
      ],
    },
  },

  proxyPassword: {
    title: 'Password Proxy',
    description: 'Password untuk autentikasi ke proxy server.',
    details: {
      whatItDoes: 'Password yang dipasangkan dengan username untuk autentikasi ke proxy server.',
      whenToUse: 'Masukkan password proxy jika diperlukan untuk autentikasi.',
      notes: [
        'Password disimpan secara terenkripsi',
        'Jangan bagikan password proxy kepada orang lain',
      ],
    },
  },

  // Event Filters
  ignoreStatus: {
    title: 'Abaikan Status/Story',
    description: 'Tidak menerima event dari Status WhatsApp (Story).',
    details: {
      whatItDoes: 'Ketika diaktifkan, semua event yang terkait dengan Status WhatsApp (fitur story 24 jam) akan diabaikan. Ini termasuk status yang diposting oleh kontak Anda.',
      whenToUse: 'Aktifkan jika aplikasi Anda tidak perlu memproses Status/Story WhatsApp. Ini umum untuk bot customer service atau notification system.',
      defaultValue: 'Nonaktif (menerima semua)',
      tips: [
        'Aktifkan untuk mengurangi traffic yang tidak perlu',
        'Bot biasanya tidak perlu memproses Status',
        'Menghemat bandwidth dan processing',
      ],
    },
  },

  ignoreGroups: {
    title: 'Abaikan Grup',
    description: 'Tidak menerima event dari grup WhatsApp.',
    details: {
      whatItDoes: 'Ketika diaktifkan, semua pesan dan event dari grup WhatsApp akan diabaikan. Hanya pesan personal (chat 1-on-1) yang akan diterima.',
      whenToUse: 'Aktifkan jika bot Anda hanya melayani chat personal. Misalnya, bot customer service yang tidak perlu merespons di grup.',
      defaultValue: 'Nonaktif (menerima pesan grup)',
      tips: [
        'Aktifkan untuk bot yang fokus pada customer service personal',
        'Matikan jika bot perlu merespons di grup support',
      ],
      notes: [
        'Bot masih bisa mengirim pesan ke grup meskipun ini diaktifkan',
        'Hanya mempengaruhi penerimaan event, bukan pengiriman',
      ],
    },
  },

  ignoreChannels: {
    title: 'Abaikan Channel',
    description: 'Tidak menerima event dari Channel WhatsApp.',
    details: {
      whatItDoes: 'Channel WhatsApp adalah fitur broadcast satu arah (seperti Telegram Channel). Ketika diaktifkan, event dari channel yang Anda ikuti akan diabaikan.',
      whenToUse: 'Aktifkan jika Anda tidak perlu memproses update dari Channel WhatsApp.',
      defaultValue: 'Nonaktif (menerima update channel)',
    },
  },

  ignoreBroadcast: {
    title: 'Abaikan Broadcast',
    description: 'Tidak menerima event dari Broadcast List.',
    details: {
      whatItDoes: 'Broadcast List adalah fitur untuk mengirim pesan ke banyak kontak sekaligus. Ketika diaktifkan, pesan broadcast yang Anda terima akan diabaikan.',
      whenToUse: 'Aktifkan jika bot tidak perlu merespons pesan broadcast. Ini berbeda dari pesan personal biasa.',
      defaultValue: 'Nonaktif (menerima broadcast)',
    },
  },

  // NOWEB Engine Configuration
  nowebStoreEnabled: {
    title: 'Aktifkan Store',
    description: 'Simpan data kontak, chat, dan pesan secara lokal.',
    details: {
      whatItDoes: 'Store menyimpan data kontak, riwayat chat, dan pesan secara lokal. Ini memungkinkan akses cepat ke data tanpa harus query ke WhatsApp server.',
      whenToUse: 'Aktifkan jika Anda perlu mengakses daftar kontak, riwayat chat, atau pencarian pesan. Matikan jika hanya perlu kirim/terima pesan.',
      defaultValue: 'Aktif (true)',
      tips: [
        'Aktifkan untuk fitur lengkap (kontak, chat history)',
        'Matikan untuk menghemat memory jika hanya kirim pesan',
      ],
      notes: [
        'Memakan lebih banyak memory dan storage',
        'Data disimpan terenkripsi',
      ],
    },
  },

  nowebFullSync: {
    title: 'Full Sync',
    description: 'Sinkronisasi penuh semua data saat koneksi.',
    details: {
      whatItDoes: 'Ketika diaktifkan, sistem akan mengunduh semua data (kontak, chat, pesan) saat session pertama kali terhubung. Ini memakan waktu lebih lama tapi data lebih lengkap.',
      whenToUse: 'Aktifkan jika Anda memerlukan akses ke riwayat chat dan kontak lengkap. Matikan untuk koneksi yang lebih cepat.',
      defaultValue: 'Nonaktif (partial sync)',
      tips: [
        'Aktifkan untuk aplikasi yang perlu riwayat lengkap',
        'Koneksi awal akan lebih lambat',
      ],
      notes: [
        'Proses sync bisa memakan waktu beberapa menit',
        'Memerlukan storage lebih besar',
      ],
    },
  },

  nowebMarkOnline: {
    title: 'Tandai Online',
    description: 'Tampilkan status online saat session aktif.',
    details: {
      whatItDoes: 'Ketika diaktifkan, nomor WhatsApp akan terlihat "online" oleh kontak lain saat session aktif. Jika dimatikan, status akan selalu offline.',
      whenToUse: 'Matikan jika Anda ingin bot beroperasi secara "silent" tanpa menunjukkan status online. Aktifkan untuk pengalaman yang lebih natural.',
      defaultValue: 'Aktif (true)',
      tips: [
        'Matikan untuk bot yang tidak perlu terlihat online',
        'Aktifkan untuk customer service agar terlihat responsif',
      ],
    },
  },

  // Metadata
  metadata: {
    title: 'Custom Metadata',
    description: 'Data tambahan dalam format JSON yang disertakan di webhook.',
    details: {
      whatItDoes: 'Metadata adalah data custom dalam format JSON yang akan disertakan dalam setiap webhook payload. Anda bisa menyimpan informasi apapun yang berguna untuk aplikasi Anda.',
      whenToUse: 'Gunakan untuk menyimpan informasi tambahan seperti ID internal, kategori session, atau data konfigurasi khusus yang dibutuhkan aplikasi backend Anda.',
      examples: [
        '{"tenant_id": "abc123", "tier": "premium"}',
        '{"department": "sales", "region": "jakarta"}',
        '{"bot_version": "2.0", "features": ["auto-reply"]}',
      ],
      tips: [
        'Gunakan untuk tracking dan kategorisasi',
        'Jangan simpan data sensitif di metadata',
        'Pastikan format JSON valid',
      ],
      notes: [
        'Harus dalam format JSON yang valid',
        'Akan dikirim di setiap webhook event',
      ],
    },
  },
}

// ============================================
// WEBHOOK FIELDS
// ============================================

export const WEBHOOK_HELP: Record<string, FieldHelpContent> = {
  webhookName: {
    title: 'Nama Webhook',
    description: 'Identifier untuk membedakan webhook yang berbeda.',
    details: {
      whatItDoes: 'Nama webhook membantu Anda mengidentifikasi dan mengelola berbagai endpoint webhook. Nama ini muncul di dashboard dan log.',
      whenToUse: 'Beri nama yang menjelaskan tujuan webhook. Jika tidak diisi, akan otomatis dibuat dari hostname URL.',
      examples: [
        'Backend Server',
        'CRM Integration',
        'Analytics Service',
        'Notification Handler',
      ],
      tips: [
        'Gunakan nama yang deskriptif',
        'Sertakan nama service/sistem tujuan',
      ],
    },
  },

  webhookUrl: {
    title: 'URL Webhook',
    description: 'Endpoint yang akan menerima notifikasi event.',
    details: {
      whatItDoes: 'URL ini adalah endpoint HTTP/HTTPS yang akan dipanggil setiap kali event terjadi. Server Anda harus menerima POST request di URL ini.',
      whenToUse: 'Masukkan URL endpoint server Anda yang akan memproses webhook. Endpoint harus dapat diakses dari internet.',
      examples: [
        'https://api.myapp.com/webhooks/whatsapp',
        'https://hooks.zapier.com/hooks/catch/xxx',
        'https://myserver.com/api/wa-events',
      ],
      tips: [
        'Gunakan HTTPS untuk keamanan',
        'Pastikan endpoint dapat diakses publik',
        'Implementasi response yang cepat (< 5 detik)',
        'Gunakan queue untuk proses yang lama',
      ],
      notes: [
        'URL harus menggunakan HTTP atau HTTPS',
        'Server harus merespons dengan status 2xx',
        'Timeout default adalah 30 detik',
      ],
    },
  },

  webhookEvents: {
    title: 'Events',
    description: 'Jenis event yang akan dikirim ke webhook ini.',
    details: {
      whatItDoes: 'Menentukan event apa saja yang akan memicu pengiriman webhook. Anda bisa memilih event spesifik atau semua event.',
      whenToUse: 'Pilih hanya event yang Anda butuhkan untuk mengurangi traffic. Gunakan "All Events" jika perlu menerima semua notifikasi.',
      examples: [
        'message - Pesan masuk baru',
        'message.ack - Status delivered/read',
        'session.status - Perubahan status koneksi',
        'group.join - Ada yang join grup',
      ],
      tips: [
        'Pilih "All Events" untuk development',
        'Kurangi event di production untuk performa',
        'Event paling umum: message, message.ack',
      ],
      notes: [
        'Memilih "*" akan mengirim semua jenis event',
        'Event yang tidak dipilih tidak akan dikirim',
      ],
    },
  },

  hmacSecret: {
    title: 'HMAC Secret',
    description: 'Kunci rahasia untuk verifikasi signature webhook.',
    details: {
      whatItDoes: 'HMAC Secret digunakan untuk membuat signature di setiap request webhook. Server Anda bisa memverifikasi bahwa request benar-benar dari sistem ini, bukan dari pihak lain.',
      whenToUse: 'Sangat disarankan untuk production! Gunakan untuk memastikan keamanan webhook dan mencegah request palsu (spoofing).',
      examples: [
        'my-secret-key-123',
        'a1b2c3d4e5f6g7h8i9j0',
      ],
      tips: [
        'Gunakan string random yang panjang dan kompleks',
        'Simpan secret di environment variable',
        'Jangan share secret via chat/email',
        'Rotasi secret secara berkala',
      ],
      notes: [
        'Signature dikirim di header X-Webhook-Signature',
        'Gunakan HMAC-SHA256 untuk verifikasi',
        'Wajib untuk keamanan di production',
      ],
    },
  },

  retryAttempts: {
    title: 'Jumlah Retry',
    description: 'Berapa kali mencoba ulang jika pengiriman gagal.',
    details: {
      whatItDoes: 'Jika server Anda tidak merespons atau mengembalikan error, sistem akan mencoba mengirim ulang sebanyak jumlah ini.',
      whenToUse: 'Set nilai yang wajar berdasarkan kebutuhan. Untuk event penting, gunakan nilai lebih tinggi.',
      defaultValue: '3 kali',
      examples: [
        '0 - Tidak ada retry',
        '3 - Retry 3 kali (default)',
        '5 - Retry 5 kali untuk event kritis',
      ],
      tips: [
        'Gunakan 3-5 untuk keseimbangan',
        'Nilai 0 berarti tidak ada retry',
        'Maximum 15 kali retry',
      ],
      notes: [
        'Retry hanya terjadi jika request gagal',
        'Status 2xx dianggap sukses',
        'Status 4xx/5xx akan di-retry',
      ],
    },
  },

  retryDelay: {
    title: 'Delay Retry',
    description: 'Jeda waktu antar percobaan retry (dalam detik).',
    details: {
      whatItDoes: 'Menentukan berapa detik sistem menunggu sebelum mencoba mengirim ulang webhook yang gagal.',
      whenToUse: 'Set delay yang cukup untuk memberi waktu server Anda recover jika sedang overload.',
      defaultValue: '2 detik',
      tips: [
        'Delay lebih lama memberi waktu server recover',
        'Delay terlalu pendek bisa membuat server overload',
        'Kombinasikan dengan policy exponential untuk hasil terbaik',
      ],
    },
  },

  retryPolicy: {
    title: 'Retry Policy',
    description: 'Strategi penghitungan delay antar retry.',
    details: {
      whatItDoes: 'Menentukan bagaimana delay dihitung untuk setiap percobaan retry.',
      whenToUse: 'Pilih berdasarkan karakteristik server tujuan dan seberapa penting event tersebut.',
      examples: [
        'linear - Delay tetap (2s, 2s, 2s)',
        'exponential - Delay meningkat (2s, 4s, 8s)',
        'constant - Sama seperti linear',
      ],
      defaultValue: 'linear',
      tips: [
        'Exponential baik untuk menghindari overload',
        'Linear baik untuk latency yang konsisten',
        'Gunakan exponential untuk production',
      ],
    },
  },

  webhookTimeout: {
    title: 'Timeout',
    description: 'Batas waktu menunggu response dari server.',
    details: {
      whatItDoes: 'Timeout menentukan berapa lama sistem menunggu response dari server webhook Anda sebelum dianggap gagal.',
      whenToUse: 'Set timeout berdasarkan kompleksitas proses di server Anda. Proses sederhana bisa gunakan timeout pendek.',
      defaultValue: '30 detik (30000 ms)',
      examples: [
        '5000 - 5 detik untuk proses cepat',
        '30000 - 30 detik (default)',
        '60000 - 60 detik untuk proses kompleks',
      ],
      tips: [
        'Gunakan timeout pendek + queue untuk proses lama',
        'Server harus response cepat dan process async',
        'Timeout terlalu lama bisa menumpuk request',
      ],
      notes: [
        'Nilai dalam milidetik',
        'Minimum 1000ms, maximum 120000ms',
        'Request yang timeout akan di-retry',
      ],
    },
  },

  customHeaders: {
    title: 'Custom Headers',
    description: 'Header HTTP tambahan yang dikirim dengan webhook.',
    details: {
      whatItDoes: 'Anda bisa menambahkan header HTTP custom ke setiap request webhook. Ini berguna untuk authentication atau routing.',
      whenToUse: 'Gunakan untuk menambahkan API key, authentication token, atau identifier khusus yang dibutuhkan server Anda.',
      examples: [
        'X-API-Key: your-api-key',
        'Authorization: Bearer token123',
        'X-Tenant-ID: customer-abc',
      ],
      tips: [
        'Gunakan untuk authentication tambahan',
        'Hindari duplikasi dengan header standar',
        'Pastikan nama header valid (tanpa spasi)',
      ],
      notes: [
        'Header Content-Type sudah di-set otomatis ke application/json',
        'Beberapa header tidak bisa di-override',
      ],
    },
  },

  webhookIsActive: {
    title: 'Status Aktif',
    description: 'Apakah webhook ini aktif menerima event.',
    details: {
      whatItDoes: 'Mengontrol apakah webhook ini akan menerima event atau tidak. Webhook yang tidak aktif akan diabaikan.',
      whenToUse: 'Nonaktifkan sementara jika server sedang maintenance atau untuk debugging tanpa menghapus konfigurasi.',
      defaultValue: 'Aktif (true)',
      tips: [
        'Nonaktifkan daripada hapus untuk maintenance',
        'Aktifkan kembali setelah testing selesai',
      ],
    },
  },
}

// ============================================
// COMBINED EXPORTS
// ============================================

export const FIELD_HELP = {
  session: SESSION_HELP,
  webhook: WEBHOOK_HELP,
}

export default FIELD_HELP
