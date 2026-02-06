// app.js - ARDA'NIN GARAJI (Dinamik Ekleme Modlu v2.0)

// 1. Verileri Yükle (Hem Data.js Hem Manuel Eklenenler)
let myOwnedIDs = JSON.parse(localStorage.getItem("myGarageCatalogIDs")) || [];
let myCustomCars = JSON.parse(localStorage.getItem("myCustomGarageCars")) || []; // Elle eklenenler
let fullCatalog = [];
let filteredCatalog = [];
let expandedYear = null;
let currentBrand = null;
let currentView = "all";
let currentMakerFilter = "all";

// DOM Elementleri
const brandListEl = document.getElementById("brand-list");
const carGridEl = document.getElementById("car-grid");
const pageTitleEl = document.getElementById("page-title");
const pageSubtitleEl = document.getElementById("page-subtitle");
const sidebarTitle = document.querySelector(".brand-header h2");

if (sidebarTitle) sidebarTitle.innerText = "ARDA'NIN GARAJI";

function init() {
  // 1. Katalog Verisi (data.js) + Özel Veriyi (Custom) Birleştir
  let staticData = typeof CATALOG_SOURCE !== "undefined" ? CATALOG_SOURCE : [];
  fullCatalog = [...staticData, ...myCustomCars]; // Hepsini tek havuzda topla

  // 2. Arayüzü Çiz
  renderMakerControls();
  applyMakerFilter("all");
}

// --- ÜRETİCİ FİLTRESİ (OTOMATİK ALGILAMA) ---
// --- ÜRETİCİ FİLTRESİ (RENK DESTEKLİ) ---
function renderMakerControls() {
  let controlsDiv = document.querySelector(".maker-controls");
  if (!controlsDiv) {
    controlsDiv = document.createElement("div");
    controlsDiv.className = "maker-controls";
    const header = document.querySelector(".brand-header");
    header.parentNode.insertBefore(controlsDiv, header.nextSibling);
  }

  // Listede hangi markalar varsa onları bul
  const makers = [...new Set(fullCatalog.map((c) => c.maker))].sort();

  // HEPSİ Butonu
  let html = `<div class="maker-btn ${currentMakerFilter === "all" ? "active" : ""}" onclick="applyMakerFilter('all')">HEPSİ</div>`;

  makers.forEach((maker) => {
    // --- RENK AYARLARI ---
    let customStyle = "";

    // Eğer buton aktifse ve markası Greenlight ise
    if (currentMakerFilter === maker && maker === "Greenlight") {
      customStyle = `background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-color: #38ef7d; color: white; box-shadow: 0 0 15px rgba(56,239,125,0.4);`;
    }
    // Eğer buton aktifse ve markası Tarmac ise (Örnek)
    else if (currentMakerFilter === maker && maker === "Tarmac") {
      customStyle = `background: linear-gradient(135deg, #2b5876 0%, #4e4376 100%); border-color: #4e4376; color: white;`;
    }

    // Butonu oluştur
    html += `<div class="maker-btn ${currentMakerFilter === maker ? "active" : ""}" 
                      style="${customStyle}"
                      data-maker="${maker}" 
                      onclick="applyMakerFilter('${maker}')">
                      ${maker.toUpperCase()}
                 </div>`;
  });

  controlsDiv.innerHTML = html;
}

function applyMakerFilter(maker) {
  currentMakerFilter = maker;
  if (maker === "all") {
    filteredCatalog = fullCatalog;
  } else {
    filteredCatalog = fullCatalog.filter((c) => c.maker === maker);
  }
  expandedYear = null;
  currentBrand = null;
  renderMakerControls();
  renderSidebarTree();
  refreshView();
  updateStats();
}

// --- MANUEL EKLEME FONKSİYONLARI ---
function openAddModal() {
  document.getElementById("addModal").style.display = "flex";
}
function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}

function saveNewCar() {
  // 1. Girdileri Al
  const maker = document.getElementById("inp-maker").value.trim();
  const brand = document.getElementById("inp-brand").value.trim();
  const model = document.getElementById("inp-model").value.trim();
  const year = parseInt(document.getElementById("inp-year").value);
  const color = document.getElementById("inp-color").value.trim();
  const series = document.getElementById("inp-series").value.trim();

  if (!maker || !brand || !model) {
    alert("Lütfen en az Üretici, Marka ve Model adını yazın!");
    return;
  }

  // 2. Yeni Araç Objesi Oluştur
  // ID'nin başına 'CUSTOM-' koyuyoruz ki karışmasın
  const newCar = {
    id: `CUSTOM-${Date.now()}`,
    maker: capitalize(maker), // Baş harfi büyüt (greenlight -> Greenlight)
    brand: capitalize(brand),
    model: model,
    year: year || 2026,
    color: color,
    series: series || "Özel Giriş",
  };

  // 3. Listeye Ekle ve Kaydet
  myCustomCars.push(newCar);
  localStorage.setItem("myCustomGarageCars", JSON.stringify(myCustomCars));

  // 4. Otomatik olarak "Sahip Olunanlara" da ekle
  myOwnedIDs.push(newCar.id);
  localStorage.setItem("myGarageCatalogIDs", JSON.stringify(myOwnedIDs));

  // 5. Ekranı Yenile
  closeAddModal();
  // Inputları temizle
  document.getElementById("inp-maker").value = "";
  document.getElementById("inp-brand").value = "";
  document.getElementById("inp-model").value = "";

  alert(`Harika! ${newCar.maker} listesine eklendi.`);
  init(); // Sistemi yeniden başlat ki yeni butonlar gelsin
}

function deleteCustomCar(id) {
  if (!confirm("Bu aracı tamamen silmek istiyor musun?")) return;

  // 1. Listeden Sil
  myCustomCars = myCustomCars.filter((c) => c.id !== id);
  localStorage.setItem("myCustomGarageCars", JSON.stringify(myCustomCars));

  // 2. Sahip olunanlardan da sil
  myOwnedIDs = myOwnedIDs.filter((oid) => oid !== id);
  localStorage.setItem("myGarageCatalogIDs", JSON.stringify(myOwnedIDs));

  init(); // Yenile
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- SOL MENÜ VE LİSTELEME ---
function renderSidebarTree() {
  brandListEl.innerHTML = "";
  if (filteredCatalog.length === 0) {
    brandListEl.innerHTML = `<div style="padding:15px; color:#666;">Araç bulunamadı.</div>`;
    return;
  }
  const years = [...new Set(filteredCatalog.map((c) => c.year))].sort(
    (a, b) => b - a,
  );

  years.forEach((year) => {
    const yearCars = filteredCatalog.filter((c) => c.year === year);
    const groupDiv = document.createElement("div");
    groupDiv.className = `year-group ${expandedYear === year ? "expanded" : ""}`;

    const headerDiv = document.createElement("div");
    headerDiv.className = "year-header";
    headerDiv.innerHTML = `<span>${year}</span> <i data-lucide="chevron-down"></i>`;
    headerDiv.onclick = () => {
      expandedYear = expandedYear === year ? null : year;
      currentBrand = null;
      renderSidebarTree();
      refreshView();
    };

    const subListDiv = document.createElement("div");
    subListDiv.className = "sub-brand-list";

    const brands = [...new Set(yearCars.map((c) => c.brand))].sort();
    brands.forEach((brand) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = `sub-brand-item ${currentBrand === brand && expandedYear === year ? "active" : ""}`;
      itemDiv.innerText = brand;
      itemDiv.onclick = (e) => {
        e.stopPropagation();
        expandedYear = year;
        currentBrand = brand;
        renderSidebarTree();
        refreshView();
      };
      subListDiv.appendChild(itemDiv);
    });

    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(subListDiv);
    brandListEl.appendChild(groupDiv);
  });
  if (window.lucide) lucide.createIcons();
}

function refreshView() {
  // 1. Temel Listeyi Al (Seçili üreticiye göre filtrelenmiş hali)
  // Kopyasını alıyoruz ki orijinal dizi bozulmasın
  let list = [...filteredCatalog];

  // 2. Eğer yıl veya marka seçiliyse listeyi daralt
  if (expandedYear) {
    list = list.filter((c) => c.year === expandedYear);
    if (currentBrand) {
      list = list.filter((c) => c.brand === currentBrand);
    }
  }

  // 3. Görünüm Modunu Uygula (Garajım / Eksikler)
  if (currentView === "owned") {
    list = list.filter((c) => myOwnedIDs.includes(c.id));
  } else if (currentView === "missing") {
    list = list.filter((c) => !myOwnedIDs.includes(c.id));
  }

  // --- KARAR ANI: Karşılama Ekranı mı, Liste mi? ---

  // Eğer Yıl seçili değilse VE Mod "Hepsi" ise -> Karşılama Ekranı göster.
  // (Ama Garajım veya Eksikler seçiliyse burayı atlayıp listeyi gösterecek!)
  if (!expandedYear && currentView === "all") {
    carGridEl.innerHTML = `<div style="padding:40px; text-align:center; color:#555;">
            <p style="font-size:1.5rem;">👋 Arda'nın Koleksiyonuna Hoşgeldin</p>
            <p>Sağ alttaki <b>+</b> butonuna basarak yeni araç ekleyebilirsin!</p>
            <br>
            <p>Yukarıdaki <b>"GARAJIM"</b> butonuna basarak tüm yıllardaki arabalarını tek listede görebilirsin.</p>
        </div>`;
    pageTitleEl.innerText = "Arda'nın Koleksiyonu";
    pageSubtitleEl.innerText = "Genel Bakış";
    return;
  }

  // --- BAŞLIKLARI AYARLA (Dinamik Başlıklar) ---
  if (!expandedYear) {
    // GLOBAL GÖRÜNÜM (Yıl seçili değilken)
    if (currentView === "owned") {
      pageTitleEl.innerText = "Tüm Koleksiyonum"; // Başlık havalı olsun
      pageSubtitleEl.innerText = `Toplam ${list.length} parça araç.`;
    } else if (currentView === "missing") {
      pageTitleEl.innerText = "Arananlar Listesi";
      pageSubtitleEl.innerText = `Toplam ${list.length} eksik parça.`;
    }
  } else {
    // YIL BAZLI GÖRÜNÜM
    if (currentBrand) {
      pageTitleEl.innerText = currentBrand;
    } else {
      pageTitleEl.innerText = `${expandedYear} Yılı`;
    }

    let subText =
      currentMakerFilter === "all" ? "Tüm Markalar" : currentMakerFilter;
    if (currentView === "owned") subText += " (Garajım)";
    if (currentView === "missing") subText += " (Eksikler)";
    pageSubtitleEl.innerText = subText;
  }

  // 4. Listeyi Ekrana Bas
  // (Eğer liste çok uzunsa tarayıcıyı dondurmaması için sıralama yapalım)
  if (!currentBrand) {
    // Markaya göre alfabetik sırala ki güzel görünsün
    list.sort((a, b) => a.brand.localeCompare(b.brand));
  }

  renderCarList(list);
}

function renderCarList(list) {
  carGridEl.innerHTML = "";
  if (list.length === 0) {
    carGridEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#666;">Burada araç yok.</div>`;
    return;
  }

  list.forEach((car) => {
    const isOwned = myOwnedIDs.includes(car.id);
    const isCustom = car.id.toString().startsWith("CUSTOM"); // Bu araç elle mi eklendi?

    const card = document.createElement("div");
    card.className = `car-card ${isOwned ? "owned" : ""}`;

    // Kart İçeriği
    let deleteButtonHtml = isCustom
      ? `<button class="delete-btn" onclick="deleteCustomCar('${car.id}')">SİL</button>`
      : "";

    card.innerHTML = `
            <div class="car-info">
                <div style="font-size:0.6rem; color:#888;">${car.maker.toUpperCase()}</div>
                <div style="font-size:0.75rem; color:var(--accent-red); font-weight:bold;">${car.brand}</div>
                <h3>${car.model}</h3>
                <div style="margin-top:5px; font-size:0.7rem; color:#666;">
                    ${car.series || ""} ${car.color ? "• " + car.color : ""}
                </div>
                ${deleteButtonHtml}
            </div>
            <label class="checkbox-wrapper">
                <input type="checkbox" ${isOwned ? "checked" : ""} onchange="toggleCar('${car.id}')">
                <span class="custom-checkbox">✔</span>
            </label>
        `;
    carGridEl.appendChild(card);
  });
}

function toggleCar(id) {
  if (myOwnedIDs.includes(id)) {
    myOwnedIDs = myOwnedIDs.filter((sid) => sid !== id);
  } else {
    myOwnedIDs.push(id);
  }
  localStorage.setItem("myGarageCatalogIDs", JSON.stringify(myOwnedIDs));
  refreshView();
  updateStats();
}

function updateStats() {
  const total = filteredCatalog.length;
  const owned = filteredCatalog.filter((c) => myOwnedIDs.includes(c.id)).length;
  const percentage = total === 0 ? 0 : Math.round((owned / total) * 100);

  document.getElementById("total-count").textContent = total;
  document.getElementById("owned-count").textContent = owned;
  document.getElementById("completion-rate").textContent = `%${percentage}`;
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
  // Tüm butonların rengini normale döndür
  const buttons = document.querySelectorAll(".view-controls .btn, .filter-btn");
  if (buttons) buttons.forEach((b) => b.classList.remove("active"));

  // Tıklanan butonu parlat
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");
}
// Başlat
init();
// --- EKSİK OLAN BUTON KOMUTLARI ---
