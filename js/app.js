const STORAGE_KEY = 'gameCodexV6';

const defaultData = () => ({
  categories: [
    { id:'cat-sandbox', name:'Sandbox / Creative', icon:'🧱', color:'#8fb86e', order:1 },
    { id:'cat-auto', name:'Automation / Factory', icon:'⚙️', color:'#d4af37', order:2 },
    { id:'cat-life', name:'Life Sim / Business', icon:'🏙️', color:'#5fb1d4', order:3 },
    { id:'cat-rpg', name:'Open World RPG', icon:'🗡️', color:'#9a71ff', order:4 },
    { id:'cat-survival', name:'Survival / Exploration', icon:'🔥', color:'#e28f56', order:5 }
  ],
  games: [
    { id:'game-mc', title:'Minecraft', categoryId:'cat-sandbox', banner:'', steamAppId:'', status:'active', favorite:true, archived:false, lastViewed:Date.now()-300000 },
    { id:'game-sat', title:'Satisfactory', categoryId:'cat-auto', banner:'https://cdn.cloudflare.steamstatic.com/steam/apps/526870/header.jpg', steamAppId:'526870', status:'active', favorite:true, archived:false, lastViewed:Date.now()-150000 },
    { id:'game-ens', title:'Enshrouded', categoryId:'cat-survival', banner:'https://cdn.cloudflare.steamstatic.com/steam/apps/1203620/header.jpg', steamAppId:'1203620', status:'paused', favorite:false, archived:false, lastViewed:Date.now()-800000 }
  ],
  profiles: [
    { id:'profile-mc-1', gameId:'game-mc', name:'Modded RPG World', type:'world', status:'active', tag:'skills plugin', archived:false, lastViewed:Date.now()-220000 },
    { id:'profile-mc-2', gameId:'game-mc', name:'Creative Build World', type:'world', status:'paused', tag:'builder', archived:false, lastViewed:Date.now()-720000 },
    { id:'profile-sat-1', gameId:'game-sat', name:'Desert Factory', type:'save', status:'active', tag:'main run', archived:false, lastViewed:Date.now()-150000 },
    { id:'profile-ens-1', gameId:'game-ens', name:'Battlemage Solo', type:'playthrough', status:'active', tag:'wand build', archived:false, lastViewed:Date.now()-600000 }
  ],
  modules: [
    { id:'mod-mc-table', profileId:'profile-mc-1', title:'XP Methods', type:'table', icon:'📊', order:1, columns:[
      { id:'c1', name:'Skill', type:'text' }, { id:'c2', name:'Best Method', type:'text' }, { id:'c3', name:'XP Rate', type:'select', options:['Low','Medium','High'] }
    ], rows:[
      { id:'r1', values:{ c1:'Mining', c2:'Deep cave branch mine', c3:'High' } },
      { id:'r2', values:{ c1:'Combat', c2:'Mob grinder', c3:'High' } }
    ] },
    { id:'mod-ens-custom', profileId:'profile-ens-1', title:'Build Progression', type:'custom', icon:'🧠', order:1, fields:[
      { id:'f1', label:'Build Type', type:'select', options:['Mage','Tank','Ranger','Hybrid'] },
      { id:'f2', label:'Main Weapon', type:'text' },
      { id:'f3', label:'Skill Stage', type:'text' },
      { id:'f4', label:'Ready for boss', type:'toggle' }
    ], values:{ f1:'Mage', f2:'Wand', f3:'Mid tree', f4:true } },
    { id:'mod-sat-check', profileId:'profile-sat-1', title:'Factory Goals', type:'checklist', icon:'✔️', order:1, entries:[
      { id:'e1', title:'Automate reinforced plates', content:'', done:false },
      { id:'e2', title:'Expand coal power', content:'north ridge first', done:true }
    ] },
    { id:'mod-sat-notes', profileId:'profile-sat-1', title:'Bottlenecks', type:'notes', icon:'📜', order:2, entries:[
      { id:'e3', title:'Screw throughput', content:'Main jam point after rotors.', done:false }
    ] }
  ],
  currentView: 'home',
  currentCategoryId: null,
  currentGameId: null,
  currentProfileId: null,
  fieldBuilder: [],
  columnBuilder: []
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed, fieldBuilder: [], columnBuilder: [] };
  } catch {
    return defaultData();
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    categories: state.categories,
    games: state.games,
    profiles: state.profiles,
    modules: state.modules,
    currentView: state.currentView,
    currentCategoryId: state.currentCategoryId,
    currentGameId: state.currentGameId,
    currentProfileId: state.currentProfileId
  }));
}

const $ = (sel) => document.querySelector(sel);
const id = (prefix='id') => `${prefix}-${crypto.randomUUID().slice(0,8)}`;
const byId = (arr, value) => arr.find(x => x.id === value);
const fmtStatus = (s) => s ? s[0].toUpperCase() + s.slice(1) : '';
const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function gameBanner(game){
  if (game.banner) return game.banner;
  if (game.steamAppId) return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`;
  return '';
}
function sortedCategories(){ return [...state.categories].sort((a,b)=>a.order-b.order || a.name.localeCompare(b.name)); }
function activeGames(){ return state.games.filter(g => !g.archived && g.status !== 'archived'); }
function archivedGames(){ return state.games.filter(g => g.archived || g.status === 'archived'); }
function activeProfiles(){ return state.profiles.filter(p => !p.archived && p.status !== 'archived'); }
function archivedProfiles(){ return state.profiles.filter(p => p.archived || p.status === 'archived'); }

function renderAll() {
  saveState();
  renderSidebar();
  renderHome();
  renderFavorites();
  renderArchive();
  renderCategory();
  renderGame();
  renderProfile();
  setView(state.currentView || 'home');
}

function setView(view) {
  state.currentView = view;
  ['home','category','game','profile','favorites','archive'].forEach(v => $(`#${v}View`).classList.toggle('hidden', v !== view));
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  const titles = { home:'Game Codex', favorites:'Favorites', archive:'Archive' };
  let title = titles[view] || 'Game Codex';
  if (view === 'category') title = byId(state.categories, state.currentCategoryId)?.name || 'Category';
  if (view === 'game') title = byId(state.games, state.currentGameId)?.title || 'Game';
  if (view === 'profile') title = byId(state.profiles, state.currentProfileId)?.name || 'Profile';
  $('#viewTitle').textContent = title;
  saveState();
}

function renderSidebar() {
  const wrap = $('#sidebarCategories');
  wrap.innerHTML = sortedCategories().map(cat => {
    const count = activeGames().filter(g => g.categoryId === cat.id).length;
    return `<button class="nav-btn" data-category="${cat.id}" type="button"><span>${esc(cat.icon || '🎮')}</span><span>${esc(cat.name)} <span class="muted">(${count})</span></span></button>`;
  }).join('');
  $('#gameCategoryInput').innerHTML = sortedCategories().map(cat => `<option value="${cat.id}">${esc(cat.icon || '🎮')} ${esc(cat.name)}</option>`).join('');
  renderCategoryManager();
}

function renderHome() {
  const q = $('#searchInput').value.trim().toLowerCase();
  const recents = [...activeGames()].sort((a,b)=> (b.lastViewed||0)-(a.lastViewed||0)).slice(0,3);
  const filtered = activeGames().filter(g => !q || [g.title, getCategoryName(g.categoryId), g.status].join(' ').toLowerCase().includes(q));
  $('#homeView').innerHTML = `
    <div class="grid grid-3">
      ${recents.map(g => gameCard(g, true)).join('') || empty('No recent games yet.')}
    </div>
    <h3 class="section-title">Categories</h3>
    <div class="grid grid-3">
      ${sortedCategories().map(cat => {
        const count = filtered.filter(g => g.categoryId === cat.id).length;
        return `<button class="card" type="button" data-open-category="${cat.id}" style="border-color:${cat.color}55"><div class="row-between"><strong>${esc(cat.icon || '🎮')} ${esc(cat.name)}</strong><span class="chip">${count}</span></div><div class="muted">${count ? 'Open category' : 'Empty for now'}</div></button>`;
      }).join('')}
    </div>
    <h3 class="section-title">All Active Games</h3>
    <div class="grid grid-2">${filtered.map(g => gameListItem(g)).join('') || empty('No games match that search.')}</div>
  `;
}

function renderFavorites() {
  const favGames = activeGames().filter(g => g.favorite);
  $('#favoritesView').innerHTML = `<div class="grid grid-2">${favGames.map(g => gameListItem(g)).join('') || empty('No favorites yet.')}</div>`;
}

function renderArchive() {
  const games = archivedGames();
  const profiles = archivedProfiles();
  $('#archiveView').innerHTML = `
    <div class="archive-columns">
      <div>
        <h3 class="section-title">Archived Games</h3>
        <div class="stack-list">${games.map(g => `
          <div class="list-item">
            <div class="title-wrap"><strong>${esc(g.title)}</strong><div class="muted">${esc(getCategoryName(g.categoryId))} · ${fmtStatus(g.status)}</div></div>
            <div class="actions"><button class="secondary-btn" data-restore-game="${g.id}">Restore</button><button class="danger-btn" data-delete-game="${g.id}">Delete</button></div>
          </div>`).join('') || empty('No archived games.')}
        </div>
      </div>
      <div>
        <h3 class="section-title">Archived Profiles</h3>
        <div class="stack-list">${profiles.map(p => `
          <div class="list-item">
            <div class="title-wrap"><strong>${esc(p.name)}</strong><div class="muted">${esc(gameTitle(p.gameId))} · ${fmtStatus(p.status)}</div></div>
            <div class="actions"><button class="secondary-btn" data-restore-profile="${p.id}">Restore</button><button class="danger-btn" data-delete-profile="${p.id}">Delete</button></div>
          </div>`).join('') || empty('No archived profiles.')}
        </div>
      </div>
    </div>`;
}

function renderCategory() {
  const cat = byId(state.categories, state.currentCategoryId);
  if (!cat) { $('#categoryView').innerHTML = empty('Pick a category.'); return; }
  const games = activeGames().filter(g => g.categoryId === cat.id);
  $('#categoryView').innerHTML = `
    <div class="hero-card" style="border-color:${cat.color}66">
      <div class="eyebrow">Category</div><h2>${esc(cat.icon || '🎮')} ${esc(cat.name)}</h2>
      <div class="badges"><span class="chip">${games.length} games</span><span class="chip">Custom color</span></div>
    </div>
    <h3 class="section-title">Games</h3>
    <div class="grid grid-2">${games.map(g => gameListItem(g)).join('') || empty('No games in this category yet.')}</div>`;
}

function renderGame() {
  const game = byId(state.games, state.currentGameId);
  if (!game) { $('#gameView').innerHTML = empty('Pick a game.'); return; }
  game.lastViewed = Date.now();
  const banner = gameBanner(game);
  const profiles = activeProfiles().filter(p => p.gameId === game.id).sort((a,b)=> (b.lastViewed||0)-(a.lastViewed||0));
  $('#gameView').innerHTML = `
    <div class="hero-card" ${banner ? `style="background-image:url('${banner.replace(/'/g,"%27")}')"` : ''}>
      <div class="eyebrow">${esc(getCategoryName(game.categoryId))}</div>
      <div class="game-header"><div><h2>${esc(game.title)}</h2><div class="badges"><span class="chip">${fmtStatus(game.status)}</span>${game.favorite ? '<span class="chip">Favorite</span>' : ''}</div></div>
      <div class="actions">
        <button class="secondary-btn" data-edit-game="${game.id}">Edit</button>
        <button class="secondary-btn" data-archive-game="${game.id}">Archive</button>
        <button class="primary-btn" data-open-profile-modal="${game.id}">+ Add Profile</button>
      </div></div>
    </div>
    <h3 class="section-title">Profiles</h3>
    <div class="profile-list">${profiles.map(profileCard).join('') || empty('No profiles yet. Add one.')}</div>`;
}

function renderProfile() {
  const profile = byId(state.profiles, state.currentProfileId);
  if (!profile) { $('#profileView').innerHTML = empty('Pick a profile.'); return; }
  profile.lastViewed = Date.now();
  const game = byId(state.games, profile.gameId);
  const mods = state.modules.filter(m => m.profileId === profile.id).sort((a,b)=>a.order-b.order);
  $('#profileView').innerHTML = `
    <div class="hero-card" ${gameBanner(game) ? `style="background-image:url('${gameBanner(game).replace(/'/g,"%27")}')"` : ''}>
      <div class="eyebrow">${esc(game?.title || 'Game')} · ${esc(profile.type)}</div>
      <div class="game-header"><div><h2>${esc(profile.name)}</h2><div class="badges"><span class="chip">${fmtStatus(profile.status)}</span>${profile.tag ? `<span class="chip">${esc(profile.tag)}</span>` : ''}</div></div>
      <div class="actions">
        <button class="secondary-btn" data-edit-profile="${profile.id}">Edit</button>
        <button class="secondary-btn" data-clone-profile="${profile.id}">Clone Profile</button>
        <button class="secondary-btn" data-archive-profile="${profile.id}">Archive</button>
        <button class="primary-btn" data-open-module-modal="${profile.id}">+ Add Module</button>
      </div></div>
    </div>
    <div class="module-list">${mods.map(moduleCard).join('') || empty('No modules yet. Build one.')}</div>`;
}

function renderCategoryManager() {
  $('#categoryManagerList').innerHTML = sortedCategories().map(cat => `
    <div class="manager-row" style="border-left:4px solid ${cat.color}">
      <div><strong>${esc(cat.icon || '🎮')} ${esc(cat.name)}</strong><div class="muted">${activeGames().filter(g=>g.categoryId===cat.id).length} active games</div></div>
      <div class="actions">
        <button class="secondary-btn" data-cat-up="${cat.id}">↑</button>
        <button class="secondary-btn" data-cat-down="${cat.id}">↓</button>
        <button class="secondary-btn" data-edit-category="${cat.id}">Edit</button>
        <button class="danger-btn" data-delete-category="${cat.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

function gameCard(game, compact=false) {
  const cat = byId(state.categories, game.categoryId);
  const banner = gameBanner(game);
  return `<button class="hero-card" type="button" data-open-game="${game.id}" ${banner ? `style="background-image:url('${banner.replace(/'/g,"%27")}')"` : ''}><div class="eyebrow">${esc(cat?.name || '')}</div><h3>${esc(game.title)}</h3><div class="badges"><span class="chip">${fmtStatus(game.status)}</span>${game.favorite ? '<span class="chip">Favorite</span>' : ''}</div>${compact ? `<div class="muted">${new Date(game.lastViewed).toLocaleString()}</div>` : ''}</button>`;
}
function gameListItem(game){
  const profiles = activeProfiles().filter(p => p.gameId === game.id).length;
  return `<div class="list-item"><div class="title-wrap"><strong>${esc(game.title)}</strong><div class="muted">${esc(getCategoryName(game.categoryId))} · ${profiles} profiles · ${fmtStatus(game.status)}</div></div><div class="actions"><button class="secondary-btn" data-open-game="${game.id}">Open</button><button class="secondary-btn" data-edit-game="${game.id}">Edit</button></div></div>`;
}
function profileCard(profile){
  const mods = state.modules.filter(m => m.profileId === profile.id).length;
  return `<div class="list-item"><div class="title-wrap"><strong>${esc(profile.name)}</strong><div class="muted">${esc(profile.type)} · ${fmtStatus(profile.status)} · ${mods} modules${profile.tag ? ' · ' + esc(profile.tag) : ''}</div></div><div class="actions"><button class="secondary-btn" data-open-profile="${profile.id}">Open</button><button class="secondary-btn" data-edit-profile="${profile.id}">Edit</button><button class="secondary-btn" data-clone-profile="${profile.id}">Clone</button></div></div>`;
}
function moduleCard(mod){
  let content = '';
  if (mod.type === 'notes' || mod.type === 'checklist') {
    const entries = mod.entries || [];
    content = `<div class="module-content">${entries.map(entry => `
      <div class="entry-row ${entry.done ? 'done':''}">
        <div>
          <strong>${esc(entry.title)}</strong>${entry.content ? `<div class="muted">${esc(entry.content)}</div>`:''}
        </div>
        <div class="actions">
          ${mod.type === 'checklist' ? `<button class="secondary-btn" data-toggle-entry="${mod.id}:${entry.id}">${entry.done ? 'Undo' : 'Done'}</button>`:''}
          <button class="secondary-btn" data-edit-entry="${mod.id}:${entry.id}">Edit</button>
          <button class="danger-btn" data-delete-entry="${mod.id}:${entry.id}">Delete</button>
        </div>
      </div>`).join('') || empty('No entries yet.')}</div>`;
  }
  if (mod.type === 'custom') {
    content = `<div class="field-display">${(mod.fields||[]).map(f => `<div class="field-box"><div class="muted">${esc(f.label)}</div><strong>${formatFieldValue(f, mod.values?.[f.id])}</strong></div>`).join('') || empty('No fields.')}</div>`;
  }
  if (mod.type === 'table') {
    content = `<div class="table-wrap"><table class="table"><thead><tr>${(mod.columns||[]).map(c=>`<th>${esc(c.name)}</th>`).join('')}<th></th></tr></thead><tbody>${(mod.rows||[]).map(row => `<tr>${(mod.columns||[]).map(c => `<td>${esc(row.values?.[c.id] ?? '')}</td>`).join('')}<td><div class="actions"><button class="secondary-btn" data-edit-row="${mod.id}:${row.id}">Edit</button><button class="danger-btn" data-delete-row="${mod.id}:${row.id}">Delete</button></div></td></tr>`).join('') || `<tr><td colspan="${(mod.columns?.length||1)+1}" class="muted">No rows yet.</td></tr>`}</tbody></table></div>`;
  }
  return `<div class="module-card"><div class="module-head"><div><div class="eyebrow">${esc(mod.type)}</div><h4>${esc(mod.icon || '📚')} ${esc(mod.title)}</h4></div><div class="actions"><button class="secondary-btn" data-clone-module="${mod.id}">Clone</button><button class="secondary-btn" data-move-module-up="${mod.id}">↑</button><button class="secondary-btn" data-move-module-down="${mod.id}">↓</button><button class="secondary-btn" data-edit-module="${mod.id}">Edit</button><button class="danger-btn" data-delete-module="${mod.id}">Delete</button>${mod.type==='table' ? `<button class="primary-btn" data-add-row="${mod.id}">+ Row</button>` : `<button class="primary-btn" data-add-entry="${mod.id}">+ Entry</button>`}</div></div>${content}</div>`;
}
function formatFieldValue(field, value){
  if (field.type === 'toggle') return value ? 'Yes' : 'No';
  return esc(value ?? '—');
}
function empty(text){ return `<div class="empty-state">${esc(text)}</div>`; }
function getCategoryName(id){ return byId(state.categories, id)?.name || 'Unknown'; }
function gameTitle(id){ return byId(state.games, id)?.title || 'Unknown'; }

function openModal(id){ $("#"+id).showModal(); }
function closeModal(id){ $("#"+id).close(); }

function openGameModal(gameId=null){
  const game = gameId ? byId(state.games, gameId) : null;
  $('#gameModalTitle').textContent = game ? 'Edit Game' : 'Add Game';
  $('#gameEditId').value = game?.id || '';
  $('#gameTitleInput').value = game?.title || '';
  $('#gameStatusInput').value = game?.status || 'active';
  $('#gameCategoryInput').value = game?.categoryId || sortedCategories()[0]?.id || '';
  $('#gameBannerInput').value = game?.banner || '';
  $('#gameFavoriteInput').value = String(!!game?.favorite);
  $('#gameSteamInput').value = game?.steamAppId || '';
  openModal('gameModal');
}
function openCategoryModal(categoryId=null){
  const cat = categoryId ? byId(state.categories, categoryId) : null;
  $('#categoryModalTitle').textContent = cat ? 'Edit Category' : 'Add Category';
  $('#categoryEditId').value = cat?.id || '';
  $('#categoryNameInput').value = cat?.name || '';
  $('#categoryIconInput').value = cat?.icon || '';
  $('#categoryColorInput').value = cat?.color || '#d4af37';
  openModal('categoryModal');
}
function openProfileModal(gameId, profileId=null){
  const profile = profileId ? byId(state.profiles, profileId) : null;
  $('#profileModalTitle').textContent = profile ? 'Edit Profile' : 'Add Profile';
  $('#profileEditId').value = profile?.id || '';
  $('#profileGameId').value = gameId || profile?.gameId || state.currentGameId || '';
  $('#profileNameInput').value = profile?.name || '';
  $('#profileTypeInput').value = profile?.type || 'world';
  $('#profileStatusInput').value = profile?.status || 'active';
  $('#profileTagInput').value = profile?.tag || '';
  openModal('profileModal');
}
function openModuleModal(profileId, moduleId=null){
  const mod = moduleId ? byId(state.modules, moduleId) : null;
  $('#moduleModalTitle').textContent = mod ? 'Edit Module' : 'Add Module';
  $('#moduleEditId').value = mod?.id || '';
  $('#moduleProfileId').value = profileId || mod?.profileId || state.currentProfileId || '';
  $('#moduleTitleInput').value = mod?.title || '';
  $('#moduleTypeInput').value = mod?.type || 'notes';
  $('#moduleIconInput').value = mod?.icon || '';
  state.fieldBuilder = JSON.parse(JSON.stringify(mod?.fields || []));
  state.columnBuilder = JSON.parse(JSON.stringify(mod?.columns || []));
  syncModuleBuilders();
  openModal('moduleModal');
}
function openEntryModal(moduleId, entryId=null){
  const mod = byId(state.modules, moduleId);
  const entry = entryId ? (mod.entries || []).find(e=>e.id===entryId) : null;
  $('#entryModalTitle').textContent = entry ? 'Edit Entry' : 'Add Entry';
  $('#entryEditId').value = entry?.id || '';
  $('#entryModuleId').value = moduleId;
  $('#entryTitleInput').value = entry?.title || '';
  $('#entryContentInput').value = entry?.content || '';
  openModal('entryModal');
}
function openRowModal(moduleId, rowId=null){
  const mod = byId(state.modules, moduleId);
  const row = rowId ? (mod.rows || []).find(r=>r.id===rowId) : null;
  $('#tableRowTitle').textContent = row ? 'Edit Row' : 'Add Row';
  $('#tableRowEditId').value = row?.id || '';
  $('#tableRowModuleId').value = moduleId;
  $('#tableRowFields').innerHTML = (mod.columns || []).map(col => {
    const val = row?.values?.[col.id] ?? '';
    if (col.type === 'select') {
      return `<label><span>${esc(col.name)}</span><select data-row-col="${col.id}">${(col.options||[]).map(op => `<option value="${esc(op)}" ${op===val?'selected':''}>${esc(op)}</option>`).join('')}</select></label>`;
    }
    return `<label><span>${esc(col.name)}</span><input data-row-col="${col.id}" type="text" value="${esc(val)}" /></label>`;
  }).join('');
  openModal('tableRowModal');
}

function syncModuleBuilders(){
  const type = $('#moduleTypeInput').value;
  $('#customFieldBuilderSection').classList.toggle('hidden', type !== 'custom');
  $('#tableBuilderSection').classList.toggle('hidden', type !== 'table');
  $('#fieldBuilderList').innerHTML = state.fieldBuilder.map((field, index) => `
    <div class="builder-row">
      <input data-field-label="${index}" type="text" value="${esc(field.label || '')}" placeholder="Field label" />
      <select data-field-type="${index}">
        <option value="text" ${field.type==='text'?'selected':''}>Text</option>
        <option value="number" ${field.type==='number'?'selected':''}>Number</option>
        <option value="select" ${field.type==='select'?'selected':''}>Dropdown</option>
        <option value="toggle" ${field.type==='toggle'?'selected':''}>Toggle</option>
      </select>
      <button class="danger-btn" type="button" data-remove-field="${index}">Remove</button>
      ${field.type === 'select' ? `<input style="grid-column:1/4" data-field-options="${index}" type="text" value="${esc((field.options||[]).join(', '))}" placeholder="Comma separated options" />` : ''}
    </div>`).join('') || empty('No custom fields yet.');
  $('#columnBuilderList').innerHTML = state.columnBuilder.map((col, index) => `
    <div class="builder-row table">
      <input data-col-name="${index}" type="text" value="${esc(col.name || '')}" placeholder="Column name" />
      <select data-col-type="${index}">
        <option value="text" ${col.type==='text'?'selected':''}>Text</option>
        <option value="select" ${col.type==='select'?'selected':''}>Dropdown</option>
      </select>
      <button class="danger-btn" type="button" data-remove-column="${index}">Remove</button>
      ${col.type === 'select' ? `<input style="grid-column:1/4" data-col-options="${index}" type="text" value="${esc((col.options||[]).join(', '))}" placeholder="Comma separated options" />` : ''}
    </div>`).join('') || empty('No columns yet.');
}

function cloneProfile(profileId){
  const old = byId(state.profiles, profileId); if(!old) return;
  const newProfile = { ...structuredClone(old), id:id('profile'), name:`${old.name} Copy`, archived:false, status:'active', lastViewed:Date.now() };
  state.profiles.push(newProfile);
  const oldMods = state.modules.filter(m=>m.profileId===profileId);
  oldMods.forEach(mod => {
    const cloned = structuredClone(mod);
    cloned.id = id('mod');
    cloned.profileId = newProfile.id;
    if (cloned.entries) cloned.entries = cloned.entries.map(e=>({ ...e, id:id('entry') }));
    if (cloned.rows) cloned.rows = cloned.rows.map(r=>({ ...r, id:id('row') }));
    if (cloned.fields) cloned.fields = cloned.fields.map(f=>({ ...f, id:id('field') }));
    if (cloned.columns) cloned.columns = cloned.columns.map(c=>({ ...c, id:id('col') }));
    state.modules.push(cloned);
  });
  state.currentProfileId = newProfile.id;
  state.currentGameId = newProfile.gameId;
  setView('profile');
  renderAll();
}
function cloneModule(moduleId){
  const mod = byId(state.modules, moduleId); if(!mod) return;
  const cloned = structuredClone(mod);
  cloned.id = id('mod');
  cloned.title = `${mod.title} Copy`;
  cloned.order = (Math.max(0, ...state.modules.filter(m=>m.profileId===mod.profileId).map(m=>m.order||0)) + 1);
  if (cloned.entries) cloned.entries = cloned.entries.map(e=>({ ...e, id:id('entry') }));
  if (cloned.rows) cloned.rows = cloned.rows.map(r=>({ ...r, id:id('row') }));
  if (cloned.fields) cloned.fields = cloned.fields.map(f=>({ ...f, id:id('field') }));
  if (cloned.columns) cloned.columns = cloned.columns.map(c=>({ ...c, id:id('col') }));
  state.modules.push(cloned);
  renderAll();
}

function deleteGame(gameId){
  state.games = state.games.filter(g=>g.id!==gameId);
  const profileIds = state.profiles.filter(p=>p.gameId===gameId).map(p=>p.id);
  state.profiles = state.profiles.filter(p=>p.gameId!==gameId);
  state.modules = state.modules.filter(m=>!profileIds.includes(m.profileId));
  if (state.currentGameId === gameId) state.currentGameId = null;
  if (profileIds.includes(state.currentProfileId)) state.currentProfileId = null;
  renderAll();
}
function deleteProfile(profileId){
  state.profiles = state.profiles.filter(p=>p.id!==profileId);
  state.modules = state.modules.filter(m=>m.profileId!==profileId);
  if (state.currentProfileId === profileId) state.currentProfileId = null;
  renderAll();
}

function moveModule(moduleId, dir){
  const mod = byId(state.modules, moduleId); if(!mod) return;
  const list = state.modules.filter(m=>m.profileId===mod.profileId).sort((a,b)=>a.order-b.order);
  const idx = list.findIndex(m=>m.id===moduleId);
  const swap = list[idx+dir]; if(!swap) return;
  [mod.order, swap.order] = [swap.order, mod.order];
  renderAll();
}
function reorderCategory(catId, dir){
  const list = sortedCategories();
  const idx = list.findIndex(c=>c.id===catId); const swap = list[idx+dir]; if(!swap) return;
  const a = byId(state.categories, catId); const b = byId(state.categories, swap.id);
  [a.order, b.order] = [b.order, a.order];
  renderAll();
}

function handleImport(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = { ...defaultData(), ...parsed, fieldBuilder: [], columnBuilder: [] };
      renderAll();
    } catch { alert('Import failed. Bad JSON.'); }
  };
  reader.readAsText(file);
}

function bindEvents(){
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-open-game], [data-open-profile], [data-open-category]');
    if (!t) return;
    if (t.dataset.view) return setView(t.dataset.view);
    if (t.id === 'openSidebarBtn') { $('#sidebar').classList.remove('closed'); $('#overlay').classList.remove('hidden'); }
    if (t.id === 'closeSidebarBtn') { $('#sidebar').classList.add('closed'); $('#overlay').classList.add('hidden'); }
    if (t.id === 'openCategoryManagerBtn') openModal('categoryManagerModal');
    if (t.id === 'addCategoryBtn') openCategoryModal();
    if (t.id === 'addGameBtn') openGameModal();
    if (t.dataset.category) { state.currentCategoryId = t.dataset.category; setView('category'); renderAll(); $('#sidebar').classList.add('closed'); $('#overlay').classList.add('hidden'); }
    if (t.dataset.openCategory) { state.currentCategoryId = t.dataset.openCategory; setView('category'); renderAll(); }
    if (t.dataset.openGame) { state.currentGameId = t.dataset.openGame; setView('game'); renderAll(); }
    if (t.dataset.openProfile) { state.currentProfileId = t.dataset.openProfile; state.currentGameId = byId(state.profiles, t.dataset.openProfile)?.gameId || state.currentGameId; setView('profile'); renderAll(); }
    if (t.dataset.editGame) openGameModal(t.dataset.editGame);
    if (t.dataset.archiveGame) { const g = byId(state.games, t.dataset.archiveGame); if(g){ g.archived = true; g.status='archived'; renderAll(); }}
    if (t.dataset.restoreGame) { const g = byId(state.games, t.dataset.restoreGame); if(g){ g.archived = false; g.status='active'; renderAll(); }}
    if (t.dataset.deleteGame && confirm('Delete this game and all profiles/modules?')) deleteGame(t.dataset.deleteGame);
    if (t.dataset.openProfileModal) openProfileModal(t.dataset.openProfileModal);
    if (t.dataset.editProfile) { const p = byId(state.profiles, t.dataset.editProfile); openProfileModal(p?.gameId, p?.id); }
    if (t.dataset.cloneProfile) cloneProfile(t.dataset.cloneProfile);
    if (t.dataset.archiveProfile) { const p = byId(state.profiles, t.dataset.archiveProfile); if(p){ p.archived = true; p.status='archived'; renderAll(); }}
    if (t.dataset.restoreProfile) { const p = byId(state.profiles, t.dataset.restoreProfile); if(p){ p.archived = false; p.status='active'; renderAll(); }}
    if (t.dataset.deleteProfile && confirm('Delete this profile and its modules?')) deleteProfile(t.dataset.deleteProfile);
    if (t.dataset.openModuleModal) openModuleModal(t.dataset.openModuleModal);
    if (t.dataset.editModule) { const m = byId(state.modules, t.dataset.editModule); openModuleModal(m?.profileId, m?.id); }
    if (t.dataset.cloneModule) cloneModule(t.dataset.cloneModule);
    if (t.dataset.deleteModule && confirm('Delete this module?')) { state.modules = state.modules.filter(m=>m.id!==t.dataset.deleteModule); renderAll(); }
    if (t.dataset.moveModuleUp) moveModule(t.dataset.moveModuleUp, -1);
    if (t.dataset.moveModuleDown) moveModule(t.dataset.moveModuleDown, 1);
    if (t.dataset.addEntry) openEntryModal(t.dataset.addEntry);
    if (t.dataset.addRow) openRowModal(t.dataset.addRow);
    if (t.dataset.editEntry) { const [modId, entryId] = t.dataset.editEntry.split(':'); openEntryModal(modId, entryId); }
    if (t.dataset.deleteEntry) { const [modId, entryId] = t.dataset.deleteEntry.split(':'); const mod = byId(state.modules, modId); mod.entries = (mod.entries||[]).filter(e=>e.id!==entryId); renderAll(); }
    if (t.dataset.toggleEntry) { const [modId, entryId] = t.dataset.toggleEntry.split(':'); const mod = byId(state.modules, modId); const entry = (mod.entries||[]).find(e=>e.id===entryId); if(entry){ entry.done = !entry.done; renderAll(); }}
    if (t.dataset.editRow) { const [modId, rowId] = t.dataset.editRow.split(':'); openRowModal(modId, rowId); }
    if (t.dataset.deleteRow) { const [modId, rowId] = t.dataset.deleteRow.split(':'); const mod = byId(state.modules, modId); mod.rows = (mod.rows||[]).filter(r=>r.id!==rowId); renderAll(); }
    if (t.dataset.editCategory) openCategoryModal(t.dataset.editCategory);
    if (t.dataset.deleteCategory) {
      const catId = t.dataset.deleteCategory;
      const fallback = sortedCategories().find(c => c.id !== catId);
      if (!fallback) return alert('You need at least one category.');
      state.games.forEach(g => { if (g.categoryId === catId) g.categoryId = fallback.id; });
      state.categories = state.categories.filter(c => c.id !== catId);
      renderAll();
    }
    if (t.dataset.catUp) reorderCategory(t.dataset.catUp, -1);
    if (t.dataset.catDown) reorderCategory(t.dataset.catDown, 1);
    if (t.dataset.removeField !== undefined) { state.fieldBuilder.splice(Number(t.dataset.removeField),1); syncModuleBuilders(); }
    if (t.dataset.removeColumn !== undefined) { state.columnBuilder.splice(Number(t.dataset.removeColumn),1); syncModuleBuilders(); }
    if (t.id === 'addFieldBtn') { state.fieldBuilder.push({ id:id('field'), label:'New Field', type:'text', options:[] }); syncModuleBuilders(); }
    if (t.id === 'addColumnBtn') { state.columnBuilder.push({ id:id('col'), name:'New Column', type:'text', options:[] }); syncModuleBuilders(); }
    if (t.id === 'exportBtn') {
      const blob = new Blob([JSON.stringify({ categories:state.categories, games:state.games, profiles:state.profiles, modules:state.modules }, null, 2)], { type:'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'game-codex-v6-backup.json'; a.click(); URL.revokeObjectURL(a.href);
    }
    if (t.id === 'resetBtn' && confirm('Reset to demo data?')) { state = defaultData(); renderAll(); }
  });

  $('#overlay').addEventListener('click', ()=>{ $('#sidebar').classList.add('closed'); $('#overlay').classList.add('hidden'); });
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', ()=>closeModal(btn.dataset.close)));
  $('#searchInput').addEventListener('input', ()=> renderHome());
  $('#importInput').addEventListener('change', (e)=> e.target.files[0] && handleImport(e.target.files[0]));
  $('#moduleTypeInput').addEventListener('change', syncModuleBuilders);
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.fieldLabel !== undefined) state.fieldBuilder[Number(t.dataset.fieldLabel)].label = t.value;
    if (t.dataset.fieldType !== undefined) { state.fieldBuilder[Number(t.dataset.fieldType)].type = t.value; if (t.value !== 'select') delete state.fieldBuilder[Number(t.dataset.fieldType)].options; syncModuleBuilders(); }
    if (t.dataset.fieldOptions !== undefined) state.fieldBuilder[Number(t.dataset.fieldOptions)].options = t.value.split(',').map(v=>v.trim()).filter(Boolean);
    if (t.dataset.colName !== undefined) state.columnBuilder[Number(t.dataset.colName)].name = t.value;
    if (t.dataset.colType !== undefined) { state.columnBuilder[Number(t.dataset.colType)].type = t.value; if (t.value !== 'select') delete state.columnBuilder[Number(t.dataset.colType)].options; syncModuleBuilders(); }
    if (t.dataset.colOptions !== undefined) state.columnBuilder[Number(t.dataset.colOptions)].options = t.value.split(',').map(v=>v.trim()).filter(Boolean);
  });

  $('#gameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const gameId = $('#gameEditId').value;
    const payload = {
      title: $('#gameTitleInput').value.trim(),
      categoryId: $('#gameCategoryInput').value,
      banner: $('#gameBannerInput').value.trim(),
      steamAppId: $('#gameSteamInput').value.trim(),
      status: $('#gameStatusInput').value,
      favorite: $('#gameFavoriteInput').value === 'true',
      archived: $('#gameStatusInput').value === 'archived',
      lastViewed: Date.now()
    };
    if (gameId) Object.assign(byId(state.games, gameId), payload);
    else state.games.push({ id:id('game'), ...payload });
    closeModal('gameModal'); renderAll();
  });

  $('#categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const existing = $('#categoryEditId').value;
    const payload = { name: $('#categoryNameInput').value.trim(), icon: $('#categoryIconInput').value.trim() || '🎮', color: $('#categoryColorInput').value };
    if (existing) Object.assign(byId(state.categories, existing), payload);
    else state.categories.push({ id:id('cat'), ...payload, order:(Math.max(0,...state.categories.map(c=>c.order||0))+1) });
    closeModal('categoryModal'); renderAll();
  });

  $('#profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const profileId = $('#profileEditId').value;
    const payload = { gameId: $('#profileGameId').value, name: $('#profileNameInput').value.trim(), type: $('#profileTypeInput').value, status: $('#profileStatusInput').value, tag: $('#profileTagInput').value.trim(), archived: $('#profileStatusInput').value === 'archived', lastViewed: Date.now() };
    if (profileId) Object.assign(byId(state.profiles, profileId), payload);
    else state.profiles.push({ id:id('profile'), ...payload });
    closeModal('profileModal'); renderAll();
  });

  $('#moduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const moduleId = $('#moduleEditId').value;
    const type = $('#moduleTypeInput').value;
    const base = {
      profileId: $('#moduleProfileId').value,
      title: $('#moduleTitleInput').value.trim(),
      type,
      icon: $('#moduleIconInput').value.trim() || '📚'
    };
    const existing = moduleId ? byId(state.modules, moduleId) : null;
    const payload = { ...base };
    if (type === 'notes' || type === 'checklist') payload.entries = existing?.entries || [];
    if (type === 'custom') { payload.fields = structuredClone(state.fieldBuilder); payload.values = existing?.values || Object.fromEntries(payload.fields.map(f=>[f.id, f.type==='toggle'?false:''])); }
    if (type === 'table') { payload.columns = structuredClone(state.columnBuilder); payload.rows = existing?.rows || []; }
    if (moduleId) Object.assign(existing, payload);
    else state.modules.push({ id:id('mod'), order:(Math.max(0,...state.modules.filter(m=>m.profileId===payload.profileId).map(m=>m.order||0))+1), ...payload });
    closeModal('moduleModal'); renderAll();
  });

  $('#entryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const moduleId = $('#entryModuleId').value, mod = byId(state.modules, moduleId);
    mod.entries ||= [];
    const entryId = $('#entryEditId').value;
    const payload = { title: $('#entryTitleInput').value.trim(), content: $('#entryContentInput').value.trim(), done: false };
    if (entryId) Object.assign(mod.entries.find(en=>en.id===entryId), payload);
    else mod.entries.push({ id:id('entry'), ...payload });
    closeModal('entryModal'); renderAll();
  });

  $('#tableRowForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const moduleId = $('#tableRowModuleId').value, mod = byId(state.modules, moduleId);
    mod.rows ||= [];
    const values = Object.fromEntries([...$('#tableRowFields').querySelectorAll('[data-row-col]')].map(el => [el.dataset.rowCol, el.value]));
    const rowId = $('#tableRowEditId').value;
    if (rowId) Object.assign(mod.rows.find(r=>r.id===rowId), { values });
    else mod.rows.push({ id:id('row'), values });
    closeModal('tableRowModal'); renderAll();
  });
}

bindEvents();
renderAll();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
