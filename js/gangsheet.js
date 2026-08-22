/* ================= GANG SHEET BUILDER (PRO) ================= */
  if (document.getElementById("builder")) {

const SHEET_WIDTH_IN = 24;
const PX_PER_IN = 18;
let zoom = 1;
let sheetLengthIn = 24;
const MIN_LENGTH_IN = 24;
const PRICE_PER_FOOT = 12;
const GUTTER_IN = 0.06;
const SNAP_IN = 0.15;      // snap distance for alignment guides
const MIN_PRINT_DPI = 150; // below this = low-res warning

let images = [];
let selectedId = null;
let idSeq = 1;
let guideX = null, guideY = null; // active snap-guide lines while dragging

const sheetEl = document.getElementById('sheet');
const rulerTop = document.getElementById('rulerTop');
const layerList = document.getElementById('layerList');
const layerCount = document.getElementById('layerCount');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');

function pxPerIn(){ return PX_PER_IN * zoom; }

/* ======================================================
   PERFORMANCE: coalesce rapid renderSheet() calls into a
   single call per animation frame. On mobile, touch-drag
   fires pointermove far more often than a real repaint can
   keep up with — without this, every single event forces a
   full DOM rebuild + mini-preview redraw, which is what was
   causing the hangs/jank on phones.
   ====================================================== */
let _renderQueued = false;
function scheduleRender(){
  if(_renderQueued) return;
  _renderQueued = true;
  requestAnimationFrame(()=>{
    _renderQueued = false;
    renderSheet();
  });
}

/* ======================================================
   PERFORMANCE: mini preview is not critical to update on
   every single frame — throttle it independently so it
   never blocks smooth dragging/button response.
   ====================================================== */
let _miniPreviewTimer = null;
function scheduleMiniPreview(){
  if(_miniPreviewTimer) return;
  _miniPreviewTimer = setTimeout(()=>{
    _miniPreviewTimer = null;
    renderMiniPreview();
  }, 120);
}

/* ======================================================
   COLLISION HELPERS
   ====================================================== */
function rectsOverlap(a, b, gutter = GUTTER_IN){
  return !(
    a.x + a.w + gutter <= b.x ||
    b.x + b.w + gutter <= a.x ||
    a.y + a.h + gutter <= b.y ||
    b.y + b.h + gutter <= a.y
  );
}
function collidesWithAny(candidate, excludeId){
  return images.some(img => img.id !== excludeId && rectsOverlap(candidate, img));
}
function findFreeSpot(w, h){
  const step = 0.25;
  for(let y = 0; y < 5000; y += step){
    for(let x = 0; x <= SHEET_WIDTH_IN - w + 0.001; x += step){
      const candidate = { x: Math.round(x*100)/100, y: Math.round(y*100)/100, w, h };
      if(!collidesWithAny(candidate, null)) return candidate;
    }
  }
  return { x:0, y:0, w, h };
}

/* ======================================================
   SNAP-TO-GUIDES — aligns edges/centers with other
   designs and with sheet edges/center while dragging
   ====================================================== */
function computeSnap(candidate, excludeId){
  let snappedX = candidate.x, snappedY = candidate.y;
  let gX = null, gY = null;

  const targetsX = [0, SHEET_WIDTH_IN / 2, SHEET_WIDTH_IN];
  const targetsY = [];
  images.forEach(img=>{
    if(img.id === excludeId) return;
    targetsX.push(img.x, img.x + img.w, img.x + img.w/2);
    targetsY.push(img.y, img.y + img.h, img.y + img.h/2);
  });

  const left = candidate.x, right = candidate.x + candidate.w, cx = candidate.x + candidate.w/2;
  for(const t of targetsX){
    if(Math.abs(left - t) < SNAP_IN){ snappedX = t; gX = t; break; }
    if(Math.abs(right - t) < SNAP_IN){ snappedX = t - candidate.w; gX = t; break; }
    if(Math.abs(cx - t) < SNAP_IN){ snappedX = t - candidate.w/2; gX = t; break; }
  }
  const top = candidate.y, bottom = candidate.y + candidate.h, cy = candidate.y + candidate.h/2;
  for(const t of targetsY){
    if(Math.abs(top - t) < SNAP_IN){ snappedY = t; gY = t; break; }
    if(Math.abs(bottom - t) < SNAP_IN){ snappedY = t - candidate.h; gY = t; break; }
    if(Math.abs(cy - t) < SNAP_IN){ snappedY = t - candidate.h/2; gY = t; break; }
  }
  snappedX = Math.max(0, Math.min(snappedX, SHEET_WIDTH_IN - candidate.w));
  snappedY = Math.max(0, snappedY);
  return { x: snappedX, y: snappedY, gX, gY };
}

/* ======================================================
   UNDO / REDO
   PERFORMANCE: history snapshots used to JSON.stringify the
   ENTIRE image object including the full base64 pixel data
   (img/url/originalUrl) for every design, on every single
   action (button click, drag start, slider move...). That
   is extremely heavy on mobile. Now we only snapshot the
   lightweight fields (position, size, rotation, qty, etc.)
   and keep a live reference to the actual heavy image data,
   merging it back in on restore.
   ====================================================== */
let undoStack = [];
let redoStack = [];

function lightSnapshot(){
  return images.map(img => {
    const { img: pixelData, url, originalUrl, _cachedImg, ...rest } = img;
    return rest;
  });
}

function pushHistory(){
  undoStack.push({
    snapshot: lightSnapshot(),
    selectedId,
    fullImages: images // reference only — heavy fields pulled back in on restore
  });
  if(undoStack.length > 20) undoStack.shift();
  redoStack = [];
}

function restore(entry){
  const byId = {};
  entry.fullImages.forEach(i => { byId[i.id] = i; });
  images = entry.snapshot.map(light => {
    const heavy = byId[light.id] || {};
    return {
      ...light,
      img: heavy.img,
      url: heavy.url,
      originalUrl: heavy.originalUrl,
      _cachedImg: heavy._cachedImg
    };
  });
  selectedId = entry.selectedId;
  recomputeLength();
  renderSheet();
  scheduleMiniPreview();
}

function undo(){
  if(!undoStack.length) return;
  redoStack.push({ snapshot: lightSnapshot(), selectedId, fullImages: images });
  restore(undoStack.pop());
}
function redo(){
  if(!redoStack.length) return;
  undoStack.push({ snapshot: lightSnapshot(), selectedId, fullImages: images });
  restore(redoStack.pop());
}

/* ======================================================
   LOW-RESOLUTION PRINT CHECK
   ====================================================== */
function checkLowRes(img){
  const rotated = (img.quarterTurns || 0) % 2 === 1;
  const effNatW = rotated ? img.natH : img.natW;
  const effNatH = rotated ? img.natW : img.natH;
  const dpiW = effNatW / img.w;
  const dpiH = effNatH / img.h;
  img.effDpi = Math.round(Math.min(dpiW, dpiH));
  img.lowRes = img.effDpi < MIN_PRINT_DPI;
}

function updateRuler(){
  rulerTop.innerHTML='';
  rulerTop.style.width = (SHEET_WIDTH_IN*pxPerIn())+'px';
  for(let i=0;i<=SHEET_WIDTH_IN;i+=4){
    const t=document.createElement('div');
    t.className='ruler-tick';
    t.style.left=(i*pxPerIn())+'px';
    t.textContent=i+'"';
    rulerTop.appendChild(t);
  }
}

function renderSheet(){
  sheetEl.style.width = (SHEET_WIDTH_IN*pxPerIn())+'px';
  sheetEl.style.height = (sheetLengthIn*pxPerIn())+'px';
  sheetEl.innerHTML='';

  images.forEach(img=>{
    checkLowRes(img); // recompute DPI status every render

    const el=document.createElement('div');
    el.className='sheet-item'+(img.id===selectedId?' selected':'');
    el.style.position='absolute';
    el.style.left=(img.x*pxPerIn())+'px';
    el.style.top=(img.y*pxPerIn())+'px';
    el.style.width=(img.w*pxPerIn())+'px';
    el.style.height=(img.h*pxPerIn())+'px';
    el.style.overflow='visible';
    el.dataset.id=img.id;

    // rotation/flip rendered on an inner element so the outer
    // container (used for position + collision) always stays axis-aligned
    const turns = img.quarterTurns || 0;
    const rotated = turns % 2 === 1;
    const innerWpx = (rotated ? img.h : img.w) * pxPerIn();
    const innerHpx = (rotated ? img.w : img.h) * pxPerIn();

    el.innerHTML = `
      <img src="${img.img || img.url}" draggable="false" style="
        position:absolute; top:50%; left:50%;
        width:${innerWpx}px; height:${innerHpx}px;
        transform:translate(-50%,-50%) rotate(${turns*90}deg) scaleX(${img.flipH?-1:1}) scaleY(${img.flipV?-1:1});
        pointer-events:none;">
      <div class="del-handle" data-del="${img.id}">×</div>
      <div class="resize-handle" data-resize="${img.id}"></div>
      <div class="dpi-badge" title="${img.effDpi} DPI" style="
        position:absolute; bottom:-9px; left:2px; padding:1px 6px;
        background:${img.lowRes ? '#f59e0b' : '#22c55e'}; color:#000; border-radius:8px;
        font-size:10px; font-weight:700; white-space:nowrap; box-shadow:0 0 0 2px #111;">
        ${img.effDpi} DPI
      </div>
    `;
    sheetEl.appendChild(el);
  });

  // draw active alignment guide lines
  if(guideX !== null){
    const g = document.createElement('div');
    g.style.cssText = `position:absolute; left:${guideX*pxPerIn()}px; top:0; width:1px; height:100%; background:#FF3D9E; z-index:50; pointer-events:none;`;
    sheetEl.appendChild(g);
  }
  if(guideY !== null){
    const g = document.createElement('div');
    g.style.cssText = `position:absolute; top:${guideY*pxPerIn()}px; left:0; height:1px; width:100%; background:#FF3D9E; z-index:50; pointer-events:none;`;
    sheetEl.appendChild(g);
  }

  updateRuler();
  updateSummary();
  renderLayerList();
  renderSelPanel();
  scheduleMiniPreview(); // throttled — never blocks the interaction itself
}

/* ======================================================
   LIVE PREVIEW — small canvas thumbnail of the whole
   sheet. PERFORMANCE: reuses already-loaded Image objects
   (_cachedImg) instead of creating and reloading a brand
   new Image() every single render — this was the single
   biggest cause of mobile lag.
   ====================================================== */
function renderMiniPreview(){
  const canvas = document.getElementById('miniPreview');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  if(!images.length){
    canvas.height = 60;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const pad = 0.6;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  images.forEach(img=>{
    minX = Math.min(minX, img.x);
    minY = Math.min(minY, img.y);
    maxX = Math.max(maxX, img.x + img.w);
    maxY = Math.max(maxY, img.y + img.h);
  });
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(SHEET_WIDTH_IN, maxX + pad);
  maxY = maxY + pad;

  const boxW = maxX - minX;
  const boxH = maxY - minY;
  const scale = canvas.width / boxW;
  canvas.height = Math.max(60, boxH * scale);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  images.forEach(img=>{
    const im = img._cachedImg;
    if(!im || !im.complete) return; // reuse already-loaded image, never reload

    const turns = img.quarterTurns || 0;
    const rotated = turns % 2 === 1;
    const drawW = (rotated ? img.h : img.w) * scale;
    const drawH = (rotated ? img.w : img.h) * scale;
    const cx = (img.x + img.w/2 - minX) * scale;
    const cy = (img.y + img.h/2 - minY) * scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(turns * 90 * Math.PI / 180);
    ctx.scale(img.flipH ? -1 : 1, img.flipV ? -1 : 1);
    ctx.drawImage(im, -drawW/2, -drawH/2, drawW, drawH);
    ctx.restore();
  });
}

function recomputeLength(){
  let maxBottom = 0;
  images.forEach(img=>{ maxBottom = Math.max(maxBottom, img.y+img.h); });
  sheetLengthIn = Math.max(MIN_LENGTH_IN, Math.ceil(maxBottom+1));
}

function updateSummary(){

    document.getElementById("sumLength").textContent = sheetLengthIn + " in";
    document.getElementById("sumCount").textContent = images.length;

    const feet = sheetLengthIn / 12;
    const basePrice = Math.max(PRICE_PER_FOOT, feet * PRICE_PER_FOOT);

    // Total Quantity
    const totalQty = images.reduce((sum, img) => sum + (img.qty || 1), 0);

    // Final Price
    const finalPrice = basePrice * totalQty;

    document.getElementById("sumPrice").textContent = "$" + finalPrice.toFixed(2);

}

function renderLayerList(){
  layerCount.textContent = images.length ? `(${images.length})` : '';
  if(!images.length){ layerList.innerHTML='<div class="empty-hint">No images yet — upload to get started.</div>'; return; }
  layerList.innerHTML = images.map(img=>`
    <div class="layer-item ${img.id===selectedId?'active':''}" data-id="${img.id}">
      <img src="${img.img || img.url}">
      <span class="li-name">${img.name}${img.bgRemoved?' · BG off':''} · <span style="color:${img.lowRes?'#f59e0b':'#22c55e'}">${img.effDpi} DPI${img.lowRes?' (low)':''}</span></span>
      <span class="li-del" data-del="${img.id}">×</span>
    </div>`).join('');
}

function renderSelPanel(){
  const sel = images.find(i=>i.id===selectedId);
  document.getElementById('noSelection').style.display = sel?'none':'block';
  document.getElementById('selPanel').style.display = sel?'block':'none';
    // tolerance slider only shows once bg-removal is on
  const tolRow = document.getElementById('bgToleranceRow');
  if(tolRow) tolRow.style.display = 'flex';

  if(!sel) return;
  document.getElementById('selW').value = sel.w.toFixed(1);
  document.getElementById('selH').value = sel.h.toFixed(1);
  document.getElementById('bgToggle').classList.toggle('on', sel.bgRemoved);


  // quality line ALWAYS shows (green when good, orange + fix button when low)
  const warn = document.getElementById('lowResWarning');
  if(warn){
    warn.style.display = 'block';
    if(sel.lowRes){
      warn.style.cssText = 'display:block;margin-top:10px;padding:8px;background:#3a1f1f;border:1px solid #a33;border-radius:6px;color:#f87171;font-size:12px';
      warn.innerHTML = `⚠ ~${sel.effDpi} DPI — recommended 150+ DPI for a sharp print.
        <button id="fixResBtn" class="btn btn-outline btn-sm" style="margin-top:6px;width:100%;background:#222;color:#fff;border-color:#333">Shrink to print-safe size</button>`;
      document.getElementById('fixResBtn').onclick = () => autoFixLowRes(sel);
    } else {
      warn.style.cssText = 'display:block;margin-top:10px;padding:8px;background:#152a1c;border:1px solid #2a5;border-radius:6px;color:#4ade80;font-size:12px';
      warn.innerHTML = `✓ ${sel.effDpi} DPI — high quality, print-ready.`;
    }
  }

  // quantity stepper — shows how many copies of this exact design
  // currently exist on the sheet, +/- adds or removes copies as a group
  const qtyInput = document.getElementById('qtyInput');
  if(qtyInput) qtyInput.value = sel.qty || 1;
}

// shrinks the selected design (keeping aspect ratio) down to the
// largest size that still hits MIN_PRINT_DPI, without causing overlap
function autoFixLowRes(img){
  const turns = img.quarterTurns || 0;
  const rotated = turns % 2 === 1;
  const effNatW = rotated ? img.natH : img.natW;
  const effNatH = rotated ? img.natW : img.natH;
  const maxW = effNatW / MIN_PRINT_DPI;
  const maxH = effNatH / MIN_PRINT_DPI;
  const aspect = img.w / img.h;

  let newW = Math.min(img.w, maxW);
  let newH = newW / aspect;
  if(newH > maxH){ newH = maxH; newW = newH * aspect; }

  const candidate = { x: img.x, y: img.y, w: newW, h: newH };
  if(collidesWithAny(candidate, img.id)) return; // no safe fit here, leave as-is

  pushHistory();
  img.w = newW; img.h = newH;
  recomputeLength(); renderSheet();
}

dropZone.addEventListener('click', ()=>fileInput.click());
fileInput.addEventListener('change', e=>handleFiles(e.target.files));
['dragover','dragenter'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.style.borderColor='#FF3D9E';}));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.style.borderColor='';}));
dropZone.addEventListener('drop', e=>{ e.preventDefault(); handleFiles(e.dataTransfer.files); });

function handleFiles(fileList){
  pushHistory(); // one undo-step for the whole upload batch
  [...fileList].forEach(file=>{
    if(!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = ()=>{
      const aspect = im.width/im.height;
      let w = 6, h = 6/aspect;
      if(h>SHEET_WIDTH_IN){ h=SHEET_WIDTH_IN; w=h*aspect; }
      const id = idSeq++;
      const spot = findFreeSpot(w, h);
      images.push({
        id, url, originalUrl:url, img:url,
        name:file.name.replace(/\.[^.]+$/,''),
        w, h, x:spot.x, y:spot.y,
        natW: im.width, natH: im.height, // for DPI calc
        bgRemoved:false,
        quarterTurns:0, flipH:false, flipV:false, // rotation state
        groupId: id, // "quantity" groups every copy of the same design under one id
        qty: 1,
        _cachedImg: im // reuse this already-loaded image everywhere else
      });
      selectedId = id;
      recomputeLength();
      renderSheet();
    };
    im.src = url;
  });
}

let dragState = null;
sheetEl.addEventListener('pointerdown', e=>{
  const resizeId = e.target.dataset.resize;
  const delId = e.target.dataset.del;
  if(delId){ pushHistory(); deleteImage(Number(delId)); return; }
  const itemEl = e.target.closest('.sheet-item');
  if(!itemEl) return;
  const id = Number(itemEl.dataset.id);
  selectedId = id;
  const img = images.find(i=>i.id===id);
  pushHistory(); // one undo-step captured before the drag/resize starts
  if(resizeId){
    dragState = {mode:'resize', id, startX:e.clientX, startY:e.clientY, startW:img.w, startH:img.h, aspect: img.w/img.h};
  } else {
    dragState = {mode:'move', id, startX:e.clientX, startY:e.clientY, startImgX:img.x, startImgY:img.y};
  }
  sheetEl.setPointerCapture(e.pointerId);
  renderSheet();
});
sheetEl.addEventListener('pointermove', e=>{
  if(!dragState) return;
  const img = images.find(i=>i.id===dragState.id);
  const dxIn = (e.clientX-dragState.startX)/pxPerIn();
  const dyIn = (e.clientY-dragState.startY)/pxPerIn();

  guideX = null; guideY = null; // reset guides each frame

  if(dragState.mode==='move'){
    const rawX = Math.min(Math.max(0, dragState.startImgX+dxIn), SHEET_WIDTH_IN-img.w);
    const rawY = Math.max(0, dragState.startImgY+dyIn);
    const rawCandidate = { x: rawX, y: rawY, w: img.w, h: img.h };

    // try the snapped position first; fall back to raw if snap collides
    const snap = computeSnap(rawCandidate, img.id);
    const snappedCandidate = { x: snap.x, y: snap.y, w: img.w, h: img.h };

    if(!collidesWithAny(snappedCandidate, img.id)){
      img.x = snap.x; img.y = snap.y;
      guideX = snap.gX; guideY = snap.gY;
    } else if(!collidesWithAny(rawCandidate, img.id)){
      img.x = rawX; img.y = rawY;
    }
    // else: neither position is valid, leave img where it last was
  } else {
    let newW = Math.max(0.5, dragState.startW+dxIn);
    let newH = Math.max(0.5, dragState.startH + dyIn);
    newW = Math.min(newW, SHEET_WIDTH_IN-img.x);
    const candidate = { x: img.x, y: img.y, w: newW, h: newH };
    if(!collidesWithAny(candidate, img.id)){
      img.w = newW; img.h = newH;
    }
  }
  recomputeLength();
  scheduleRender(); // PERFORMANCE: coalesced to once per frame during drag
});
['pointerup','pointercancel'].forEach(ev=>sheetEl.addEventListener(ev,()=>{
  dragState=null;
  guideX = null; guideY = null; // clear guides when drag ends
  renderSheet();
}));

function deleteImage(id){
  images = images.filter(i=>i.id!==id);
  if(selectedId===id) selectedId=null;
  recomputeLength();
  renderSheet();
}

layerList.addEventListener('click', e=>{
  const del = e.target.dataset.del;
  if(del){ pushHistory(); deleteImage(Number(del)); return; }
  const item = e.target.closest('.layer-item');
  if(item){ selectedId = Number(item.dataset.id); renderSheet(); }
});

/* only push one undo-step per "editing session" of the number input,
   not on every keystroke */
let sizeEditPending = true;
document.getElementById('selW').addEventListener('focus', ()=> sizeEditPending = true);
document.getElementById('selH').addEventListener('focus', ()=> sizeEditPending = true);

document.getElementById('selW').addEventListener('input', e=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  if(sizeEditPending){ pushHistory(); sizeEditPending = false; }
  const aspect = img.w/img.h;
  const oldW = img.w, oldH = img.h;

  let newW = Math.max(0.5, parseFloat(e.target.value)||img.w);
let newH = img.h;
  newW = Math.min(newW, SHEET_WIDTH_IN-img.x);

  const candidate = { x: img.x, y: img.y, w: newW, h: newH };
  if(!collidesWithAny(candidate, img.id)){
    img.w = newW; img.h = newH;
  } else {
    e.target.value = oldW.toFixed(1);
    img.w = oldW; img.h = oldH;
  }
  recomputeLength(); renderSheet();
});
document.getElementById('selH').addEventListener('input', e=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  if(sizeEditPending){ pushHistory(); sizeEditPending = false; }
  const aspect = img.w/img.h;
  const oldW = img.w, oldH = img.h;

  let newH = Math.max(0.5, parseFloat(e.target.value)||img.h);
let newW = img.w;
  newW = Math.min(newW, SHEET_WIDTH_IN-img.x);

  const candidate = { x: img.x, y: img.y, w: newW, h: newH };
  if(!collidesWithAny(candidate, img.id)){
    img.w = newW; img.h = newH;
  } else {
    e.target.value = oldH.toFixed(1);
    img.w = oldW; img.h = oldH;
  }
  recomputeLength(); renderSheet();
});

document.getElementById('dupBtn').addEventListener('click', ()=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  pushHistory();
  const id = idSeq++;
  let candidate = { x: Math.min(img.x+0.5, SHEET_WIDTH_IN-img.w), y: img.y+0.5, w: img.w, h: img.h };
  if(collidesWithAny(candidate, null)) candidate = findFreeSpot(img.w, img.h);
  images.push({...img, id, x: candidate.x, y: candidate.y, groupId: img.groupId});
  selectedId = id;
  recomputeLength(); renderSheet();
});

/* ======================================================
   QUANTITY PER DESIGN
   "Quantity" = how many copies of this exact design currently
   sit on the sheet (tracked via groupId). +/- adds or removes
   copies automatically instead of duplicating one by one.
   ====================================================== */
function getGroupCount(groupId){
  return images.filter(i => i.groupId === groupId).length;
}

function changeQty(delta){

    const sel = images.find(i => i.id === selectedId);
    if(!sel) return;

    pushHistory();

    if(!sel.qty) sel.qty = 1;

    sel.qty = Math.max(1, sel.qty + delta);

    document.getElementById("qtyInput").value = sel.qty;

    renderSheet();
}

document.getElementById("qtyMinus").addEventListener("click", () => {
    changeQty(-1);
});

document.getElementById("qtyPlus").addEventListener("click", () => {
    changeQty(1);
});

document.getElementById("qtyInput").addEventListener("change", e => {

    const sel = images.find(i => i.id === selectedId);
    if(!sel) return;

    pushHistory();

    sel.qty = Math.max(1, parseInt(e.target.value) || 1);

    e.target.value = sel.qty;

    renderSheet();
});

document.getElementById("delBtn").addEventListener("click", () => {

    if(!selectedId) return;

    pushHistory();

    deleteImage(selectedId);

});

/* ======================================================
   ROTATE + FLIP
   ====================================================== */
function rotateSelected(dir){
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  pushHistory();
  const oldW = img.w, oldH = img.h, oldTurns = img.quarterTurns;
  img.quarterTurns = ((img.quarterTurns||0) + dir + 4) % 4;
  img.w = oldH; img.h = oldW; // 90° turn swaps the bounding box

  const candidate = { x: img.x, y: img.y, w: img.w, h: img.h };
  if(collidesWithAny(candidate, img.id)){
    // undo if rotating would overlap another design
    img.w = oldW; img.h = oldH; img.quarterTurns = oldTurns;
    undoStack.pop(); // remove the history entry we just pushed for nothing
    return;
  }
  recomputeLength(); renderSheet();
}
document.getElementById('rotateLeftBtn')?.addEventListener('click', ()=>rotateSelected(-1));
document.getElementById('rotateRightBtn')?.addEventListener('click', ()=>rotateSelected(1));
document.getElementById('flipHBtn')?.addEventListener('click', ()=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  pushHistory();
  img.flipH = !img.flipH;
  renderSheet();
});
document.getElementById('flipVBtn')?.addEventListener('click', ()=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  pushHistory();
  img.flipV = !img.flipV;
  renderSheet();
});

/* ======================================================
   TRIM — crops away empty/transparent space around a
   design (important after background removal) and shrinks
   its on-sheet box to match, so no wasted print area is billed.
   ====================================================== */
function trimSelected(imgObj, onDone){
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => {
    const w = im.width, h = im.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(im, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for(let y = 0; y < h; y++){
      for(let x = 0; x < w; x++){
        const alpha = data[(y*w + x)*4 + 3];
        if(alpha > 8){ // treat near-fully-transparent as empty
          if(x < minX) minX = x;
          if(x > maxX) maxX = x;
          if(y < minY) minY = y;
          if(y > maxY) maxY = y;
        }
      }
    }
if(maxX < 0){ onDone && onDone(); return; } // fully transparent image, nothing to trim
    const trimW = maxX - minX + 1, trimH = maxY - minY + 1;
    if(trimW === w && trimH === h){ onDone && onDone(); return; } // already tight, no empty border

    // safety check — if trim removed a huge chunk (>45% on either axis),
    // background removal likely ate into the actual design (common with dark
    // hair/edges on a dark background). Don't silently apply — warn instead.
    if(trimW < w * 0.55 || trimH < h * 0.55){
    const proceed = confirm(
    "Background removal removed a large portion of this design " +
    "some artwork detail (like dark hair or edges) may have been lost. " +
    "Please check the preview carefully. Continue anyway?"
);
      if(!proceed){ onDone && onDone(); return; }
    }

    const c2 = document.createElement('canvas');
    c2.width = trimW; c2.height = trimH;
    c2.getContext('2d').drawImage(c, minX, minY, trimW, trimH, 0, 0, trimW, trimH);

    pushHistory();
    // shrink the on-sheet box by the same proportion that was trimmed off
    // the image file, so empty space doesn't take up billable sheet area
    imgObj.w = imgObj.w * (trimW / w);
    imgObj.h = imgObj.h * (trimH / h);
    imgObj.img = c2.toDataURL('image/png');
    imgObj.natW = trimW; imgObj.natH = trimH; // DPI is recalculated from the new pixel size

    // keep the cached preview image in sync with the newly trimmed artwork
    const newIm = new Image();
    newIm.onload = () => { imgObj._cachedImg = newIm; scheduleMiniPreview(); };
    newIm.src = imgObj.img;

    recomputeLength(); renderSheet();
    onDone && onDone();
  };
  im.src = imgObj.img || imgObj.url;
}
document.getElementById("trimBtn")?.addEventListener("click", () => {
    const img = images.find(i => i.id === selectedId);
    if (!img) {
        alert("Please select an image first.");
        return;
    }

    function packTight(){
        document.getElementById('autoArrangeBtn').click();
    }

    if(!img.bgRemoved){
      const tol = parseInt(document.getElementById('bgTolerance')?.value || '40', 10);
      pushHistory();
        img.bgRemoved = true;
        document.getElementById('bgToggle').classList.add('on');
        removeBackgroundAdvanced(img, tol, () => trimSelected(img, packTight));
    } else {
        trimSelected(img, packTight);
    }
});
/* ======================================================
   BETTER BACKGROUND REMOVER (v2)
   Samples a fixed background reference color from the
   corners/edges once, then only removes border-connected
   pixels that are close to THAT reference color — avoids
   chain-leaking into the actual artwork.
   ====================================================== */
function removeBackgroundAdvanced(imgObj, tolerance, onDone){
  const statusEl = document.getElementById('bgStatus');
  if(statusEl) statusEl.textContent = 'Removing background…';

  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => {
    const w = im.width, h = im.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(im, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Sample background color from corners + edge midpoints (robust average)
    const samplePts = [
      0, (w-1)*4, (h-1)*w*4, ((h-1)*w+w-1)*4,
      Math.floor(w/2)*4, ((h-1)*w+Math.floor(w/2))*4,
      Math.floor(h/2)*w*4, (Math.floor(h/2)*w+w-1)*4
    ];
    let rSum=0,gSum=0,bSum=0;
    samplePts.forEach(p=>{ rSum+=data[p]; gSum+=data[p+1]; bSum+=data[p+2]; });
    const bgR = rSum/samplePts.length, bgG = gSum/samplePts.length, bgB = bSum/samplePts.length;

  const visited = new Uint8Array(w * h);
const thresh = tolerance * 1.3; // slider 0-100 -> distance threshold (lowered so dark
                                 // anti-aliased design edges near a dark background
                                 // don't get eaten by the flood fill)

    const queue = [];
    for(let x = 0; x < w; x++){ queue.push(x); queue.push((h-1)*w + x); }
    for(let y = 0; y < h; y++){ queue.push(y*w); queue.push(y*w + w - 1); }

    let qi = 0;
    while(qi < queue.length){
      const idx = queue[qi++];
      if(visited[idx]) continue;
      visited[idx] = 1;
      const p = idx*4;
      const r = data[p], g = data[p+1], b = data[p+2];

      // Compare to the FIXED reference color, not to the neighbor pixel —
      // this is what stops leaking through gradients into the design
      const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
      if(dist > thresh) continue; // too different from bg: keep pixel, stop spreading here

      data[p+3] = 0; // remove this pixel

      const x = idx % w, y = (idx - x) / w;
      if(x > 0 && !visited[idx-1]) queue.push(idx-1);
      if(x < w-1 && !visited[idx+1]) queue.push(idx+1);
      if(y > 0 && !visited[idx-w]) queue.push(idx-w);
      if(y < h-1 && !visited[idx+w]) queue.push(idx+w);
    }
     // halo cleanup — kills the thin blended fringe of pixels that sit
    // right on the boundary between background and design.
    for(let pass = 0; pass < 2; pass++){
      eatEdgeHalo(imageData, w, h, bgR, bgG, bgB, thresh * 1.6);
    }

    // cleanup pass — remove small isolated speckle/noise islands
    removeSmallIslands(imageData, w, h, 25);

    ctx.putImageData(imageData, 0, 0);
    imgObj.img = c.toDataURL('image/png');

    // PERFORMANCE FIX: refresh the cached preview image so the mini
    // preview / thumbnails reuse this instead of reloading from scratch.
    const newIm = new Image();
    newIm.onload = () => {
      imgObj._cachedImg = newIm;
      if(statusEl) statusEl.textContent = '';
      renderSheet();
      onDone && onDone();
    };
    newIm.src = imgObj.img;
  };
  im.src = imgObj.originalUrl;
}


function eatEdgeHalo(imageData, w, h, bgR, bgG, bgB, haloThresh){
  const data = imageData.data;
  const toClear = [];

  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const idx = y*w + x;
      const p = idx*4;
      if(data[p+3] <= 8) continue;

      let touchesTransparent = false;
      if(x > 0 && data[(idx-1)*4+3] <= 8) touchesTransparent = true;
      else if(x < w-1 && data[(idx+1)*4+3] <= 8) touchesTransparent = true;
      else if(y > 0 && data[(idx-w)*4+3] <= 8) touchesTransparent = true;
      else if(y < h-1 && data[(idx+w)*4+3] <= 8) touchesTransparent = true;
      if(!touchesTransparent) continue;

      const r = data[p], g = data[p+1], b = data[p+2];
      const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
      if(dist <= haloThresh) toClear.push(p+3);
    }
  }
  toClear.forEach(alphaIdx => { data[alphaIdx] = 0; });
}

// removes small isolated groups of opaque pixels (specks/noise left
// after background removal) — anything smaller than minSize pixels gets
// made transparent, since real design details are always bigger than that.
function removeSmallIslands(imageData, w, h, minSize){
  const data = imageData.data;
  const labeled = new Uint8Array(w * h);

  for(let start = 0; start < w * h; start++){
    if(labeled[start]) continue;
    if(data[start*4 + 3] <= 8) { labeled[start] = 1; continue; } // already transparent

    // BFS to find this connected opaque region
    const stack = [start];
    const island = [start];
    labeled[start] = 1;

    while(stack.length){
      const idx = stack.pop();
      const x = idx % w, y = (idx - x) / w;
      const neighbors = [];
      if(x > 0) neighbors.push(idx - 1);
      if(x < w-1) neighbors.push(idx + 1);
      if(y > 0) neighbors.push(idx - w);
      if(y < h-1) neighbors.push(idx + w);

      for(const n of neighbors){
        if(labeled[n]) continue;
        labeled[n] = 1;
        if(data[n*4 + 3] > 8){
          stack.push(n);
          island.push(n);
        }
      }
    }

    // too small = noise/speck -> erase it
    if(island.length < minSize){
      island.forEach(idx => { data[idx*4 + 3] = 0; });
    }
  }
}

document.getElementById('bgToggle').addEventListener('click', e=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  pushHistory();
  const turningOn = !e.target.classList.contains('on');
  e.target.classList.toggle('on');
  img.bgRemoved = turningOn;
  const tol = parseInt(document.getElementById('bgTolerance')?.value || '30', 10);
  if(turningOn) removeBackgroundAdvanced(img, tol);
  else {
    img.img = img.originalUrl;
    // restore cached preview to the original loaded image too
    img._cachedImg = img._cachedImg; // originalUrl already matches the initial cached image in most cases
    renderSheet();
  }
});

// quick "Reset Background" button — instantly restores the original
// image without needing to toggle off/on or hunt through undo history
document.getElementById('resetBgBtn')?.addEventListener('click', ()=>{
  const img = images.find(i=>i.id===selectedId); if(!img) return;
  pushHistory();
  img.img = img.originalUrl;
  img.bgRemoved = false;
  document.getElementById('bgToggle').classList.remove('on');
  renderSheet();
});

// live tolerance slider — re-runs removal with new sensitivity.
// PERFORMANCE: debounce raised to 600ms so dragging the slider on
// mobile doesn't trigger the (heavy) background-removal algorithm
// dozens of times per second — only once you pause briefly.
let tolTimer = null;
document.getElementById('bgTolerance')?.addEventListener('input', e=>{
  const valEl = document.getElementById('bgToleranceVal');
  if(valEl) valEl.textContent = e.target.value + '%'; // live % readout (updates instantly, no lag)

  const img = images.find(i=>i.id===selectedId);
if(!img){
  alert("Please select an image first.");
  return;
}

  clearTimeout(tolTimer);
  tolTimer = setTimeout(()=>{
    if(!img.bgRemoved){
      pushHistory();
      img.bgRemoved = true;
      document.getElementById('bgToggle').classList.add('on');
    }
    removeBackgroundAdvanced(img, parseInt(e.target.value,10));
  }, 600);
});

document.getElementById('autoArrangeBtn').addEventListener('click', ()=>{
  if(!images.length) return;
  pushHistory();
  const gap = 0.05;
  let x=gap, y=gap, shelfH=0;
  images.forEach(img=>{
    if(x+img.w > SHEET_WIDTH_IN-gap){ x=gap; y+=shelfH+gap; shelfH=0; }
    img.x=x; img.y=y;
    x += img.w+gap;
    shelfH = Math.max(shelfH, img.h);
  });
  recomputeLength();
  renderSheet();
});

document.getElementById('zoomIn').addEventListener('click', ()=>{ zoom=Math.min(2, zoom+0.15); document.getElementById('zoomLabel').textContent=Math.round(zoom*100)+'%'; renderSheet(); });
document.getElementById('zoomOut').addEventListener('click', ()=>{ zoom=Math.max(0.4, zoom-0.15); document.getElementById('zoomLabel').textContent=Math.round(zoom*100)+'%'; renderSheet(); });

/* ======================================================
   UNDO/REDO BUTTONS + KEYBOARD SHORTCUTS
   ====================================================== */
document.getElementById('undoBtn')?.addEventListener('click', undo);
document.getElementById('redoBtn')?.addEventListener('click', redo);

document.addEventListener('keydown', (e)=>{
  const tag = (e.target.tagName || '').toLowerCase();
  if(tag === 'input' || tag === 'textarea') return; // don't hijack normal typing

  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
  if((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))){ e.preventDefault(); redo(); return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){ e.preventDefault(); document.getElementById('dupBtn').click(); return; }

  if(!selectedId) return;
  const img = images.find(i=>i.id===selectedId); if(!img) return;

  if(e.key === 'Delete' || e.key === 'Backspace'){
    e.preventDefault(); pushHistory(); deleteImage(selectedId); return;
  }

  const nudge = e.shiftKey ? 1 : 0.1;
  let dx = 0, dy = 0;
  if(e.key === 'ArrowLeft') dx = -nudge;
  else if(e.key === 'ArrowRight') dx = nudge;
  else if(e.key === 'ArrowUp') dy = -nudge;
  else if(e.key === 'ArrowDown') dy = nudge;
  else return;

  e.preventDefault();
  const candidate = {
    x: Math.min(Math.max(0, img.x+dx), SHEET_WIDTH_IN-img.w),
    y: Math.max(0, img.y+dy), w: img.w, h: img.h
  };
  if(!collidesWithAny(candidate, img.id)){
    pushHistory();
    img.x = candidate.x; img.y = candidate.y;
    recomputeLength(); renderSheet();
  }
});
const reviewModal = document.getElementById("reviewModal");
const modalBg = document.getElementById("modalBg");

const agreeCheck = document.getElementById("agreeCheck");
const continueOrder = document.getElementById("continueOrder");

// Place Order button
document.getElementById("orderBtn").addEventListener("click", () => {

   const feet = sheetLengthIn / 12;
const basePrice = Math.max(PRICE_PER_FOOT, feet * PRICE_PER_FOOT);

const totalQty = images.reduce((sum, img) => sum + (img.qty || 1), 0);

// Final price
const price = basePrice * totalQty;

    // Order Summary Modal
    document.getElementById("modalSummary").innerHTML = `
        <div><span>Sheet Size</span><b>24" × ${sheetLengthIn}"</b></div>
        <div><span>Designs</span><b>${images.length}</b></div>
        <div><span>Estimated Total</span><b>$${price.toFixed(2)}</b></div>
    `;

    // Review Popup me bhi ye details dikhao
    document.getElementById("reviewDetails").innerHTML = `
        <div class="summary-row">
            <span>Sheet Size</span>
            <b>24" × ${sheetLengthIn}"</b>
        </div>

        <div class="summary-row">
            <span>Designs</span>
            <b>${images.length}</b>
        </div>

        <div class="summary-row">
            <span>Estimated Total</span>
            <b>$${price.toFixed(2)}</b>
        </div>
    `;

    agreeCheck.checked = false;
    continueOrder.disabled = true;

    reviewModal.classList.add("open");
});


// Checkbox
agreeCheck.addEventListener("change", () => {
    continueOrder.disabled = !agreeCheck.checked;
});


// Continue
continueOrder.addEventListener("click", () => {
    reviewModal.classList.remove("open");
    modalBg.classList.add("open");
});


// Close Review Popup
document.getElementById("reviewClose").onclick = () => {
    reviewModal.classList.remove("open");
};

document.getElementById("cancelReview").onclick = () => {
    reviewModal.classList.remove("open");
};


// Close Order Summary
document.getElementById("modalClose").onclick = () => {
    modalBg.classList.remove("open");
};

/* ======================================================
   PERFORMANCE: auto-fit zoom on small/mobile screens so the
   sheet fits within view without forcing left-right scrolling
   at 100% zoom on a narrow phone screen.
   ====================================================== */
function autoFitZoomMobile(){
  if(window.innerWidth > 700) return;
  const stage = document.querySelector('.stage-wrap');
  if(!stage) return;
  const available = stage.clientWidth - 40;
  const fitZoom = available / (SHEET_WIDTH_IN * PX_PER_IN);
  zoom = Math.max(0.35, Math.min(1, fitZoom));
  const zl = document.getElementById('zoomLabel');
  if(zl) zl.textContent = Math.round(zoom*100)+'%';
}
autoFitZoomMobile();
renderSheet();

/* =========================================================
   CRAFTOPIA GANG SHEET BUILDER - USER TOUR
   ========================================================= */

(function () {

    const TOUR_KEY = "craftopia_gangsheet_tour_completed";

    let currentStep = 0;
    let overlay;
    let highlight;
    let tourBox;

    const steps = [

        {
            target: null,
            title: "Welcome to Gang Sheet Builder 👋",
            text: "Let's take a quick tour of the Gang Sheet Builder. We'll show you what each important section does.",
            position: "center"
        },

        {
            target: "#dropZone",
            title: "1. Upload Your Designs",
            text: "Start here. Upload your PNG or JPG designs by clicking this area or dragging your files into it.",
            position: "right"
        },

        {
            target: "#miniPreview",
            title: "2. Preview",
            text: "Here you can quickly see the designs you have added to your gang sheet.",
            position: "right"
        },

        {
            target: "#layerList",
            title: "3. Your Designs",
            text: "All uploaded designs are shown here. Select a design when you want to edit it.",
            position: "right"
        },

        {
            target: "#autoArrangeBtn",
            title: "4. Auto Arrange",
            text: "Use Auto Arrange when you want the builder to automatically organize your designs on the sheet.",
            position: "right"
        },

        {
            target: "#undoBtn",
            title: "5. Undo",
            text: "Made a mistake? Click Undo to go back to your previous action.",
            position: "right"
        },

        {
            target: "#redoBtn",
            title: "6. Redo",
            text: "Use Redo to restore an action that you previously undid.",
            position: "right"
        },

        {
            target: "#rotateLeftBtn",
            title: "7. Rotate",
            text: "Use the rotate controls to turn your selected design.",
            position: "right"
        },

        {
            target: "#flipHBtn",
            title: "8. Flip",
            text: "Flip your selected design horizontally or vertically.",
            position: "right"
        },

        {
            target: "#trimBtn",
            title: "9. Trim",
            text: "Trim removes unnecessary transparent space around your design so you can use your sheet space better.",
            position: "right"
        },

        {
            target: "#bgToleranceRow",
            title: "10. Background Removal",
            text: "Use these controls when you need to remove unwanted background from your design.",
            position: "right"
        },

        {
            target: "#sheet",
            title: "11. Your Gang Sheet",
            text: "This is your main working area. Your designs will appear here and you can arrange them on the sheet.",
            position: "right"
        },

        {
            target: "#zoomIn",
            title: "12. Zoom",
            text: "Use the zoom controls to get a closer or wider view of your gang sheet.",
            position: "bottom"
        },

        {
            target: "#selPanel",
            title: "13. Design Settings",
            text: "When you select a design, its available editing settings appear here.",
            position: "left"
        },

        {
            target: "#orderBtn",
            title: "14. Place Your Order",
            text: "When your gang sheet is ready, review everything and click Place Order to continue.",
            position: "left"
        },

        {
            target: null,
            title: "You're Ready! 🎉",
            text: "That's the basic tour. Now you know how to upload, edit, arrange and order your gang sheet.",
            position: "center"
        }

    ];


    /* -------------------------------------------------------
       CREATE TOUR ELEMENTS
    ------------------------------------------------------- */

    function createTour() {

        overlay = document.createElement("div");
        overlay.id = "craftopiaTourOverlay";

        highlight = document.createElement("div");
        highlight.id = "craftopiaTourHighlight";

        tourBox = document.createElement("div");
        tourBox.id = "craftopiaTourBox";

        document.body.appendChild(overlay);
        document.body.appendChild(highlight);
        document.body.appendChild(tourBox);
    }


    /* -------------------------------------------------------
       GET TARGET
    ------------------------------------------------------- */

    function getTarget(selector) {

        if (!selector) {
            return null;
        }

        const element = document.querySelector(selector);

        if (!element) {
            return null;
        }

        const rect = element.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            return null;
        }

        return element;
    }


    /* -------------------------------------------------------
       SHOW CURRENT STEP
    ------------------------------------------------------- */

    function showStep() {

        const data = steps[currentStep];

        const target = getTarget(data.target);


        /* CENTER SCREEN */

        if (!target) {

            highlight.style.display = "none";

            renderBox(data);

            positionBox(null, data.position);

            return;
        }


        /* SCROLL TARGET INTO VIEW */

        target.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });


        setTimeout(function () {

            // account for the fixed mobile header sitting on top of content
            const headerEl = document.querySelector('header');
            const headerOffset = (headerEl && window.innerWidth <= 980) ? headerEl.offsetHeight + 10 : 0;
            if(headerOffset){ window.scrollBy(0, -headerOffset); }

            const rect = target.getBoundingClientRect();

            highlight.style.display = "block";

            highlight.style.left =
                (rect.left - 6) + "px";

            highlight.style.top =
                (rect.top - 6) + "px";

            highlight.style.width =
                (rect.width + 12) + "px";

            highlight.style.height =
                (rect.height + 12) + "px";


            renderBox(data);

            positionBox(
                rect,
                data.position
            );

        }, 350);
    }


    /* -------------------------------------------------------
       RENDER TOUR BOX
    ------------------------------------------------------- */

    function renderBox(data) {

        const first =
            currentStep === 0;

        const last =
            currentStep === steps.length - 1;


        tourBox.innerHTML = `

            <div class="craftopia-tour-step">
                STEP ${currentStep + 1} OF ${steps.length}
            </div>

            <h3 class="craftopia-tour-title">
                ${data.title}
            </h3>

            <p class="craftopia-tour-text">
                ${data.text}
            </p>

            <div class="craftopia-tour-footer">

                <button
                    type="button"
                    class="craftopia-tour-skip"
                    id="craftopiaTourSkip">
                    Skip Tour
                </button>

                <div class="craftopia-tour-actions">

                    ${
                        !first
                        ? `
                            <button
                                type="button"
                                class="craftopia-tour-back"
                                id="craftopiaTourBack">
                                Back
                            </button>
                        `
                        : ""
                    }

                    <button
                        type="button"
                        class="craftopia-tour-next"
                        id="craftopiaTourNext">

                        ${last ? "Finish" : "Next"}

                    </button>

                </div>

            </div>
        `;


        /* NEXT */

        document
            .getElementById("craftopiaTourNext")
            .onclick = function () {

                if (last) {

                    finishTour();

                    return;
                }

                currentStep++;

                showStep();
            };


        /* BACK */

        const backButton =
            document.getElementById(
                "craftopiaTourBack"
            );

        if (backButton) {

            backButton.onclick = function () {

                if (currentStep > 0) {

                    currentStep--;

                    showStep();
                }
            };
        }


        /* SKIP */

        document
            .getElementById("craftopiaTourSkip")
            .onclick = function () {

                finishTour();
            };
    }


    /* -------------------------------------------------------
       POSITION TOUR BOX
    ------------------------------------------------------- */

    function positionBox(rect, position) {

        const isMobile =
            window.innerWidth <= 700;


        const width =
            Math.min(
                360,
                window.innerWidth - 24
            );


        tourBox.style.width =
            width + "px";


        /* CENTER */

        if (!rect) {

            tourBox.style.left =
                ((window.innerWidth - width) / 2) + "px";

            tourBox.style.top =
                ((window.innerHeight - tourBox.offsetHeight) / 2) + "px";

            return;
        }


        /* MOBILE */

        if (isMobile) {

            tourBox.style.left =
                ((window.innerWidth - width) / 2) + "px";


            const below =
                rect.bottom + 16;

            const above =
                rect.top -
                tourBox.offsetHeight -
                16;


            if (
                below + tourBox.offsetHeight <
                window.innerHeight - 10
            ) {

                tourBox.style.top =
                    below + "px";

            }
            else if (above > 10) {

                tourBox.style.top =
                    above + "px";

            }
            else {

                tourBox.style.top =
                    "12px";
            }

            return;
        }


        /* DESKTOP */

        let left;
        let top;


        if (position === "right") {

            left =
                rect.right + 18;

            top =
                rect.top +
                (rect.height / 2) -
                (tourBox.offsetHeight / 2);
        }

        else if (position === "left") {

            left =
                rect.left -
                width -
                18;

            top =
                rect.top +
                (rect.height / 2) -
                (tourBox.offsetHeight / 2);
        }

        else if (position === "bottom") {

            left =
                rect.left +
                (rect.width / 2) -
                (width / 2);

            top =
                rect.bottom + 18;
        }

        else {

            left =
                (window.innerWidth - width) / 2;

            top =
                (window.innerHeight - tourBox.offsetHeight) / 2;
        }


        /* KEEP INSIDE SCREEN */

        left = Math.max(
            12,
            Math.min(
                left,
                window.innerWidth -
                width -
                12
            )
        );


        top = Math.max(
            12,
            Math.min(
                top,
                window.innerHeight -
                tourBox.offsetHeight -
                12
            )
        );


        tourBox.style.left =
            left + "px";

        tourBox.style.top =
            top + "px";
    }


    /* -------------------------------------------------------
       FINISH TOUR
    ------------------------------------------------------- */

    function finishTour() {

        localStorage.setItem(
            TOUR_KEY,
            "true"
        );


        if (overlay) {
            overlay.remove();
        }

        if (highlight) {
            highlight.remove();
        }

        if (tourBox) {
            tourBox.remove();
        }
    }


    /* -------------------------------------------------------
       START TOUR
    ------------------------------------------------------- */

    function startTour() {

        if (
            localStorage.getItem(
                TOUR_KEY
            ) === "true"
        ) {
            return;
        }


        setTimeout(function () {

            createTour();

            showStep();

        }, 1000);
    }


    /* -------------------------------------------------------
       RESPONSIVE RESIZE
    ------------------------------------------------------- */

    window.addEventListener(
        "resize",
        function () {

            if (!tourBox) {
                return;
            }

            const data =
                steps[currentStep];

            const target =
                getTarget(data.target);


            if (!target) {

                positionBox(
                    null,
                    "center"
                );

                return;
            }


            const rect =
                target.getBoundingClientRect();


            highlight.style.left =
                (rect.left - 6) + "px";

            highlight.style.top =
                (rect.top - 6) + "px";

            highlight.style.width =
                (rect.width + 12) + "px";

            highlight.style.height =
                (rect.height + 12) + "px";


            positionBox(
                rect,
                data.position
            );
        }
    );


    /* START */

    startTour();

})();}