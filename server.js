/**
 * PHOENIX RESTAURANT — server.js
 * Node.js + Express + PostgreSQL (Render Free DB)
 */

require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Render, DATABASE_URL'yi otomatik inject eder
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function connectDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rezervasyonlar (
      id          SERIAL PRIMARY KEY,
      ad_soyad    VARCHAR(120)  NOT NULL,
      email       VARCHAR(180)  NOT NULL,
      tarih       DATE          NOT NULL,
      saat        TIME          NOT NULL,
      kisi_sayisi SMALLINT      NOT NULL DEFAULT 2,
      not_field   TEXT,
      olusturulma TIMESTAMP     DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS yorumlar (
      id          SERIAL PRIMARY KEY,
      ad_soyad    VARCHAR(120) NOT NULL,
      yorum       TEXT         NOT NULL,
      puan        SMALLINT     NOT NULL,
      olusturulma TIMESTAMP    DEFAULT NOW()
    )
  `);

  console.log("✅ PostgreSQL bağlandı, tablolar hazır.");
}

/* ─── TARİH KONTROL ─── */
const GUNLUK_LIMIT = 10;

app.get("/api/tarih-kontrol", async (req, res) => {
  const { tarih } = req.query;
  if (!tarih) return res.status(400).json({ message: "Tarih gerekli." });

  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS adet FROM rezervasyonlar WHERE tarih = $1",
      [tarih]
    );
    const adet = parseInt(result.rows[0].adet);
    return res.json({ dolu: adet >= GUNLUK_LIMIT, adet, limit: GUNLUK_LIMIT });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

/* ─── REZERVASYON KAYDET ─── */
app.post("/api/rezervasyon", async (req, res) => {
  const { ad_soyad, email, tarih, saat, kisi_sayisi, not } = req.body;

  if (!ad_soyad || !email || !tarih || !saat) {
    return res.status(400).json({ message: "Lütfen tüm zorunlu alanları doldurun." });
  }

  if (new Date(tarih) < new Date(new Date().toDateString())) {
    return res.status(400).json({ message: "Geçmiş tarih seçilemez." });
  }

  try {
    const check = await pool.query(
      "SELECT COUNT(*) AS adet FROM rezervasyonlar WHERE tarih = $1",
      [tarih]
    );
    if (parseInt(check.rows[0].adet) >= GUNLUK_LIMIT) {
      return res.status(400).json({ message: "Bu tarih için rezervasyon kapasitesi dolmuştur." });
    }
  } catch (err) {
    console.error("Tarih kontrol hatası:", err);
  }

  try {
    const result = await pool.query(
      `INSERT INTO rezervasyonlar (ad_soyad, email, tarih, saat, kisi_sayisi, not_field)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [ad_soyad, email, tarih, saat, kisi_sayisi || 2, not || null]
    );

    console.log(`📅 Rezervasyon → ${ad_soyad} | ${tarih} ${saat} | ${kisi_sayisi} kişi`);
    return res.status(201).json({ message: "Rezervasyon başarıyla alındı!", rezervasyon_id: result.rows[0].id });
  } catch (err) {
    console.error("DB hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

/* ─── YORUM KAYDET ─── */
app.post("/api/yorum", async (req, res) => {
  const { ad_soyad, yorum, puan } = req.body;

  if (!ad_soyad || !yorum || !puan) {
    return res.status(400).json({ message: "Tüm alanları doldurun." });
  }

  if (puan < 1 || puan > 5) {
    return res.status(400).json({ message: "Puan 1 ile 5 arasında olmalı." });
  }

  try {
    await pool.query(
      "INSERT INTO yorumlar (ad_soyad, yorum, puan) VALUES ($1, $2, $3)",
      [ad_soyad, yorum, puan]
    );
    console.log(`💬 Yorum → ${ad_soyad} | ${puan} yıldız`);
    return res.status(201).json({ message: "Yorumunuz eklendi, teşekkürler!" });
  } catch (err) {
    console.error("DB hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

/* ─── YORUMLARI GETİR ─── */
app.get("/api/yorumlar", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM yorumlar ORDER BY olusturulma DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

/* ─── REZERVASYONLARI GETİR ─── */
app.get("/api/rezervasyonlar", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rezervasyonlar ORDER BY tarih ASC, saat ASC");
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

/* ─── SUNUCUYU BAŞLAT ─── */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Phoenix sunucusu çalışıyor → http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Veritabanına bağlanılamadı:", err.message);
  process.exit(1);
});