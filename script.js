/* ──────────────────────────────────────
   PHOENIX RESTAURANT — script.js
────────────────────────────────────── */

const API_URL = "https://phoenixrestoran.onrender.com/";

/* ─── CURSOR LIGHT ─── */
const light = document.querySelector(".cursor-light");
document.addEventListener("mousemove", e => {
  light.style.left = e.clientX + "px";
  light.style.top  = e.clientY + "px";
});

/* ─── NAVBAR SCROLL ─── */
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 60);
  revealSections();
});

/* ─── SECTION REVEAL ─── */
const sections = document.querySelectorAll(".section");
function revealSections() {
  sections.forEach(sec => {
    if (sec.getBoundingClientRect().top < window.innerHeight - 80) {
      sec.classList.add("show");
    }
  });
}
revealSections();

/* ─── MODAL ─── */
const modal = document.getElementById("modal");

function openModal() {
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  clearForm();
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

/* ─── GUEST COUNTER ─── */
let guestCount = 2;
const guestEl = document.getElementById("guestCount");

function changeGuest(delta) {
  guestCount = Math.min(20, Math.max(1, guestCount + delta));
  guestEl.textContent = guestCount;
}

/* ─── REZERVASYON GÖNDER ─── */
async function submitReservation() {
  const btn    = document.getElementById("confirmBtn");
  const loader = document.getElementById("btnLoader");

  const name  = document.getElementById("rName").value.trim();
  const email = document.getElementById("rEmail").value.trim();
  const date  = document.getElementById("rDate").value;
  const time  = document.getElementById("rTime").value;

  if (!name)  { setMsg("Lütfen adınızı girin.", "error"); return; }
  if (!email || !email.includes("@")) { setMsg("Geçerli bir e-posta girin.", "error"); return; }
  if (!date)  { setMsg("Lütfen bir tarih seçin.", "error"); return; }
  if (new Date(date) < new Date(new Date().toDateString())) { setMsg("Geçmiş tarih seçilemez.", "error"); return; }
  if (!time)  { setMsg("Lütfen bir saat seçin.", "error"); return; }

  btn.disabled = true;
  loader.classList.add("active");
  setMsg("", "");

  // Önce o tarihte rezervasyon var mı kontrol et
  try {
    const checkRes  = await fetch(`${API_URL}/api/tarih-kontrol?tarih=${date}`);
    const checkData = await checkRes.json();

    if (checkData.dolu) {
      setMsg("Bu tarih için rezervasyon kapasitesi dolmuştur. Lütfen başka bir tarih seçin.", "error");
      btn.disabled = false;
      loader.classList.remove("active");
      return;
    }
  } catch {
    // Kontrol yapılamazsa devam et
  }

  const payload = {
    ad_soyad   : name,
    email      : email,
    tarih      : date,
    saat       : time,
    kisi_sayisi: guestCount,
    not        : document.getElementById("rNote").value.trim()
  };

  try {
    const res  = await fetch(`${API_URL}/api/rezervasyon`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      closeModal();
      showToast("Rezervasyon alındı!");
    } else {
      setMsg(data.message || "Bir hata oluştu.", "error");
    }
  } catch {
    setMsg("Sunucuya bağlanılamadı.", "error");
  } finally {
    btn.disabled = false;
    loader.classList.remove("active");
  }
}

function setMsg(text, type) {
  const el = document.getElementById("formMsg");
  el.textContent = text;
  el.className = "form-msg " + type;
}

function clearForm() {
  ["rName","rEmail","rDate","rTime","rNote"].forEach(id => {
    document.getElementById(id).value = "";
  });
  guestCount = 2;
  guestEl.textContent = 2;
  setMsg("", "");
}

/* ─── TOAST ─── */
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

/* ─── MENÜ SEKMELERİ ─── */
const menuTabs   = document.querySelectorAll(".menu-tab");
const menuPanels = document.querySelectorAll(".menu-panel");

menuTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    menuTabs.forEach(t => t.classList.remove("active"));
    menuPanels.forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    const panel = document.querySelector(`.menu-panel[data-panel="${tab.dataset.tab}"]`);
    if (panel) panel.classList.add("active");
  });
});

/* ─── ÖZEL GÜN MENÜSİ ─── */
const ozelGunOnerileri = {
  dogumgunu: {
    baslik: "🎂 Doğum Günü Menüsü",
    aciklama: "Özel gününüzü unutulmaz kılacak bir seçki:",
    items: ["Şampanya Karşılama", "Karides Güveç", "Bonfile", "Çikolatalı Fondant", "Kişiye Özel Pasta"]
  },
  evlilik: {
    baslik: "💍 Yıldönümü Menüsü",
    aciklama: "Yıllar içinde büyüyen aşkınızı kutlayın:",
    items: ["Prosecco Karşılama", "Foie Gras", "Levrek", "Crème Brûlée", "Çiçek Süslemesi"]
  },
  romantik: {
    baslik: "🕯️ Romantik Akşam Menüsü",
    aciklama: "Mum ışığında unutulmaz bir akşam için:",
    items: ["Şarap Seçkisi", "Trüflü Mantar Tart", "Kuzu Pirzola", "Çikolatalı Fondant", "Özel Masa Süslemesi"]
  },
  is: {
    baslik: "💼 İş Yemeği Menüsü",
    aciklama: "Profesyonel bir ortamda iş görüşmeleriniz için:",
    items: ["Alkolsüz İçecekler", "Şef Çorbası", "Levrek veya Bonfile", "Tiramisu", "Sessiz Özel Alan"]
  }
};

const ozelBtns = document.querySelectorAll(".ozel-btn");
const oneriDiv = document.getElementById("ozelGunOneri");

ozelBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    ozelBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const gun = btn.dataset.gun;

    if (gun === "normal") {
      oneriDiv.style.display = "none";
      return;
    }

    const oneri = ozelGunOnerileri[gun];
    oneriDiv.innerHTML = `
      <h4>${oneri.baslik}</h4>
      <p>${oneri.aciklama}</p>
      <ul>${oneri.items.map(i => `<li>${i}</li>`).join("")}</ul>
    `;
    oneriDiv.style.display = "block";
  });
});

/* ─── YILDIZ SEÇİMİ ─── */
let secilenPuan = 0;
const starsSelect = document.getElementById("starsSelect");
const starLabel   = document.getElementById("starLabel");
const starLabels  = ["", "Kötü", "İdare Eder", "İyi", "Çok İyi", "Mükemmel"];

starsSelect.querySelectorAll("span").forEach(star => {
  star.addEventListener("mouseenter", () => {
    const val = parseInt(star.dataset.val);
    starsSelect.querySelectorAll("span").forEach((s, i) => {
      s.classList.toggle("hover", i < val);
    });
    starLabel.textContent = starLabels[val];
  });

  star.addEventListener("mouseleave", () => {
    starsSelect.querySelectorAll("span").forEach((s, i) => {
      s.classList.remove("hover");
      s.classList.toggle("active", i < secilenPuan);
    });
    starLabel.textContent = secilenPuan ? starLabels[secilenPuan] : "Seçiniz";
  });

  star.addEventListener("click", () => {
    secilenPuan = parseInt(star.dataset.val);
    starsSelect.querySelectorAll("span").forEach((s, i) => {
      s.classList.toggle("active", i < secilenPuan);
    });
    starLabel.textContent = starLabels[secilenPuan];
  });
});

/* ─── YORUM GÖNDER ─── */
async function submitReview() {
  const ad    = document.getElementById("reviewName").value.trim();
  const yorum = document.getElementById("reviewText").value.trim();
  const msgEl = document.getElementById("reviewMsg");

  if (!ad)          { msgEl.textContent = "Adınızı girin."; msgEl.className = "form-msg error"; return; }
  if (!yorum)       { msgEl.textContent = "Yorumunuzu yazın."; msgEl.className = "form-msg error"; return; }
  if (!secilenPuan) { msgEl.textContent = "Lütfen puan seçin."; msgEl.className = "form-msg error"; return; }

  try {
    const res  = await fetch(`${API_URL}/api/yorum`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ ad_soyad: ad, yorum, puan: secilenPuan })
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("reviewName").value = "";
      document.getElementById("reviewText").value = "";
      secilenPuan = 0;
      starsSelect.querySelectorAll("span").forEach(s => s.classList.remove("active"));
      starLabel.textContent = "Seçiniz";
      msgEl.textContent = "";
      showToast("Yorumunuz eklendi, teşekkürler!");
      loadReviews();
    } else {
      msgEl.textContent = data.message || "Hata oluştu.";
      msgEl.className = "form-msg error";
    }
  } catch {
    msgEl.textContent = "Sunucuya bağlanılamadı.";
    msgEl.className = "form-msg error";
  }
}

/* ─── YORUMLARI YÜKLE ─── */
async function loadReviews() {
  const liste   = document.getElementById("reviewsList");
  const summary = document.getElementById("ratingSummary");

  try {
    const res  = await fetch(`${API_URL}/api/yorumlar`);
    const data = await res.json();

    if (!data.length) {
      liste.innerHTML = `<div class="no-reviews">Henüz yorum yok. İlk yorumu siz yapın!</div>`;
      summary.innerHTML = "";
      return;
    }

    const ort    = (data.reduce((a, b) => a + b.puan, 0) / data.length).toFixed(1);
    const yildiz = "★".repeat(Math.round(ort)) + "☆".repeat(5 - Math.round(ort));

    summary.innerHTML = `
      <div class="rating-big">${ort}</div>
      <div>
        <div class="rating-stars">${yildiz}</div>
        <div class="rating-count">${data.length} değerlendirme</div>
      </div>
    `;

    liste.innerHTML = data.map(r => `
      <div class="review-card-item">
        <div class="stars">${"★".repeat(r.puan)}${"☆".repeat(5 - r.puan)}</div>
        <p>"${r.yorum}"</p>
        <span class="reviewer">— ${r.ad_soyad}</span>
        <div class="review-date">${new Date(r.olusturulma).toLocaleDateString("tr-TR")}</div>
      </div>
    `).join("");

  } catch {
    liste.innerHTML = `<div class="no-reviews">Yorumlar yüklenemedi.</div>`;
  }
}

loadReviews();
