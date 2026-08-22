/* ==========================================================
   CRAFTOPIA STORE PAGE
   Reads CRAFTOPIA_PRODUCTS (js/products-data.js) and renders:
   - 6 main shopping buttons + "More"
   - 15 product departments (shown under More / full Store view)
   - Audience filter (Men's/Unisex, Women's, Youth, Infant/Toddler)
   - Live text search
   Every product record already carries its department, its
   website-button placements and its audience tags, exactly as
   defined in the Website Store & Product Placement Guide — this
   file only filters/renders, it never duplicates a product.
   ========================================================== */



   
(function () {
  const grid = document.getElementById('storeGrid');
  if (!grid || typeof CRAFTOPIA_PRODUCTS === 'undefined') return;

  const imageMap = {};
document.querySelectorAll('#productImages img[data-name]').forEach(img => {
  imageMap[img.dataset.name] = img.getAttribute('src');
});

  const MAIN_BUTTONS = [
    "Construction / Workwear",
    "Restaurant Uniforms",
    "School / Daycare & Spirit Wear",
    "Team & Club Apparel",
    "Business Uniforms",
    "Clothing Brands"
  ];

  const DEPARTMENTS = [
    "T-Shirts","Tank Tops & Sleeveless","Polos","Woven & Dress Shirts",
    "Hoodies, Sweatshirts & Fleece","Jackets & Outerwear","Vests","Pants",
    "Shorts, Skirts & Skorts","Headwear","Sports Jerseys & Teamwear",
    "Workwear & Safety Accessories","Aprons & Chefwear","Infant & Toddler",
    "Bags & Accessories"
  ];

  const AUDIENCES = ["Men's / Unisex","Women's","Youth","Infant / Toddler"];

  /* department -> icon key + accent, reusing the same hand-drawn icon
     set already defined in script.js so no new imagery is needed */
  const DEPT_ICON = {
    "T-Shirts":"tshirt","Tank Tops & Sleeveless":"tshirt","Polos":"polo",
    "Woven & Dress Shirts":"polo","Hoodies, Sweatshirts & Fleece":"hoodie",
    "Jackets & Outerwear":"vest","Vests":"vest","Pants":"tshirt",
    "Shorts, Skirts & Skorts":"tshirt","Headwear":"cap",
    "Sports Jerseys & Teamwear":"tshirt","Workwear & Safety Accessories":"vest",
    "Aprons & Chefwear":"apron","Infant & Toddler":"tshirt","Bags & Accessories":"tote"
  };

 const state = {
  mode: 'button',
  value: MAIN_BUTTONS[0],
  audience: 'all',
  search: '',
  selectedProduct: ''
};

  /* ---------- main button row ---------- */
  const mainRow = document.getElementById('mainButtonRow');
  function renderMainButtons() {
    const chips = MAIN_BUTTONS.map(b =>
      `<button type="button" class="store-btn" data-btn="${escapeAttr(b)}">${b}</button>`
    ).join('');
    mainRow.innerHTML = chips + `<button type="button" class="store-btn store-btn-more" data-btn="__more__">More <i class="fa-solid fa-caret-down"></i></button>`;
  }
  mainRow.addEventListener('click', e => {
    const btn = e.target.closest('.store-btn');
    if (!btn) return;
    const val = btn.dataset.btn;
    if (val === '__more__') {
      state.mode = 'all';
      state.value = null;
      deptSection.classList.add('open');
    } else {
      state.mode = 'button';
      state.value = val;
      deptSection.classList.remove('open');
    }
    syncActiveStates();
    render();
    document.getElementById('deptSection').scrollIntoView({behavior:'smooth', block:'start'});
  });

  /* ---------- department chip row ---------- */
  const deptSection = document.getElementById('deptSection');
  const deptRow = document.getElementById('deptChipRow');
  function renderDeptChips() {
    const counts = {};
    CRAFTOPIA_PRODUCTS.forEach(p => counts[p.department] = (counts[p.department]||0) + 1);
    deptRow.innerHTML = `<button type="button" class="dept-chip" data-dept="__all__">All Departments <span>${CRAFTOPIA_PRODUCTS.length}</span></button>` +
      DEPARTMENTS.map(d =>
        `<button type="button" class="dept-chip" data-dept="${escapeAttr(d)}">${d} <span>${counts[d]||0}</span></button>`
      ).join('');
  }
  deptRow.addEventListener('click', e => {
    const chip = e.target.closest('.dept-chip');
    if (!chip) return;
    const val = chip.dataset.dept;
    state.mode = val === '__all__' ? 'all' : 'department';
    state.value = val === '__all__' ? null : val;
    syncActiveStates();
    render();
  });

  /* ---------- audience pills ---------- */
  const audienceRow = document.getElementById('audienceRow');
  function renderAudience() {
    audienceRow.innerHTML = `<button type="button" class="aud-pill active" data-aud="all">All Audiences</button>` +
      AUDIENCES.map(a => `<button type="button" class="aud-pill" data-aud="${escapeAttr(a)}">${a}</button>`).join('');
  }
  audienceRow.addEventListener('click', e => {
    const pill = e.target.closest('.aud-pill');
    if (!pill) return;
    state.audience = pill.dataset.aud;
    audienceRow.querySelectorAll('.aud-pill').forEach(p => p.classList.toggle('active', p === pill));
    render();
  });

  /* ---------- search ---------- */
  const searchInput = document.getElementById('storeSearch');
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim().toLowerCase();
      render();
    }, 150);
  });

  /* ---------- sync visual active state across both rows ---------- */
  function syncActiveStates() {
    mainRow.querySelectorAll('.store-btn').forEach(b => {
      const isMore = b.dataset.btn === '__more__';
      const active = (state.mode === 'button' && b.dataset.btn === state.value) || (state.mode === 'all' && isMore);
      b.classList.toggle('active', active);
    });
    deptRow.querySelectorAll('.dept-chip').forEach(c => {
      const active = (state.mode === 'department' && c.dataset.dept === state.value) ||
                     (state.mode === 'all' && c.dataset.dept === '__all__');
      c.classList.toggle('active', active);
    });
  }

  /* ---------- filtering + render ---------- */
  const emptyMsg = document.getElementById('storeEmpty');
  const countLabel = document.getElementById('resultsCount');
  const filterLabel = document.getElementById('activeFilterLabel');

function matches(p) {
  if (state.mode === 'button' && !p.buttons.includes(state.value)) return false;
  if (state.mode === 'department' && p.department !== state.value) return false;
  if (state.mode === 'product' && p.name !== state.value) return false;
  if (state.audience !== 'all' && !p.audience.includes(state.audience)) return false;
  if (state.search && !p.name.toLowerCase().includes(state.search)) return false;
  return true;
}

function render() {

  let results = CRAFTOPIA_PRODUCTS.filter(matches);

  // Search suggestion se exact product select hua ho
  if (state.selectedProduct) {
    const selectedName = state.selectedProduct.trim().toLowerCase();

    results = results.filter(p =>
      String(p.name).trim().toLowerCase() === selectedName
    );
  }

  filterLabel.textContent = state.mode === 'button' ? state.value
    : state.mode === 'department' ? state.value
    : 'All Products';

  countLabel.textContent = `${results.length} product${results.length === 1 ? '' : 's'}`;

  if (!results.length) {
    grid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  function cardHTML(p) {
    const imgSrc = imageMap[p.name];
    const media = imgSrc
      ? `<img src="${imgSrc}" alt="${escapeHtml(p.name)}" loading="lazy" class="store-card-img">`
      : (ICONS[DEPT_ICON[p.department]] || ICONS.tshirt);
    const audienceTags = p.audience.map(a => `<span class="store-tag">${a}</span>`).join('');
    return `
    <div class="store-card">
      <div class="store-card-media">${media}</div>
      <div class="store-card-body">
        <div class="store-card-dept">${p.department}</div>
        <h4>${escapeHtml(p.name)}</h4>
        <div class="store-card-tags">${audienceTags}</div>
        <a href="gangsheet.html" class="store-card-cta">Customize This <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </div>`;
  }

  if (state.mode === 'all') {
    const grouped = {};
    results.forEach(p => {
      if (!grouped[p.department]) grouped[p.department] = [];
      grouped[p.department].push(p);
    });

    grid.innerHTML = DEPARTMENTS
      .filter(dept => grouped[dept] && grouped[dept].length)
      .map(dept => `
        <div class="store-dept-section">
          <div class="store-dept-heading">
            <h3>${dept}</h3>
            <span class="store-dept-count">${grouped[dept].length} items</span>
          </div>
          <div class="store-grid">
            ${grouped[dept].map(cardHTML).join('')}
          </div>
        </div>
      `).join('');
  } else {
    grid.innerHTML = `<div class="store-grid">${results.map(cardHTML).join('')}</div>`;
  }
}

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

 /* ---------- init ---------- */

renderMainButtons();
renderDeptChips();
renderAudience();
const urlParams = new URLSearchParams(window.location.search);

const deptParam = urlParams.get('department');
const productParam = urlParams.get('product');

if (productParam) {

  state.mode = 'product';
  state.value = productParam;

  deptSection.classList.add('open');

} else if (deptParam && DEPARTMENTS.includes(deptParam)) {

  state.mode = 'department';
  state.value = deptParam;

  deptSection.classList.add('open');

}


syncActiveStates();
render();


/* ---------- SCROLL ---------- */

if (deptParam || productParam) {

  setTimeout(() => {

    document.getElementById('deptSection')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }, 200);

}
})();