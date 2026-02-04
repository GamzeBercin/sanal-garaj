// app.js - ARDA'NIN GARAJI (Final Tam Sürüm)

// 1. Verileri ve Ayarları Yükle
let myOwnedIDs = JSON.parse(localStorage.getItem("myGarageCatalogIDs")) || [];
let fullCatalog = [];
let filteredCatalog = []; // Filtrelenmiş aktif liste
let expandedYear = null;
let currentBrand = null;
let currentView = "all";
let currentMakerFilter = "all"; // Varsayılan: Hepsi

// DOM Elementleri
const brandListEl = document.getElementById("brand-list");
const carGridEl = document.getElementById("car-grid");
const pageTitleEl = document.getElementById("page-title");
const pageSubtitleEl = document.getElementById("page-subtitle");
const sidebarTitle = document.querySelector(".brand-header h2");

// --- KİŞİSELLEŞTİRME 1: SOL MENÜ BAŞLIĞI ---
if (sidebarTitle) sidebarTitle.innerText = "ARDA'NIN GARAJI";

function init() {
  // Veri kontrolü
  if (typeof CATALOG_SOURCE === "undefined" || CATALOG_SOURCE.length === 0) {
    console.warn("Veri bulunamadı. Lütfen data.js dosyasını kontrol et.");
  } else {
    fullCatalog = CATALOG_SOURCE;
  }

  // Üretici Filtre Butonlarını (Hot Wheels / Matchbox) Oluştur
  renderMakerControls();

  // İlk başta filtreleme yap (Hepsi)
  applyMakerFilter("all");
}

// --- ÜRETİCİ FİLTRESİ (SİHİRLİ KISIM) ---
function renderMakerControls() {
  // HTML'de yer yoksa sidebar'ın tepesine ekle
  let controlsDiv = document.querySelector(".maker-controls");
  if (!controlsDiv) {
    controlsDiv = document.createElement("div");
    controlsDiv.className = "maker-controls";
    const header = document.querySelector(".brand-header");
    header.parentNode.insertBefore(controlsDiv, header.nextSibling);
  }

  // Mevcut üreticileri bul
  const makers = [...new Set(fullCatalog.map((c) => c.maker))].sort();

  // Butonları oluştur
  let html = `<div class="maker-btn ${currentMakerFilter === "all" ? "active" : ""}" onclick="applyMakerFilter('all')">HEPSİ</div>`;

  makers.forEach((maker) => {
    html += `<div class="maker-btn ${currentMakerFilter === maker ? "active" : ""}" 
                      data-maker="${maker}" 
                      onclick="applyMakerFilter('${maker}')">
                      ${maker.toUpperCase()}
                 </div>`;
  });

  controlsDiv.innerHTML = html;
}

function applyMakerFilter(maker) {
  currentMakerFilter = maker;

  // Veriyi süzüyoruz
  if (maker === "all") {
    filteredCatalog = fullCatalog;
  } else {
    filteredCatalog = fullCatalog.filter((c) => c.maker === maker);
  }

  // Seçim sıfırla
  expandedYear = null;
  currentBrand = null;

  // Arayüzü yenile
  renderMakerControls(); // Buton renklerini güncelle
  renderSidebarTree(); // Sol menüyü yeni verilere göre çiz
  refreshView(); // Sağ ekranı temizle
  updateStats(); // İstatistikleri güncelle
}

// --- SOL MENÜ (AĞAÇ YAPISI) ---
function renderSidebarTree() {
  brandListEl.innerHTML = "";

  if (filteredCatalog.length === 0) {
    brandListEl.innerHTML = `<div style="padding:15px; color:#666; font-size:0.8rem;">Bu markada araç bulunamadı.</div>`;
    return;
  }

  // Sadece filtrelenmiş katalogdaki yılları al
  const years = [...new Set(filteredCatalog.map((c) => c.year))].sort(
    (a, b) => b - a,
  );

  years.forEach((year) => {
    const yearCars = filteredCatalog.filter((c) => c.year === year);
    const totalInYear = yearCars.length;
    const ownedInYear = yearCars.filter((c) =>
      myOwnedIDs.includes(c.id),
    ).length;

    const groupDiv = document.createElement("div");
    groupDiv.className = `year-group ${expandedYear === year ? "expanded" : ""}`;

    const headerDiv = document.createElement("div");
    headerDiv.className = "year-header";
    headerDiv.onclick = () => toggleYear(year);

    const isComplete = totalInYear > 0 && totalInYear === ownedInYear;
    const iconColor = isComplete ? "#4CAF50" : "var(--text-muted)";

    headerDiv.innerHTML = `
            <span>${year}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:0.75rem; opacity:0.6;">${ownedInYear}/${totalInYear}</span>
                <i data-lucide="chevron-down" style="color:${iconColor}"></i>
            </div>
        `;

    const subListDiv = document.createElement("div");
    subListDiv.className = "sub-brand-list";

    const brandsInYear = [...new Set(yearCars.map((c) => c.brand))].sort();

    brandsInYear.forEach((brand) => {
      const brandCars = yearCars.filter((c) => c.brand === brand);
      const bTotal = brandCars.length;
      const bOwned = brandCars.filter((c) => myOwnedIDs.includes(c.id)).length;

      const itemDiv = document.createElement("div");
      itemDiv.className = `sub-brand-item ${currentBrand === brand && expandedYear === year ? "active" : ""}`;
      itemDiv.onclick = (e) => {
        e.stopPropagation();
        selectBrand(year, brand);
      };

      const badge =
        bOwned === bTotal && bTotal > 0
          ? `<span style="color:#4CAF50;">★</span>`
          : `${bOwned}/${bTotal}`;

      itemDiv.innerHTML = `<span>${brand}</span> <span style="font-size:0.7rem; opacity:0.5;">${badge}</span>`;
      subListDiv.appendChild(itemDiv);
    });

    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(subListDiv);
    brandListEl.appendChild(groupDiv);
  });

  if (window.lucide) lucide.createIcons();
}

// --- GÖRÜNÜM VE OLAYLAR ---
function toggleYear(year) {
  if (expandedYear === year) {
    expandedYear = null;
    currentBrand = null;
  } else {
    expandedYear = year;
    currentBrand = null;
  }
  renderSidebarTree();
  refreshView();
}

function selectBrand(year, brand) {
  expandedYear = year;
  currentBrand = brand;
  renderSidebarTree();
  refreshView();
}

function refreshView() {
  // --- KİŞİSELLEŞTİRME 2: KARŞILAMA EKRANI ---
  if (!expandedYear) {
    carGridEl.innerHTML = `<div style="padding:40px; text-align:center; color:#555;">
            <p style="font-size:1.5rem; margin-bottom:10px;">👋 Arda'nın Koleksiyonuna Hoşgeldin</p>
            <p>Yukarıdan bir <b>Marka</b> seç veya soldan bir <b>Yıl</b> açarak garajını gez.</p>
        </div>`;
    pageTitleEl.innerText = "Arda'nın Koleksiyonu";
    pageSubtitleEl.innerText = "Genel Bakış";
    return;
  }

  let list = [];
  let title = "";
  let subtitle = "";

  // Filtrelenmiş katalog üzerinden işlem yap
  if (currentBrand) {
    list = filteredCatalog.filter(
      (c) => c.year === expandedYear && c.brand === currentBrand,
    );
    title = currentBrand;
    subtitle = `${expandedYear} | ${currentMakerFilter === "all" ? "Tüm Markalar" : currentMakerFilter}`;
  } else {
    list = filteredCatalog.filter((c) => c.year === expandedYear);
    title = `${expandedYear} Özeti`;
    subtitle = "Seçili yılın tüm araçları listeleniyor.";
  }

  if (currentView === "owned") {
    list = list.filter((c) => myOwnedIDs.includes(c.id));
    subtitle += " (Garajım)";
  } else if (currentView === "missing") {
    list = list.filter((c) => !myOwnedIDs.includes(c.id));
    subtitle += " (Eksikler)";
  }

  // --- KİŞİSELLEŞTİRME 3: SAYFA BAŞLIĞI ---
  if (currentMakerFilter === "all" && !currentBrand) {
    // Özel bir başlık yoksa genel başlığı kullan
    // Ancak yukarıda "title" değişkeni zaten ayarlandığı için buraya dokunmuyoruz.
  }

  pageTitleEl.innerText = title;
  pageSubtitleEl.innerText = subtitle;
  renderCarList(list);
}

function renderCarList(list) {
  carGridEl.innerHTML = "";

  if (list.length === 0) {
    let msg = "Araç bulunamadı.";
    if (currentView === "owned") msg = "Henüz eklenmiş araç yok.";
    if (currentView === "missing") msg = "Tebrikler! Hepsini topladın.";
    carGridEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#666; margin-top:40px;">${msg}</div>`;
    return;
  }

  if (!currentBrand) list.sort((a, b) => a.brand.localeCompare(b.brand));

  list.forEach((car) => {
    const isOwned = myOwnedIDs.includes(car.id);
    const card = document.createElement("div");
    card.className = `car-card ${isOwned ? "owned" : ""}`;

    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    // Marka etiketi
    const makerTag = `<div style="font-size:0.6rem; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">${car.maker}</div>`;
    const brandTag = !currentBrand
      ? `<div style="font-size:0.75rem; color:var(--accent-red); font-weight:bold; margin-bottom:4px;">${car.brand}</div>`
      : "";

    card.innerHTML = `
            <div class="car-info">
                ${makerTag}
                ${brandTag}
                <h3>${car.model}</h3>
                <div style="margin-top:8px; font-size:0.75rem; color:#888;">
                    ${car.series ? `<span>${car.series}</span>` : ""}
                    ${car.color ? `<span style="display:block; margin-top:2px; opacity:0.7;">🎨 ${car.color}</span>` : ""}
                </div>
            </div>
            <label class="checkbox-wrapper">
                <input type="checkbox" ${isOwned ? "checked" : ""} onchange="toggleCar('${car.id}')">
                <span class="custom-checkbox">${checkIcon}</span>
            </label>
        `;
    carGridEl.appendChild(card);
  });
}

// --- İŞLEMLER ---
function toggleCar(id) {
  if (myOwnedIDs.includes(id)) {
    myOwnedIDs = myOwnedIDs.filter((savedId) => savedId !== id);
  } else {
    myOwnedIDs.push(id);
  }
  localStorage.setItem("myGarageCatalogIDs", JSON.stringify(myOwnedIDs));

  refreshView();
  renderSidebarTree();
  updateStats();
}

function showAllModels() {
  currentView = "all";
  setActiveButton("btn-all");
  refreshView();
}
function showMyCollection() {
  currentView = "owned";
  setActiveButton("btn-owned");
  refreshView();
}
function showMissing() {
  currentView = "missing";
  setActiveButton("btn-missing");
  refreshView();
}

function setActiveButton(btnId) {
  document
    .querySelectorAll(".view-controls .btn")
    .forEach((b) => b.classList.remove("active"));
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");
}

function updateStats() {
  const total = filteredCatalog.length;
  const owned = filteredCatalog.filter((c) => myOwnedIDs.includes(c.id)).length;
  const percentage = total === 0 ? 0 : Math.round((owned / total) * 100);

  document.getElementById("total-count").textContent = total;
  document.getElementById("owned-count").textContent = owned;
  document.getElementById("completion-rate").textContent = `%${percentage}`;
}

init();
