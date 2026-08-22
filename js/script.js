/* ---------- mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navBackdrop = document.getElementById('navBackdrop');

if (navToggle && navLinks && navBackdrop) {
  function closeMobileNav(){
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navBackdrop.classList.remove('open');
    navToggle.setAttribute('aria-expanded','false');
  }
  function openMobileNav(){
    navLinks.classList.add('open');
    navToggle.classList.add('open');
    navBackdrop.classList.add('open');
    navToggle.setAttribute('aria-expanded','true');
  }
  navToggle.addEventListener('click', ()=>{
    navLinks.classList.contains('open') ? closeMobileNav() : openMobileNav();
  });
  navLinks.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeMobileNav));
  navBackdrop.addEventListener('click', closeMobileNav);
  window.addEventListener('resize', ()=>{ if(window.innerWidth>980) closeMobileNav(); });
}


/* ---------- icon library (simple line-art silhouettes, no stock imagery) ---------- */
const ICONS = {
  tshirt:`<svg viewBox="0 0 200 200" fill="none"><path d="M70 30 L85 20 L100 32 L115 20 L130 30 L145 50 L128 62 L128 175 L72 175 L72 62 L55 50 Z" stroke="#14212C" stroke-width="7" stroke-linejoin="round"/></svg>`,
  hoodie:`<svg viewBox="0 0 200 200" fill="none"><path d="M60 40 a40 40 0 0180 0" stroke="#14212C" stroke-width="7"/><path d="M55 45 L145 45 L150 90 L128 90 L128 175 L72 175 L72 90 L50 90 Z" stroke="#14212C" stroke-width="7" stroke-linejoin="round"/></svg>`,
  cap:`<svg viewBox="0 0 200 200" fill="none"><path d="M45 110 a55 45 0 01110 0" stroke="#14212C" stroke-width="7"/><path d="M45 110 h115 M150 110 l35 12" stroke="#14212C" stroke-width="7" stroke-linecap="round"/></svg>`,
  tote:`<svg viewBox="0 0 200 200" fill="none"><path d="M55 70 L145 70 L152 175 L48 175 Z" stroke="#14212C" stroke-width="7" stroke-linejoin="round"/><path d="M75 70 v-15 a25 25 0 0150 0 v15" stroke="#14212C" stroke-width="7"/></svg>`,
  mug:`<svg viewBox="0 0 200 200" fill="none"><path d="M60 60 h70 v100 a35 35 0 01-35 35 a35 35 0 01-35-35 Z" stroke="#14212C" stroke-width="7"/><path d="M130 75 h20 a15 15 0 0115 15 v20 a15 15 0 01-15 15 h-20" stroke="#14212C" stroke-width="7"/></svg>`,
  apron:`<svg viewBox="0 0 200 200" fill="none"><ellipse cx="100" cy="60" rx="55" ry="30" stroke="#14212C" stroke-width="7"/><path d="M45 60 v25 a55 20 0 00110 0 v-25" stroke="#14212C" stroke-width="7"/></svg>`,
  vest:`<svg viewBox="0 0 200 200" fill="none"><path d="M75 30 L100 55 L125 30 L145 55 L128 65 L128 175 L72 175 L72 65 L55 55 Z" stroke="#14212C" stroke-width="7" stroke-linejoin="round"/><path d="M72 90 h56 M72 115 h56" stroke="#14212C" stroke-width="5"/></svg>`,
  polo:`<svg viewBox="0 0 200 200" fill="none"><path d="M78 28 L100 45 L122 28 L138 48 L124 60 L124 175 L76 175 L76 60 L62 48 Z" stroke="#14212C" stroke-width="7" stroke-linejoin="round"/><path d="M92 45 v20 l8 8 8-8 v-20" stroke="#14212C" stroke-width="5"/></svg>`,
};

/* ---------- static content data ---------- */
const catTrack = document.getElementById('catTrack');

/* Homepage-only content (category pills, product tiles, steps, reviews).
  Guarded so script.js doesn't throw on pages like the builder page that
   don't have these sections — previously this crashed here and silently
   skipped every line below it on those pages. */
if (catTrack) {
const categories = [
  ["Construction Workwear","Custom Construction Workwear & Safety Apparel","Hi-vis vests, work tees, insulated jackets & crew uniforms.","vest","pic/categories/construction.jpg"],
  ["Restaurant Uniforms","Custom Restaurant Uniforms & Staff Apparel","Staff tees, embroidered polos, aprons, chef coats & hats.","apron","pic/categories/restaurant.jpg"],
  ["School & Spirit Wear","Custom School Clothing & Spirit Wear","Hoodies, student tees, staff polos, club shirts & merch.","hoodie","pic/categories/school.jpg"],
  ["Team & Club Apparel","Custom Sports Team & Club Clothing","Team shirts, warm-up jackets, coaching polos & totes.","tote","pic/categories/team.jpg"],
  ["Business Uniforms","Custom Business & Corporate Apparel","Embroidered polos, quarter-zips, branded tees & mugs.","polo","pic/categories/business.jpg"],
  ["Clothing Brands","Custom Clothing Brand Production","Oversized tees, premium hoodies, hats & collections.","tshirt","pic/categories/clothing-brands.jpg"],
  ["Healthcare Apparel","Custom Healthcare & Wellness Apparel","Scrub tops, clinic polos, reception uniforms & zip-ups.","cap","pic/categories/healthcare.jpg"],
  ["Automotive Workwear","Custom Automotive & Transportation Workwear","Mechanic shirts, work jackets, hats & shop apparel.","mug","pic/categories/automotive.jpg"],
];
catTrack.innerHTML = categories.map(c=>`<a href="#categories" class="cat-pill">${c[0]}</a>`).join('');

document.getElementById('tileGrid').innerHTML = categories.map(c=>`
  <a href="#builder" class="tile">
    <div class="tile-circle">
      ${ICONS[c[3]]}
      <img class="tile-photo" src="${c[4]}" alt="${c[0]}" loading="lazy" onerror="this.style.display='none'">
    </div>
    <span>${c[0]}</span>
  </a>`).join('');

const dtfProducts = [
  ["Gang Sheet Builder","Design your own sheet with our live builder tool.","From $6.99","pic/products/gang-sheet.jpg","Popular"],
  ["Gang Sheet (Upload)","Already have artwork? Upload your print-ready file.","From $6.99","pic/products/upload-sheet.jpg",""],
  ["Order Transfer By Size","Order a single transfer sized exactly to your design.","From $0.59","pic/products/transfer-size.jpg","", true],
  ["Custom Embroidery Patch","Stitched logo patches for hats, jackets and uniforms.","From $4.99","pic/products/embroidery-patch.jpg",""],
];



document.getElementById('dtfGrid').innerHTML = dtfProducts.map((p,i)=>`
  <div class="prod-card">
    <div class="prod-img">${p[4]?`<span class="prod-badge">${p[4]}</span>`:''}<img class="prod-photo" src="${p[3]}" alt="${p[0]}" loading="lazy" onerror="this.style.display='none'"></div>
    <div class="prod-body">
      <div class="prod-cat">DTF & Embroidery</div>
      <h4>${p[0]}</h4>
      <div class="prod-price"><b>${p[2]}</b>${
        p[5]
          ? `<a href="#" class="cap-size-link">Start Design →</a>`
          : `<a href="#builder">Start Design →</a>`
      }</div>
    </div>
  </div>`).join('');

/* cap size warning popup */
document.getElementById('dtfGrid').addEventListener('click', e=>{
  const link = e.target.closest('.cap-size-link');
  if(!link) return;
  e.preventDefault();
  document.getElementById('capModalBg').classList.add('open');
});

document.getElementById('capModalOk').addEventListener('click', ()=>{
  document.getElementById('capModalBg').classList.remove('open');
  document.getElementById('builder').scrollIntoView({behavior:'smooth'});
});
document.getElementById('capModalClose').addEventListener('click', ()=>{
  document.getElementById('capModalBg').classList.remove('open');
});

const steps = [
  ["Upload","Upload your logo or artwork and tell us about your project.","fa-cloud-arrow-up"],
  ["Choose","Pick T-shirts, hoodies, polos, jackets, hats or workwear.","fa-shirt"],
  ["Proof","Receive a free quote and a digital artwork proof.","fa-file-signature"],
  ["Produce","Once approved, we print or embroider your apparel.","fa-industry"],
  ["Deliver","Pick up your order or arrange local delivery.","fa-truck"],
];
document.getElementById('stepsGrid').innerHTML = steps.map((s,i)=>`
  <div class="step">
    <div class="step-num-badge"><span>0${i+1}</span></div>
    <i class="fa-solid ${s[2]} step-icon"></i>
    <h4>${s[0]}</h4>
    <p>${s[1]}</p>
    <span class="step-arrow"><span class="arrow-line"></span><span class="arrow-head"></span></span>
  </div>`).join('');




const reviews = [
  ["Crystal D.","Our company uniforms came out better than expected. Excellent embroidery and fast turnaround."],
  ["Bre F.","We ordered custom hoodies and shirts for our crew. Quality was outstanding, colours were vibrant."],
  ["Esther S.","Professional, reliable and easy to work with. Highly recommend for custom apparel in Edmonton."],
  ["Brandon C.","Our clothing brand samples looked amazing. The DTF printing quality was excellent."],
];
document.getElementById('revGrid').innerHTML = reviews.map(r=>`
  <div class="rev-card">
    <div class="stars">★★★★★</div>
    <p>"${r[1]}"</p>
    <div class="rev-top" style="margin-top:14px;margin-bottom:0">
      <div class="rev-avatar">${r[0][0]}</div>
      <div class="rev-name">${r[0]}</div>
    </div>
  </div>`).join('');
} // end catTrack-guarded homepage-only block




const userMenu = document.querySelector('.user-menu');
const userToggle = document.querySelector('.user-toggle');       // logged-out icon

function bindUserMenuToggle(el) {
  if (!el || !userMenu) return;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('open');
  });
}

if (userMenu) {
  bindUserMenuToggle(userToggle);
  bindUserMenuToggle(document.getElementById('userMenuToggle'));

  document.addEventListener('click', () => {
    userMenu.classList.remove('open');
  });
}

/* ---------- session-based account menu -----------
   index.html is a static file, so it can't run the old
   `<?php if (isset($_SESSION['user_id'])) ... ?>` check server-side.
  Static pages keep the logged-out account menu available without a server. */
(function () {
  const menu = document.getElementById('userMenu');
  if (!menu) return;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  // Authentication is unavailable without a server-side backend.
})();













/* ================= AUTH MODAL — CLEAN FINAL VERSION ================= */

document.addEventListener('DOMContentLoaded', function () {

    const authModalBg   = document.getElementById('authModalBg');
    const authModalClose = document.getElementById('authModalClose');
    const tabs  = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    function switchTab(tab) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        forms.forEach(f => f.classList.toggle('active', f.id === tab + 'Form'));
    }

    function openAuthModal(tab = 'login') {
        if (!authModalBg) return;
        authModalBg.classList.add('show');
        switchTab(tab);
    }

    function closeAuthModal() {
        if (!authModalBg) return;
        authModalBg.classList.remove('show');
    }

    const openBtn = document.getElementById('openAuthModal');
    if (openBtn) {
        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openAuthModal('login');
        });
    }

    document.querySelectorAll('[data-open-tab]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            openAuthModal(this.dataset.openTab);
        });
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.querySelectorAll('.switch-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });

    if (authModalClose) {
        authModalClose.addEventListener('click', closeAuthModal);
    }

    if (authModalBg) {
        authModalBg.addEventListener('click', function (e) {
            if (e.target === authModalBg) closeAuthModal();
        });
    }

    /* ---------- error helpers ---------- */
    function showAuthError(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    }
    function hideAuthError(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'none';
        el.textContent = '';
    }
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    document.querySelectorAll('.auth-form input').forEach(input => {
        input.addEventListener('input', function () {
            const form = input.closest('form');
            if (!form) return;
            hideAuthError(form.id === 'loginForm' ? 'loginError' : 'signupError');
        });
    });

    /* ---------- LOGIN ---------- */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            hideAuthError('loginError');

            const email = loginForm.querySelector('input[name="email"]').value.trim();
            const password = loginForm.querySelector('input[name="password"]').value;

            if (!email || !isValidEmail(email)) {
                showAuthError('loginError', 'Please enter a valid email address.');
                return;
            }
            if (!password) {
                showAuthError('loginError', 'Please enter your password.');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';

            fetch('data:application/json,%7B%22success%22:false%7D', {
                method: 'POST',
                body: new FormData(loginForm)
            })
            .then(r => r.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                if (data.success) {
                    location.reload();
                } else {
                    showAuthError('loginError', data.message || 'Login failed. Please try again.');
                }
            })
            .catch(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                showAuthError('loginError', 'Something went wrong. Please try again.');
            });
        });
    }

    /* ---------- SIGNUP ---------- */
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            hideAuthError('signupError');

            const name = signupForm.querySelector('input[name="name"]').value.trim();
            const username = signupForm.querySelector('input[name="username"]').value.trim();
            const email = signupForm.querySelector('input[name="email"]').value.trim();
            const password = signupForm.querySelector('#signupPassword').value;
            const confirmPassword = signupForm.querySelector('#signupConfirmPassword').value;
            const termsChecked = signupForm.querySelector('input[type="checkbox"]').checked;

            if (!name) return showAuthError('signupError', 'Please enter your full name.');
            if (!username) return showAuthError('signupError', 'Please choose a username.');
            if (!email || !isValidEmail(email)) return showAuthError('signupError', 'Please enter a valid email address.');
            if (!password || password.length < 6) return showAuthError('signupError', 'Password must be at least 6 characters.');
            if (password !== confirmPassword) return showAuthError('signupError', 'Passwords do not match.');
            if (!termsChecked) return showAuthError('signupError', 'Please agree to the Terms & Conditions.');

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            fetch('data:application/json,%7B%22success%22:false%7D', {
                method: 'POST',
                body: new FormData(signupForm)
            })
            .then(r => r.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
                if (data.success) {
                    location.reload();
                } else {
                    showAuthError('signupError', data.message || 'Signup failed. Please try again.');
                }
            })
            .catch(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
                showAuthError('signupError', 'Something went wrong. Please try again.');
            });
        });
    }

});


(function(){
  const track = document.getElementById('vcarouselTrack');
  if(!track) return;

  const slides = Array.from(track.querySelectorAll('.vcarousel-slide'));
  const videos = slides.map(s => s.querySelector('video'));
  const dotsWrap = document.getElementById('vcDots');
  const prevBtn = document.getElementById('vcPrev');
  const nextBtn = document.getElementById('vcNext');
  let current = 0;
  let autoTimer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function playCurrentVideo(){
    videos.forEach((v, i) => {
      if(!v) return;
      if(i === current){ v.currentTime = 0; v.play().catch(()=>{}); }
      else { v.pause(); }
    });
  }

  function goTo(i){
    current = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    playCurrentVideo();
    resetAutoplay();
  }

  function resetAutoplay(){
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 6000);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  track.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if(diff > 50) goTo(current - 1);
    else if(diff < -50) goTo(current + 1);
  }, {passive:true});

  playCurrentVideo();
  resetAutoplay();
})();



document.getElementById('navSidebarClose')?.addEventListener('click', () => {
  navLinks?.classList.remove('open');
  navBackdrop?.classList.remove('open');
  navToggle?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
});



/* =========================================================
   SIDEBAR SEARCH
   Suggestions + Enter + Search Icon/Box Click
   ========================================================= */

(function () {

  const input = document.getElementById('sidebarSearchInput');
  const resultsBox = document.getElementById('sidebarSearchResults');

  if (!input || !resultsBox) return;

  const storeUrl = 'store.html';
  const gangsheetUrl = 'gangsheet.html';


  /* ---------- FIND PRODUCTS ---------- */

  function getMatches(query) {

    const q = query.trim().toLowerCase();

    if (!q) return [];

    if (
      typeof CRAFTOPIA_PRODUCTS === 'undefined' ||
      !Array.isArray(CRAFTOPIA_PRODUCTS)
    ) {
      return [];
    }

    return CRAFTOPIA_PRODUCTS
      .filter(function (p) {
        return p.name &&
               p.name.toLowerCase().includes(q);
      })
      .slice(0, 6);
  }


  /* ---------- SHOW SUGGESTIONS ---------- */

  function renderResults(query) {

    const q = query.trim().toLowerCase();

    if (!q) {
      resultsBox.classList.remove('open');
      resultsBox.innerHTML = '';
      return;
    }

    const productMatches = getMatches(query);

    let html = `
      <div class="sidebar-search-item pinned"
           data-type="builder">

        <i class="fa-solid fa-pen-ruler"></i>

        <div class="ssi-text">
          <div class="ssi-name">
            Gang Sheet Builder
          </div>

          <div class="ssi-sub">
            Design your own sheet
          </div>
        </div>

      </div>
    `;


    /* ---------- PRODUCTS ---------- */

    if (productMatches.length) {

      html += productMatches.map(function (p) {

        const name = String(p.name)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

        const department = String(p.department || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      
 return `
  <div class="sidebar-search-item"
       data-type="product"
       data-dept="${department}"
       data-product="${name}">

    <div class="ssi-text">

      <div class="ssi-name">
        ${name}
      </div>

      <div class="ssi-sub">
        ${department}
      </div>

    </div>

  </div>
`;


      }).join('');

    } else {

      html += `
        <div class="sidebar-search-empty">
          No matching products — try another search
        </div>
      `;

    }


    resultsBox.innerHTML = html;
    resultsBox.classList.add('open');

  }


  /* =========================================================
     SEARCH FUNCTION
     ========================================================= */

  function doSearch() {

    const query = input.value.trim();

    if (!query) return;

    const matches = getMatches(query);


    /* ---------- NO PRODUCT FOUND ---------- */

    if (!matches.length) {

      /*
       * Agar product nahi mila to suggestions khuli rahengi.
       * User ko pata chalega ke match nahi mila.
       */
      renderResults(query);
      return;

    }


    /* ---------- FIRST MATCH OPEN ---------- */

    const firstProduct = matches[0];

    const department = firstProduct.department;

    if (!department) return;

    window.location.href =
      storeUrl +
      '?department=' +
      encodeURIComponent(department);

  }


  /* =========================================================
     LIVE SUGGESTIONS
     ========================================================= */

  let debounceTimer = null;

  input.addEventListener('input', function () {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(function () {
      renderResults(input.value);
    }, 120);

  });


  /* =========================================================
     ENTER KEY
     ========================================================= */

  input.addEventListener('keydown', function (e) {

    if (e.key === 'Enter') {

      e.preventDefault();

      doSearch();

    }

  });


  /* =========================================================
     SEARCH BOX CLICK
     
     User ne text likha ho aur search box/icon par
     click/focus kare to search chale.
     ========================================================= */

  const searchBox =
    input.closest('.sidebar-search-box');


  if (searchBox) {

    searchBox.addEventListener('click', function (e) {

      /*
       * Input ke andar normal click par
       * typing disturb nahi hogi.
       */

      if (input.value.trim()) {

        /*
         * Sirf icon ya box ke empty area par
         * click hone par search.
         */

        if (
          e.target.tagName !== 'INPUT'
        ) {
          doSearch();
        }

      }

    });

  }


  /* =========================================================
     SUGGESTION CLICK
     ========================================================= */

  resultsBox.addEventListener('click', function (e) {

    const item =
      e.target.closest('.sidebar-search-item');

    if (!item) return;


    /* ---------- GANG SHEET BUILDER ---------- */

    if (item.dataset.type === 'builder') {

      window.location.href = gangsheetUrl;

      return;
    }


    /* ---------- PRODUCT ---------- */

if (item.dataset.type === 'product') {

  const department =
    item.dataset.dept;

  const productName =
    item.dataset.product;

  if (!department || !productName) return;

  window.location.href =
    storeUrl +
    '?department=' +
    encodeURIComponent(department) +
    '&product=' +
    encodeURIComponent(productName);

}

  });


  /* =========================================================
     FOCUS
     ========================================================= */

  input.addEventListener('focus', function () {

    if (input.value.trim()) {
      resultsBox.classList.add('open');
    }

  });


  /* =========================================================
     CLICK OUTSIDE
     ========================================================= */

  document.addEventListener('click', function (e) {

    if (!e.target.closest('.sidebar-search')) {

      resultsBox.classList.remove('open');

    }

  });

})();



/* =========================================================
   DESKTOP SEARCH
   JS SE BUTTON + FULL SCREEN SEARCH
   ========================================================= */

(function () {

  const navIcons = document.querySelector('.nav-icons');
  const userMenu = document.getElementById('userMenu');

  if (!navIcons || !userMenu) return;


  /* =========================================================
     CREATE SEARCH BUTTON
     ========================================================= */

  const searchBtn = document.createElement('button');

  searchBtn.className = 'desktop-search-btn';
  searchBtn.id = 'desktopSearchBtn';
  searchBtn.type = 'button';
  searchBtn.setAttribute('aria-label', 'Search');

  searchBtn.innerHTML = `
    <i class="fa-solid fa-magnifying-glass"></i>
  `;

  userMenu.parentNode.insertBefore(
    searchBtn,
    userMenu
  );


  /* =========================================================
     CREATE SEARCH OVERLAY
     ========================================================= */

  const searchOverlay = document.createElement('div');

  searchOverlay.className =
    'desktop-search-overlay';

  searchOverlay.id =
    'desktopSearchOverlay';

  searchOverlay.innerHTML = `

    <div class="desktop-search-inner">

      <!-- CLOSE BUTTON -->

      <button
        type="button"
        class="desktop-search-close"
        id="desktopSearchClose"
        aria-label="Close Search">

        <i class="fa-solid fa-xmark"></i>

      </button>


      <!-- TITLE -->

      <div class="desktop-search-title">

        <span>SEARCH</span>

        <h2>
          What are you looking for?
        </h2>

      </div>


      <!-- SEARCH BOX -->

      <div class="desktop-search-box">

        <i class="fa-solid fa-magnifying-glass"></i>

        <input
          type="text"
          id="desktopSearchInput"
          placeholder="Search products..."
          autocomplete="off">

      </div>


      <!-- RESULTS -->

      <div
        class="desktop-search-results"
        id="desktopSearchResults">

      </div>

    </div>

  `;

  document.body.appendChild(searchOverlay);


  /* =========================================================
     ELEMENTS
     ========================================================= */

  const overlay =
    document.getElementById(
      'desktopSearchOverlay'
    );

  const closeBtn =
    document.getElementById(
      'desktopSearchClose'
    );

  const input =
    document.getElementById(
      'desktopSearchInput'
    );

  const results =
    document.getElementById(
      'desktopSearchResults'
    );


  /* =========================================================
     OPEN SEARCH
     ========================================================= */

  function openSearch() {

    overlay.classList.add('open');

    document.body.classList.add(
      'search-open'
    );

    setTimeout(function () {

      input.focus();

    }, 150);

  }


  /* =========================================================
     CLOSE SEARCH
     ========================================================= */

  function closeSearch() {

    overlay.classList.remove('open');

    document.body.classList.remove(
      'search-open'
    );

    input.value = '';

    results.innerHTML = '';

  }


  /* =========================================================
     BUTTON EVENTS
     ========================================================= */

  searchBtn.addEventListener(
    'click',
    openSearch
  );

  closeBtn.addEventListener(
    'click',
    closeSearch
  );


  /* =========================================================
     CLICK BACKGROUND TO CLOSE
     ========================================================= */

  overlay.addEventListener(
    'click',
    function (e) {

      if (e.target === overlay) {

        closeSearch();

      }

    }
  );


  /* =========================================================
     ESC TO CLOSE
     ========================================================= */

  document.addEventListener(
    'keydown',
    function (e) {

      if (
        e.key === 'Escape' &&
        overlay.classList.contains('open')
      ) {

        closeSearch();

      }

    }
  );


  /* =========================================================
     FIND PRODUCTS
     ========================================================= */

  function getMatches(query) {

    const q =
      query.trim().toLowerCase();

    if (!q) return [];

    if (
      typeof CRAFTOPIA_PRODUCTS === 'undefined' ||
      !Array.isArray(CRAFTOPIA_PRODUCTS)
    ) {

      return [];

    }

    return CRAFTOPIA_PRODUCTS
      .filter(function (p) {

        const name =
          String(p.name || '')
            .toLowerCase();

        const department =
          String(p.department || '')
            .toLowerCase();

        return (
          name.includes(q) ||
          department.includes(q)
        );

      })
      .slice(0, 8);

  }


  /* =========================================================
     SHOW RESULTS
     ========================================================= */

  function renderResults(query) {

    const q =
      query.trim();


    /* ---------- EMPTY ---------- */

    if (!q) {

      results.innerHTML = `

        <div class="desktop-search-hint">

          <i class="fa-solid fa-magnifying-glass"></i>

          <span>
            Start typing to search products
          </span>

        </div>

      `;

      return;

    }


    /* ---------- FIND MATCHES ---------- */

    const matches =
      getMatches(q);


    /* ---------- NO RESULTS ---------- */

    if (!matches.length) {

      results.innerHTML = `

        <div class="desktop-search-empty">

          <i class="fa-regular fa-face-frown"></i>

          <strong>
            No products found
          </strong>

          <span>
            Try another search term
          </span>

        </div>

      `;

      return;

    }


    /* ---------- RESULTS ---------- */

    results.innerHTML =
      matches.map(function (p) {

        const name =
          String(p.name || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const department =
          String(p.department || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');


        return `

          <div
            class="desktop-search-result"
            data-dept="${department}"
            data-product="${name}">

            <div class="desktop-search-result-text">

              <strong>
                ${name}
              </strong>

              <span>
                ${department}
              </span>

            </div>

            <i class="fa-solid fa-arrow-right"></i>

          </div>

        `;

      }).join('');

  }


  /* =========================================================
     LIVE SEARCH
     ========================================================= */

  let searchTimer = null;

  input.addEventListener(
    'input',
    function () {

      clearTimeout(searchTimer);

      searchTimer =
        setTimeout(
          function () {

            renderResults(
              input.value
            );

          },
          120
        );

    }
  );


  /* =========================================================
     ENTER KEY
     ========================================================= */

  input.addEventListener(
    'keydown',
    function (e) {

      if (e.key !== 'Enter') return;

      e.preventDefault();


      const matches =
        getMatches(
          input.value
        );


      if (!matches.length) return;


      const firstProduct =
        matches[0];


      const department =
        firstProduct.department;


      const productName =
        firstProduct.name;


      if (!department || !productName) return;


      const isPhp = false;


      const storeUrl =
        isPhp
          ? 'store.html'
          : 'store.html';


      window.location.href =
        storeUrl +
        '?department=' +
        encodeURIComponent(department) +
        '&product=' +
        encodeURIComponent(productName);

    }
  );


  /* =========================================================
     CLICK PRODUCT SUGGESTION
     ========================================================= */

  results.addEventListener(
    'click',
    function (e) {

      const item =
        e.target.closest(
          '.desktop-search-result'
        );


      if (!item) return;


      const department =
        item.dataset.dept;


      const productName =
        item.dataset.product;


      if (!department || !productName) return;


      const isPhp = false;


      const storeUrl =
        isPhp
          ? 'store.html'
          : 'store.html';


      window.location.href =
        storeUrl +
        '?department=' +
        encodeURIComponent(department) +
        '&product=' +
        encodeURIComponent(productName);

    }
  );


  /* =========================================================
     INITIAL
     ========================================================= */

  renderResults('');

})();



/* ---------- tab switching (login <-> signup) ---------- */
const tabs  = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

function switchTab(tab){
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  forms.forEach(f => f.classList.toggle('active', f.id === tab + 'Form'));
  history.replaceState(null, '', '?tab=' + tab);
}

tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelectorAll('.switch-link').forEach(link=>{
  link.addEventListener('click', e=>{ e.preventDefault(); switchTab(link.dataset.tab); });
});

/* open on the tab requested via ?tab=signup link from the header dropdown */
const params = new URLSearchParams(location.search);
if (params.get('tab') === 'signup') switchTab('signup');

/* ---------- password show/hide ---------- */
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.toggle-password');
  if (!btn) return;
  const input = document.getElementById(btn.getAttribute('data-target'));
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye');
  }
});

/* ---------- error helpers ---------- */
function showAuthError(id, msg){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function hideAuthError(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  el.textContent = '';
}
function isValidEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

document.querySelectorAll('.auth-form input').forEach(input=>{
  input.addEventListener('input', function(){
    const form = input.closest('form');
    if (!form) return;
    hideAuthError(form.id === 'loginForm' ? 'loginError' : 'signupError');
  });
});

/* ---------- LOGIN submit ---------- */
const loginForm = document.getElementById('loginForm');
if (loginForm){
  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    hideAuthError('loginError');

    const email = loginForm.querySelector('input[name="email"]').value.trim();
    const password = loginForm.querySelector('input[name="password"]').value;

    if (!email || !isValidEmail(email)) return showAuthError('loginError', 'Please enter a valid email address.');
    if (!password) return showAuthError('loginError', 'Please enter your password.');

    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Signing In...';

    fetch('data:application/json,%7B%22success%22:false%7D', { method:'POST', body:new FormData(loginForm) })
      .then(r=>r.json())
      .then(data=>{
        btn.disabled = false; btn.textContent = 'Sign In';
        if (data.success) window.location.href = 'index.html';
        else showAuthError('loginError', data.message || 'Login failed. Please try again.');
      })
      .catch(()=>{
        btn.disabled = false; btn.textContent = 'Sign In';
        showAuthError('loginError', 'Something went wrong. Please try again.');
      });
  });
}

/* ---------- SIGNUP submit ---------- */
const signupForm = document.getElementById('signupForm');
if (signupForm){
  signupForm.addEventListener('submit', function(e){
    e.preventDefault();
    hideAuthError('signupError');

    const name = signupForm.querySelector('input[name="name"]').value.trim();
    const username = signupForm.querySelector('input[name="username"]').value.trim();
    const email = signupForm.querySelector('input[name="email"]').value.trim();
    const password = signupForm.querySelector('#signupPassword').value;
    const confirmPassword = signupForm.querySelector('#signupConfirmPassword').value;
    const termsChecked = signupForm.querySelector('input[type="checkbox"]').checked;

    if (!name) return showAuthError('signupError', 'Please enter your full name.');
    if (!username) return showAuthError('signupError', 'Please choose a username.');
    if (!email || !isValidEmail(email)) return showAuthError('signupError', 'Please enter a valid email address.');
    if (!password || password.length < 6) return showAuthError('signupError', 'Password must be at least 6 characters.');
    if (password !== confirmPassword) return showAuthError('signupError', 'Passwords do not match.');
    if (!termsChecked) return showAuthError('signupError', 'Please agree to the Terms & Conditions.');

    const btn = signupForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Creating Account...';

    fetch('data:application/json,%7B%22success%22:false%7D', { method:'POST', body:new FormData(signupForm) })
      .then(r=>r.json())
      .then(data=>{
        btn.disabled = false; btn.textContent = 'Create Account';
        if (data.success) window.location.href = 'index.html';
        else showAuthError('signupError', data.message || 'Signup failed. Please try again.');
      })
      .catch(()=>{
        btn.disabled = false; btn.textContent = 'Create Account';
        showAuthError('signupError', 'Something went wrong. Please try again.');
      });
  });
}

















