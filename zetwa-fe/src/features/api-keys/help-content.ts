/**
 * API Key Field Help Content
 * Comprehensive explanations for all API key form fields
 */

import type { FieldHelpContent } from '@/components/ui/field-help'

export const API_KEY_HELP: Record<string, FieldHelpContent> = {
  // Basic Info
  name: {
    title: 'Nama API Key',
    description: 'Identifier untuk mengenali API key ini dengan mudah.',
    details: {
      whatItDoes:
        'Nama API key digunakan sebagai label untuk mengidentifikasi key ini di dashboard. Nama yang baik membantu Anda mengingat tujuan dan aplikasi yang menggunakan key ini.',
      whenToUse:
        'Pilih nama yang deskriptif berdasarkan aplikasi atau layanan yang akan menggunakan API key ini. Nama yang jelas memudahkan pengelolaan ketika Anda memiliki banyak key.',
      examples: [
        'Production Bot Server',
        'Development Testing',
        'Mobile App Integration',
        'N8N Automation',
        'Zapier Webhook',
        'Internal Dashboard',
      ],
      tips: [
        'Gunakan nama yang menjelaskan aplikasi pengguna',
        'Tambahkan environment (prod/dev/staging) jika perlu',
        'Hindari informasi sensitif dalam nama',
        'Nama dapat diubah kapan saja',
      ],
      notes: [
        'Nama minimal 3 karakter, maksimal 100 karakter',
        'Nama tidak harus unik, tapi sebaiknya berbeda untuk setiap key',
      ],
    },
  },

  description: {
    title: 'Deskripsi',
    description: 'Catatan tambahan tentang kegunaan API key ini.',
    details: {
      whatItDoes:
        'Deskripsi adalah catatan bebas yang membantu Anda dan tim mengingat tujuan, konteks, dan informasi penting tentang API key ini. Deskripsi hanya untuk referensi internal.',
      whenToUse:
        'Tambahkan deskripsi ketika Anda memiliki banyak API key atau tim yang berbeda menggunakan dashboard. Deskripsi membantu dokumentasi dan komunikasi.',
      examples: [
        'API key untuk server bot WhatsApp production di AWS EC2',
        'Key untuk testing fitur baru di environment development',
        'Digunakan oleh tim marketing untuk integrasi dengan CRM',
        'Key khusus untuk webhook notifikasi transaksi',
      ],
      tips: [
        'Catat siapa yang bertanggung jawab atas key ini',
        'Tulis tujuan utama penggunaan',
        'Tambahkan informasi server/aplikasi yang menggunakan',
        'Dokumentasikan jika ada batasan khusus',
      ],
    },
  },

  expiresAt: {
    title: 'Tanggal Kadaluarsa',
    description: 'Kapan API key ini akan otomatis nonaktif.',
    details: {
      whatItDoes:
        'Tanggal kadaluarsa menentukan kapan API key secara otomatis berhenti bekerja. Setelah tanggal ini, semua request menggunakan key ini akan ditolak dengan error 401 Unauthorized.',
      whenToUse:
        'Gunakan tanggal kadaluarsa untuk key sementara seperti testing, demo, atau akses contractor. Untuk key production yang permanen, biarkan kosong.',
      defaultValue: 'Tidak ada (key tidak pernah kadaluarsa)',
      tips: [
        'Biarkan kosong untuk key production permanen',
        'Set 30-90 hari untuk key development/testing',
        'Gunakan tanggal spesifik untuk akses temporary',
        'Key yang kadaluarsa bisa di-regenerate kapan saja',
      ],
      notes: [
        'Key yang sudah kadaluarsa tidak akan dihapus, hanya dinonaktifkan',
        'Anda akan melihat badge "Expired" untuk key yang sudah kadaluarsa',
        'Tanggal harus di masa depan (minimal besok)',
      ],
    },
  },

  scopes: {
    title: 'Permissions (Scopes)',
    description: 'Izin akses yang diberikan kepada API key ini.',
    details: {
      whatItDoes:
        'Scopes menentukan apa saja yang bisa dilakukan oleh API key ini. Dengan sistem scope, Anda bisa memberikan akses minimum yang diperlukan (principle of least privilege) untuk keamanan maksimal.',
      whenToUse:
        'Pilih hanya scope yang benar-benar dibutuhkan oleh aplikasi. Jangan berikan scope yang tidak diperlukan untuk mengurangi risiko keamanan.',
      tips: [
        'Gunakan prinsip "least privilege" - berikan akses minimum',
        'Bot pengirim pesan hanya perlu messages:send',
        'Dashboard monitoring cukup dengan scope read saja',
        'Scope bisa diubah kapan saja tanpa regenerate key',
      ],
      notes: [
        'Minimal harus memilih 1 scope',
        'Scope write biasanya mencakup aksi read juga',
        'Perubahan scope langsung berlaku',
      ],
    },
  },

  // Individual Scope Explanations
  'scope:sessions:read': {
    title: 'Sessions: Read',
    description: 'Membaca informasi dan status session WhatsApp.',
    details: {
      whatItDoes:
        'Memberikan akses untuk melihat daftar session, status koneksi (connected/disconnected), informasi device, dan metadata session.',
      whenToUse:
        'Gunakan untuk aplikasi monitoring, dashboard status, atau sistem yang perlu mengecek apakah WhatsApp terhubung.',
      examples: [
        'GET /api/sessions - List semua session',
        'GET /api/sessions/{name} - Detail session',
        'GET /api/sessions/{name}/me - Info akun WhatsApp',
      ],
    },
  },

  'scope:sessions:write': {
    title: 'Sessions: Write',
    description: 'Membuat, menghapus, dan mengontrol session WhatsApp.',
    details: {
      whatItDoes:
        'Memberikan akses untuk membuat session baru, start/stop session, logout, dan menghapus session. Ini adalah akses penuh untuk manajemen session.',
      whenToUse:
        'Gunakan untuk aplikasi yang perlu mengelola lifecycle session seperti auto-reconnect handler atau admin panel.',
      examples: [
        'POST /api/sessions - Buat session baru',
        'POST /api/sessions/{name}/start - Start session',
        'POST /api/sessions/{name}/stop - Stop session',
        'DELETE /api/sessions/{name} - Hapus session',
      ],
      notes: [
        'Scope ini powerful, berikan hanya jika benar-benar perlu',
        'Termasuk kemampuan logout yang akan memutus koneksi WhatsApp',
      ],
    },
  },

  'scope:messages:send': {
    title: 'Messages: Send',
    description: 'Mengirim pesan WhatsApp (teks, media, lokasi, dll).',
    details: {
      whatItDoes:
        'Memberikan akses untuk mengirim berbagai jenis pesan: teks, gambar, video, dokumen, lokasi, kontak, sticker, dan reaction.',
      whenToUse:
        'Scope paling umum untuk bot dan automation. Gunakan untuk aplikasi yang perlu mengirim notifikasi, broadcast, atau auto-reply.',
      examples: [
        'POST /api/sendText - Kirim pesan teks',
        'POST /api/sendImage - Kirim gambar',
        'POST /api/sendFile - Kirim dokumen',
        'POST /api/sendLocation - Kirim lokasi',
      ],
      tips: [
        'Ini scope yang paling sering dibutuhkan',
        'Tidak termasuk membaca pesan (perlu messages:read)',
      ],
    },
  },

  'scope:messages:read': {
    title: 'Messages: Read',
    description: 'Membaca riwayat dan status pesan.',
    details: {
      whatItDoes:
        'Memberikan akses untuk membaca history pesan, status delivered/read, dan informasi pesan lainnya.',
      whenToUse:
        'Gunakan untuk aplikasi CRM, logging, atau sistem yang perlu tracking history percakapan.',
      examples: [
        'GET /api/{session}/messages - List pesan',
        'GET /api/{session}/messages/{id} - Detail pesan',
      ],
    },
  },

  'scope:contacts:read': {
    title: 'Contacts: Read',
    description: 'Membaca daftar kontak WhatsApp.',
    details: {
      whatItDoes:
        'Memberikan akses untuk melihat daftar kontak, profile picture, about/status, dan informasi kontak lainnya.',
      whenToUse: 'Gunakan untuk sinkronisasi kontak ke CRM atau aplikasi yang perlu validasi nomor WhatsApp.',
      examples: [
        'GET /api/{session}/contacts - List kontak',
        'GET /api/{session}/contacts/{phone} - Detail kontak',
        'GET /api/{session}/contacts/{phone}/check - Cek nomor valid',
      ],
    },
  },

  'scope:contacts:write': {
    title: 'Contacts: Write',
    description: 'Membuat dan mengubah kontak.',
    details: {
      whatItDoes: 'Memberikan akses untuk block/unblock kontak dan operasi tulis lainnya.',
      whenToUse: 'Gunakan jika aplikasi perlu mengelola kontak secara programatis.',
    },
  },

  'scope:groups:read': {
    title: 'Groups: Read',
    description: 'Membaca informasi grup WhatsApp.',
    details: {
      whatItDoes:
        'Memberikan akses untuk melihat daftar grup, anggota grup, admin, deskripsi, dan settings grup.',
      whenToUse: 'Gunakan untuk aplikasi monitoring grup atau sistem yang perlu info keanggotaan.',
      examples: [
        'GET /api/{session}/groups - List grup',
        'GET /api/{session}/groups/{id} - Detail grup',
        'GET /api/{session}/groups/{id}/participants - Anggota grup',
      ],
    },
  },

  'scope:groups:write': {
    title: 'Groups: Write',
    description: 'Membuat dan mengelola grup WhatsApp.',
    details: {
      whatItDoes:
        'Memberikan akses penuh untuk manajemen grup: membuat grup, mengundang anggota, kick member, promote/demote admin, ubah settings.',
      whenToUse:
        'Gunakan untuk aplikasi admin grup atau sistem community management yang perlu otomatisasi grup.',
      examples: [
        'POST /api/{session}/groups - Buat grup baru',
        'POST /api/{session}/groups/{id}/participants/add - Tambah anggota',
        'POST /api/{session}/groups/{id}/participants/remove - Hapus anggota',
      ],
      notes: ['Scope ini powerful untuk manajemen grup', 'Perhatikan rate limit WhatsApp untuk operasi grup'],
    },
  },

  'scope:media:read': {
    title: 'Media: Read',
    description: 'Download file media dari pesan.',
    details: {
      whatItDoes: 'Memberikan akses untuk download gambar, video, audio, dokumen, dan sticker yang diterima.',
      whenToUse: 'Gunakan untuk aplikasi yang perlu menyimpan atau memproses media yang diterima.',
      examples: ['GET /api/{session}/media/{id} - Download media'],
    },
  },

  'scope:media:write': {
    title: 'Media: Write',
    description: 'Upload dan mengirim file media.',
    details: {
      whatItDoes: 'Memberikan akses untuk upload file ke server sebelum dikirim sebagai pesan.',
      whenToUse: 'Gunakan bersama messages:send untuk mengirim media dari file upload.',
    },
  },

  'scope:webhooks:read': {
    title: 'Webhooks: Read',
    description: 'Membaca konfigurasi webhook.',
    details: {
      whatItDoes: 'Memberikan akses untuk melihat daftar webhook yang dikonfigurasi dan statusnya.',
      whenToUse: 'Gunakan untuk dashboard monitoring atau sistem yang perlu audit konfigurasi webhook.',
    },
  },

  'scope:webhooks:write': {
    title: 'Webhooks: Write',
    description: 'Mengkonfigurasi dan mengubah webhook.',
    details: {
      whatItDoes: 'Memberikan akses untuk membuat, mengubah, dan menghapus konfigurasi webhook.',
      whenToUse: 'Gunakan untuk aplikasi yang perlu setup webhook secara dinamis.',
      notes: ['Perubahan webhook langsung berlaku', 'Pastikan URL webhook valid dan bisa diakses'],
    },
  },

  // Presence Scopes
  'scope:presence:read': {
    title: 'Presence: Read',
    description: 'Membaca status online/offline dan typing indicator kontak.',
    details: {
      whatItDoes: 'Memberikan akses untuk melihat status kehadiran kontak: online, offline, last seen, dan sedang mengetik.',
      whenToUse: 'Gunakan untuk aplikasi yang perlu menampilkan status real-time kontak atau analytics engagement.',
      examples: [
        'GET /api/{session}/presence/{contact} - Lihat status kontak',
        'POST /api/{session}/presence/subscribe - Subscribe ke update presence',
      ],
    },
  },

  'scope:presence:write': {
    title: 'Presence: Write',
    description: 'Mengatur status online dan typing indicator.',
    details: {
      whatItDoes: 'Memberikan akses untuk mengubah status presence: set online/offline, mengirim typing indicator, dan recording indicator.',
      whenToUse: 'Gunakan untuk bot yang perlu simulasi "sedang mengetik" sebelum mengirim pesan untuk user experience lebih natural.',
      examples: [
        'POST /api/{session}/presence - Set status online/offline',
        'POST /api/{session}/presence/typing/{chat} - Kirim typing indicator',
        'POST /api/{session}/presence/recording/{chat} - Kirim recording indicator',
      ],
      tips: [
        'Gunakan typing indicator untuk UX yang lebih manusiawi',
        'Jangan spam typing indicator, gunakan dengan wajar',
      ],
    },
  },

  // Labels Scopes (WhatsApp Business)
  'scope:labels:read': {
    title: 'Labels: Read',
    description: 'Membaca label WhatsApp Business.',
    details: {
      whatItDoes: 'Memberikan akses untuk melihat daftar label dan chat yang ter-label. Fitur ini hanya tersedia untuk akun WhatsApp Business.',
      whenToUse: 'Gunakan untuk sistem CRM atau dashboard yang perlu melihat kategorisasi chat berdasarkan label.',
      examples: [
        'GET /api/{session}/labels - List semua label',
        'GET /api/{session}/labels/{id}/chats - Chat dengan label tertentu',
      ],
      notes: ['Hanya untuk WhatsApp Business', 'Personal WhatsApp tidak mendukung labels'],
    },
  },

  'scope:labels:write': {
    title: 'Labels: Write',
    description: 'Membuat dan mengelola label WhatsApp Business.',
    details: {
      whatItDoes: 'Memberikan akses untuk membuat label baru, mengubah, menghapus, dan assign/unassign label ke chat.',
      whenToUse: 'Gunakan untuk sistem CRM atau automation yang perlu mengkategorisasi chat secara otomatis.',
      examples: [
        'POST /api/{session}/labels - Buat label baru',
        'POST /api/{session}/labels/assign - Assign label ke chat',
        'DELETE /api/{session}/labels/{id} - Hapus label',
      ],
      notes: ['Hanya untuk WhatsApp Business'],
    },
  },

  // Status/Stories Scopes
  'scope:status:read': {
    title: 'Status: Read',
    description: 'Melihat status/story dari kontak.',
    details: {
      whatItDoes: 'Memberikan akses untuk melihat status/story yang diposting oleh kontak Anda dan status Anda sendiri.',
      whenToUse: 'Gunakan untuk aplikasi monitoring atau analytics yang perlu tracking status kontak.',
      examples: [
        'GET /api/{session}/status - Status saya',
        'GET /api/{session}/status/contacts - Status dari kontak',
        'GET /api/{session}/status/contact/{id} - Status kontak tertentu',
      ],
    },
  },

  'scope:status:write': {
    title: 'Status: Write',
    description: 'Posting dan mengelola status/story WhatsApp.',
    details: {
      whatItDoes: 'Memberikan akses untuk posting status teks atau media, dan menghapus status.',
      whenToUse: 'Gunakan untuk aplikasi broadcasting atau marketing yang perlu posting status secara otomatis.',
      examples: [
        'POST /api/{session}/status/text - Post status teks',
        'POST /api/{session}/status/media - Post status gambar/video',
        'DELETE /api/{session}/status/{id} - Hapus status',
      ],
      tips: [
        'Status otomatis hilang setelah 24 jam',
        'Gunakan untuk promosi atau announcement',
      ],
    },
  },

  // Profile Scopes
  'scope:profile:read': {
    title: 'Profile: Read',
    description: 'Membaca informasi profil WhatsApp.',
    details: {
      whatItDoes: 'Memberikan akses untuk melihat profil WhatsApp: nama, about/bio, foto profil, dan info business profile.',
      whenToUse: 'Gunakan untuk dashboard yang perlu menampilkan info profil atau verifikasi setup akun.',
      examples: [
        'GET /api/{session}/profile - Info profil',
        'GET /api/{session}/profile/business - Business profile (WA Business)',
      ],
    },
  },

  'scope:profile:write': {
    title: 'Profile: Write',
    description: 'Mengubah profil WhatsApp.',
    details: {
      whatItDoes: 'Memberikan akses untuk mengubah nama display, about/bio, dan foto profil.',
      whenToUse: 'Gunakan jika aplikasi perlu mengelola profil secara programatis, misalnya branding atau personalisasi.',
      examples: [
        'PATCH /api/{session}/profile/name - Ubah nama',
        'PATCH /api/{session}/profile/about - Ubah about/bio',
        'PATCH /api/{session}/profile/picture - Ubah foto profil',
      ],
      notes: ['Perubahan profil visible ke semua kontak', 'Nama memiliki batasan karakter dari WhatsApp'],
    },
  },
}

/**
 * Scope category help content
 */
export const SCOPE_CATEGORY_HELP: Record<string, FieldHelpContent> = {
  Sessions: {
    title: 'Sessions Permissions',
    description: 'Izin untuk mengelola koneksi WhatsApp.',
    details: {
      whatItDoes:
        'Scope sessions mengontrol akses ke manajemen koneksi WhatsApp. Read untuk monitoring status, Write untuk kontrol penuh (start/stop/delete).',
      tips: [
        'Aplikasi monitoring hanya perlu sessions:read',
        'Auto-reconnect handler perlu sessions:write',
      ],
    },
  },
  Messages: {
    title: 'Messages Permissions',
    description: 'Izin untuk mengirim dan membaca pesan.',
    details: {
      whatItDoes:
        'Scope messages adalah yang paling umum digunakan. Send untuk mengirim pesan, Read untuk membaca history.',
      tips: [
        'Bot notifikasi cukup dengan messages:send',
        'CRM biasanya perlu keduanya',
      ],
    },
  },
  Contacts: {
    title: 'Contacts Permissions',
    description: 'Izin untuk mengelola kontak WhatsApp.',
    details: {
      whatItDoes: 'Scope contacts untuk operasi terkait kontak dan validasi nomor.',
      tips: ['Validasi nomor WhatsApp perlu contacts:read'],
    },
  },
  Groups: {
    title: 'Groups Permissions',
    description: 'Izin untuk mengelola grup WhatsApp.',
    details: {
      whatItDoes:
        'Scope groups untuk operasi grup. Read untuk info grup, Write untuk manajemen anggota dan settings.',
      tips: [
        'Community management perlu groups:write',
        'Analytics cukup dengan groups:read',
      ],
    },
  },
  Media: {
    title: 'Media Permissions',
    description: 'Izin untuk upload dan download media.',
    details: {
      whatItDoes: 'Scope media untuk operasi file. Read untuk download, Write untuk upload.',
      tips: ['Biasanya digunakan bersama messages:send/read'],
    },
  },
  Webhooks: {
    title: 'Webhooks Permissions',
    description: 'Izin untuk mengelola webhook.',
    details: {
      whatItDoes: 'Scope webhooks untuk konfigurasi event listeners.',
      tips: [
        'Jarang diperlukan untuk bot biasa',
        'Berguna untuk sistem multi-tenant',
      ],
    },
  },
  Presence: {
    title: 'Presence Permissions',
    description: 'Izin untuk status online dan typing indicator.',
    details: {
      whatItDoes: 'Scope presence untuk monitoring dan mengatur status kehadiran. Read untuk melihat status kontak, Write untuk set status dan typing.',
      tips: [
        'Typing indicator membuat bot terasa lebih natural',
        'Gunakan dengan wajar, jangan spam',
      ],
    },
  },
  Labels: {
    title: 'Labels Permissions',
    description: 'Izin untuk mengelola label (WhatsApp Business).',
    details: {
      whatItDoes: 'Scope labels untuk kategorisasi chat dengan label. Hanya untuk akun WhatsApp Business.',
      tips: [
        'Berguna untuk sistem CRM dan customer support',
        'Personal WhatsApp tidak mendukung fitur ini',
      ],
    },
  },
  Status: {
    title: 'Status Permissions',
    description: 'Izin untuk posting dan melihat status/story.',
    details: {
      whatItDoes: 'Scope status untuk fitur status/story WhatsApp. Read untuk melihat, Write untuk posting.',
      tips: [
        'Status bagus untuk broadcasting promosi',
        'Otomatis hilang setelah 24 jam',
      ],
    },
  },
  Profile: {
    title: 'Profile Permissions',
    description: 'Izin untuk mengelola profil WhatsApp.',
    details: {
      whatItDoes: 'Scope profile untuk info dan manajemen profil. Read untuk melihat, Write untuk mengubah.',
      tips: [
        'Perubahan profil langsung visible ke semua kontak',
        'Gunakan untuk branding atau personalisasi',
      ],
    },
  },
}
