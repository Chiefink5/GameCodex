const STORAGE_KEY = 'game_codex_v5';
const CATEGORIES = [
  { id: 'sandbox', name: 'Sandbox / Creative', icon: '🧱' },
  { id: 'automation', name: 'Automation / Factory', icon: '⚙️' },
  { id: 'open-world-rpg', name: 'Open World RPG', icon: '🗡' },
  { id: 'survival', name: 'Survival / Exploration', icon: '🔥' },
  { id: 'life-sim', name: 'Life Sim / Business', icon: '🏙' },
  { id: 'simulation', name: 'Simulation / Systems', icon: '🖥' },
  { id: 'experimental', name: 'Experimental / Oddball', icon: '🧪' },
];

const state = {
  view: { name: 'home', id: null },
  search: '',
  data: loadData(),
};

function id(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2,10)}`; }
function now() { return Date.now(); }
function categoryById(id) { return CATEGORIES.find(c => c.id === id); }
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); }
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  return seedData();
}
function seedData() {
  const game1 = id('game'), game2 = id('game'), game3 = id('game');
  const p1 = id('profile'), p2 = id('profile'), p3 = id('profile'), p4 = id('profile');
  const m1 = id('module'), m2 = id('module'), m3 = id('module'), m4 = id('module'), m5 = id('module');
  const e1 = id('entry'), e2 = id('entry'), e3 = id('entry');
  return {
    games: [
      { id: game1, title: 'Minecraft', categoryId: 'sandbox', status: 'active', favorite: true, lastViewed: now(), banner: '', steamAppId: '' },
      { id: game2, title: 'Enshrouded', categoryId: 'survival', status: 'active', favorite: true, lastViewed: now()-1000, banner: '', steamAppId: '1203620' },
      { id: game3, title: 'Satisfactory', categoryId: 'automation', status: 'paused', favorite: false, lastViewed: now()-2000, banner: '', steamAppId: '526870' },
    ],
    profiles: [
      { id: p1, gameId: game1, name: 'Vanilla Survival', type: 'world', status: 'active', tag: 'solo', lastViewed: now() },
      { id: p2, gameId: game1, name: 'Modded RPG World', type: 'world', status: 'paused', tag: 'skill plugin', lastViewed: now()-100 },
      { id: p3, gameId: game2, name: 'Solo Battlemage', type: 'playthrough', status: 'active', tag: 'mage build', lastViewed: now()-500 },
      { id: p4, gameId: game3, name: 'Main Factory', type: 'save', status: 'paused', tag: 'desert start', lastViewed: now()-900 },
    ],
    modules: [
      { id: m1, profileId: p2, type: 'table', title: 'Skill XP Guide', icon: '📊', order: 1, columns: [{id:id('col'),label:'Skill',type:'text'},{id:id('col'),label:'Best Method',type:'text'},{id:id('col'),label:'XP Rate',type:'select',options:['Low','Medium','High']},{id:id('col'),label:'Notes',type:'text'}], rows: [
        { id:id('row'), values:{0:'Mining',1:'Deep cave iron routes',2:'High',3:'Great with vein miner'} },
        { id:id('row'), values:{0:'Combat',1:'Mob grinder',2:'High',3:'Easy passive grind'} },
      ]},
      { id: m2, profileId: p3, type: 'custom', title: 'Build Progression', icon: '🧠', order: 1, fields:[
        {id:id('field'),label:'Build Type',type:'select',options:['Mage','Tank','Ranger','Hybrid']},
        {id:id('field'),label:'Main Weapon',type:'text'},
        {id:id('field'),label:'Skill Stage',type:'select',options:['Early','Mid','Late']},
        {id:id('field'),label:'Battle Heal Unlocked',type:'toggle'},
      ], values:{} },
      { id: m3, profileId: p3, type: 'checklist', title: 'Skill Goals', icon: '✔', order: 2 },
      { id: m4, profileId: p4, type: 'notes', title: 'Bottlenecks', icon: '📜', order: 1 },
      { id: m5, profileId: p1, type: 'checklist', title: 'World Goals', icon: '✔', order: 1 },
    ],
    entries: [
      { id: e1, moduleId: m3, title: 'Unlock Blink', content: '', checked: true },
      { id: e2, moduleId: m3, title: 'Push wand tree', content: '', checked: false },
      { id: e3, moduleId: m4, title: 'Rotors are the choke point', content: 'Need cleaner iron + screw line split.', checked: false },
    ],
  };
}

const el = (sel) => document.querySelector(sel);
const els = (sel) => [...document.querySelectorAll(sel)];
const views = ['homeView', 'categoryView', 'gameView', 'profileView', 'favoritesView'];

function closeSidebar() { el('#sidebar').classList.add('closed'); el('#overlay').classList.add('hidden'); }
function openSidebar() { el('#sidebar').classList.remove('closed'); el('#overlay').classList.remove('hidden'); }

function formatStatus(status){ return status.replace('-', ' '); }
function steamBanner(appId){ return appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg` : ''; }
function gameBanner(game){ return game.banner || steamBanner(game.steamAppId) || ''; }
function getGame(id){ return state.data.games.find(g=>g.id===id); }
function getProfile(id){ return state.data.profiles.find(p=>p.id===id); }
function profilesForGame(gameId){ return state.data.profiles.filter(p=>p.gameId===gameId).sort((a,b)=>b.lastViewed-a.lastViewed); }
function modulesForProfile(profileId){ return state.data.modules.filter(m=>m.profileId===profileId).sort((a,b)=>a.order-b.order); }
function entriesForModule(moduleId){ return state.data.entries.filter(e=>e.moduleId===moduleId); }
function recentGames(){ return [...state.data.games].sort((a,b)=>b.lastViewed-a.lastViewed).slice(0,3); }
function favoriteGames(){ return state.data.games.filter(g=>g.favorite); }

function setView(name, idVal = null){
  state.view = { name, id: idVal };
  views.forEach(v => el('#'+v).classList.add('hidden'));
  if(name === 'home'){ el('#homeView').classList.remove('hidden'); el('#viewTitle').textContent = 'Game Codex'; }
  if(name === 'favorites'){ el('#favoritesView').classList.remove('hidden'); el('#viewTitle').textContent = 'Favorites'; }
  if(name === 'category'){ const cat = categoryById(idVal); el('#categoryView').classList.remove('hidden'); el('#viewTitle').textContent = cat?.name || 'Category'; }
  if(name === 'game'){ const game = getGame(idVal); el('#gameView').classList.remove('hidden'); el('#viewTitle').textContent = game?.title || 'Game'; }
  if(name === 'profile'){ const profile = getProfile(idVal); el('#profileView').classList.remove('hidden'); el('#viewTitle').textContent = profile?.name || 'Profile'; }
  els('.nav-btn[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === name));
  render();
}

function renderSidebar(){
  const wrap = el('#sidebarCategories');
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.innerHTML = `${cat.icon} ${cat.name}`;
    btn.onclick = () => { setView('category', cat.id); closeSidebar(); };
    wrap.appendChild(btn);
  });
}

function renderHome(){
  const search = state.search.toLowerCase();
  const filteredGames = state.data.games.filter(g => !search || g.title.toLowerCase().includes(search) || profilesForGame(g.id).some(p=>p.name.toLowerCase().includes(search)));
  const home = el('#homeView');
  home.innerHTML = `
    <section class="hero">
      <div class="hero-banner"></div>
      <div class="grid two">
        <div>
          <div class="eyebrow">v5 direction</div>
          <h3>Profiles + custom modules are in.</h3>
          <p class="muted">Games now hold multiple worlds, runs, saves, or playthroughs. Profiles hold the actual tracking. Custom fields and custom tables cover weird plugin or build-specific stuff.</p>
        </div>
        <div class="actions">
          <button class="primary-btn" onclick="openGameModal()">+ Add Game</button>
        </div>
      </div>
    </section>
    <section class="grid">
      <div class="card">
        <div class="card-head"><div><div class="eyebrow">Fast access</div><h3>Recent 3</h3></div></div>
        <div class="recent-row">${recentGames().map(gameCard).join('') || '<div class="empty">No games yet.</div>'}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="eyebrow">Your lanes</div><h3>Categories</h3></div></div>
        <div class="grid three">${CATEGORIES.map(cat => {
          const count = state.data.games.filter(g=>g.categoryId===cat.id).length;
          return `<div class="card clickable" onclick="setView('category','${cat.id}')"><div class="entry-title">${cat.icon} ${cat.name}</div><div class="muted small">${count} games</div></div>`;
        }).join('')}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="eyebrow">Matches</div><h3>${search ? 'Search results' : 'All games'}</h3></div></div>
        <div class="grid three">${filteredGames.map(gameCard).join('') || '<div class="empty">Nothing matched that search.</div>'}</div>
      </div>
    </section>`;
}

function gameCard(game){
  const cat = categoryById(game.categoryId);
  const banner = gameBanner(game);
  return `<div class="card clickable" onclick="openGame('${game.id}')">
    <div class="hero-banner" style="height:92px;${banner ? `background-image:url('${banner}')` : ''}"></div>
    <div class="entry-title">${game.title}</div>
    <div class="badges"><span class="badge">${cat?.icon || '🎮'} ${cat?.name || ''}</span><span class="badge">${formatStatus(game.status)}</span>${game.favorite ? '<span class="badge">⭐ favorite</span>' : ''}</div>
  </div>`;
}

function renderFavorites(){
  el('#favoritesView').innerHTML = `<div class="grid three">${favoriteGames().map(gameCard).join('') || '<div class="empty">No favorites yet.</div>'}</div>`;
}

function renderCategory(){
  const cat = categoryById(state.view.id);
  const games = state.data.games.filter(g => g.categoryId === state.view.id);
  el('#categoryView').innerHTML = `<div class="card"><div class="card-head"><div><div class="eyebrow">${cat?.icon || ''}</div><h3>${cat?.name || 'Category'}</h3></div><button class="primary-btn" onclick="openGameModal(null,'${state.view.id}')">+ Add Game</button></div><div class="grid three">${games.map(gameCard).join('') || '<div class="empty">No games here yet.</div>'}</div></div>`;
}

function renderGame(){
  const game = getGame(state.view.id); if(!game) return;
  game.lastViewed = now(); saveData();
  const profiles = profilesForGame(game.id);
  const cat = categoryById(game.categoryId);
  const banner = gameBanner(game);
  el('#gameView').innerHTML = `
    <section class="hero">
      <div class="hero-banner" style="${banner ? `background-image:url('${banner}')` : ''}"></div>
      <div class="card-head"><div><div class="eyebrow">${cat?.icon || ''} ${cat?.name || ''}</div><h3>${game.title}</h3></div><div class="actions"><button class="secondary-btn" onclick="toggleFavorite('${game.id}')">${game.favorite ? '★ Unfavorite' : '☆ Favorite'}</button><button class="secondary-btn" onclick="openGameModal('${game.id}')">Edit Game</button><button class="ghost-btn" onclick="deleteGame('${game.id}')">Delete Game</button></div></div>
      <div class="badges"><span class="badge">${formatStatus(game.status)}</span>${game.steamAppId ? `<span class="badge">Steam ${game.steamAppId}</span>` : ''}</div>
    </section>
    <section class="card">
      <div class="card-head"><div><div class="eyebrow">Profiles</div><h3>Worlds, runs, saves, builds</h3></div><button class="primary-btn" onclick="openProfileModal(null,'${game.id}')">+ Add Profile</button></div>
      <div class="grid two">${profiles.map(profileCard).join('') || '<div class="empty">No profiles yet. Add one and track that specific world/playthrough instead of polluting the whole game page.</div>'}</div>
    </section>`;
}

function profileCard(profile){
  return `<div class="profile-card">
    <div class="card-head"><div><div class="entry-title">${profile.name}</div><div class="muted small">${profile.type} · ${profile.status}${profile.tag ? ` · ${profile.tag}` : ''}</div></div><button class="primary-btn" onclick="event.stopPropagation(); openProfile('${profile.id}')">Open</button></div>
    <div class="row-actions"><button class="secondary-btn" onclick="openProfileModal('${profile.id}')">Edit</button><button class="ghost-btn" onclick="deleteProfile('${profile.id}')">Delete</button></div>
  </div>`;
}

function renderProfile(){
  const profile = getProfile(state.view.id); if(!profile) return;
  const game = getGame(profile.gameId); profile.lastViewed = now(); game.lastViewed = now(); saveData();
  const modules = modulesForProfile(profile.id);
  el('#profileView').innerHTML = `
    <section class="hero">
      <div class="card-head"><div><div class="eyebrow">${game.title}</div><h3>${profile.name}</h3></div><div class="actions"><button class="secondary-btn" onclick="setView('game','${game.id}')">← Back to Game</button><button class="secondary-btn" onclick="openProfileModal('${profile.id}')">Edit Profile</button><button class="primary-btn" onclick="openModuleModal(null,'${profile.id}')">+ Add Module</button></div></div>
      <div class="badges"><span class="badge">${profile.type}</span><span class="badge">${profile.status}</span>${profile.tag ? `<span class="badge">${profile.tag}</span>` : ''}</div>
    </section>
    ${modules.map(renderModule).join('') || '<div class="empty">No modules yet. Add notes, checklists, custom fields, or a custom table.</div>'}`;
}

function renderModule(module){
  const header = `<div class="module-head"><div><div class="eyebrow">${module.type}</div><h4>${module.icon || '📘'} ${module.title}</h4></div><div class="module-actions"><button class="secondary-btn" onclick="openModuleModal('${module.id}')">Edit</button><button class="ghost-btn" onclick="moveModule('${module.id}',-1)">↑</button><button class="ghost-btn" onclick="moveModule('${module.id}',1)">↓</button><button class="ghost-btn" onclick="deleteModule('${module.id}')">Delete</button></div></div>`;

  if(module.type === 'notes'){
    const entries = entriesForModule(module.id);
    return `<section class="module">${header}<div class="module-actions"><button class="primary-btn" onclick="openEntryModal(null,'${module.id}')">+ Add Entry</button></div>${entries.map(e => `<div class="entry-card"><div class="card-head"><div><div class="entry-title">${e.title}</div><div class="muted small">${e.content || 'No details yet.'}</div></div><div class="row-actions"><button class="secondary-btn" onclick="openEntryModal('${e.id}','${module.id}')">Edit</button><button class="ghost-btn" onclick="deleteEntry('${e.id}')">Delete</button></div></div></div>`).join('') || '<div class="empty">No entries yet.</div>'}</section>`;
  }

  if(module.type === 'checklist'){
    const entries = entriesForModule(module.id);
    return `<section class="module">${header}<div class="module-actions"><button class="primary-btn" onclick="openEntryModal(null,'${module.id}')">+ Add Item</button></div>${entries.map(e => `<div class="entry-card check-item"><div class="left"><input type="checkbox" ${e.checked ? 'checked' : ''} onchange="toggleCheck('${e.id}')" /><div class="${e.checked ? 'strike' : ''}">${e.title}${e.content ? `<div class='muted small'>${e.content}</div>` : ''}</div></div><div class="row-actions"><button class="secondary-btn" onclick="openEntryModal('${e.id}','${module.id}')">Edit</button><button class="ghost-btn" onclick="deleteEntry('${e.id}')">Delete</button></div></div>`).join('') || '<div class="empty">No checklist items yet.</div>'}</section>`;
  }

  if(module.type === 'custom'){
    return `<section class="module">${header}<div class="data-grid">${(module.fields || []).map(field => renderCustomField(module, field)).join('') || '<div class="empty">No fields defined.</div>'}</div></section>`;
  }

  if(module.type === 'table'){
    const cols = module.columns || [];
    return `<section class="module">${header}<div class="module-actions"><button class="primary-btn" onclick="openTableRowModal('${module.id}')">+ Add Row</button></div><div class="table-wrap">${cols.length ? `<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${(module.rows||[]).map(row => `<tr>${cols.map((c,i)=>`<td>${renderRowCell(row.values?.[i], c)}</td>`).join('')}<td><div class='row-actions'><button class='secondary-btn' onclick="openTableRowModal('${module.id}','${row.id}')">Edit</button><button class='ghost-btn' onclick="deleteTableRow('${module.id}','${row.id}')">Delete</button></div></td></tr>`).join('') || `<tr><td colspan="${cols.length+1}">No rows yet.</td></tr>`}</tbody></table>` : '<div class="empty">No columns defined.</div>'}</div></section>`;
  }
  return `<section class="module">${header}</section>`;
}

function renderRowCell(value, col){
  if(col.type === 'toggle') return value ? 'Yes' : 'No';
  return value ?? '';
}

function renderCustomField(module, field){
  const value = (module.values || {})[field.id];
  if(field.type === 'text' || field.type === 'number'){
    return `<label class="field-card"><span>${field.label}</span><input type="${field.type}" value="${escapeAttr(value ?? '')}" onchange="updateCustomField('${module.id}','${field.id}',this.value)" /></label>`;
  }
  if(field.type === 'select'){
    return `<label class="field-card"><span>${field.label}</span><select onchange="updateCustomField('${module.id}','${field.id}',this.value)">${(field.options||[]).map(opt=>`<option value="${escapeAttr(opt)}" ${opt===value ? 'selected' : ''}>${opt}</option>`).join('')}</select></label>`;
  }
  if(field.type === 'toggle'){
    return `<label class="field-card"><span>${field.label}</span><select onchange="updateCustomField('${module.id}','${field.id}',this.value === 'true')"><option value="false" ${value ? '' : 'selected'}>No</option><option value="true" ${value ? 'selected' : ''}>Yes</option></select></label>`;
  }
  return `<div class="field-card">Unsupported field</div>`;
}

function escapeAttr(v){ return String(v).replaceAll('"','&quot;'); }

function render(){
  renderSidebar();
  renderHome();
  renderFavorites();
  if(state.view.name === 'category') renderCategory();
  if(state.view.name === 'game') renderGame();
  if(state.view.name === 'profile') renderProfile();
}

function populateGameCategories(selectedId){
  el('#gameCategoryInput').innerHTML = CATEGORIES.map(c => `<option value="${c.id}" ${c.id===selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function openDialog(id){ el('#'+id).showModal(); }
function closeDialog(id){ el('#'+id).close(); }
window.setView = setView;
window.openGame = (id) => setView('game', id);
window.openProfile = (id) => setView('profile', id);

window.openGameModal = (gameId = null, categoryId = null) => {
  const game = gameId ? getGame(gameId) : null;
  el('#gameModalTitle').textContent = game ? 'Edit Game' : 'Add Game';
  el('#gameEditId').value = game?.id || '';
  el('#gameTitleInput').value = game?.title || '';
  el('#gameStatusInput').value = game?.status || 'active';
  populateGameCategories(game?.categoryId || categoryId || CATEGORIES[0].id);
  el('#gameBannerInput').value = game?.banner || '';
  el('#gameFavoriteInput').value = String(!!game?.favorite);
  el('#gameSteamInput').value = game?.steamAppId || '';
  openDialog('gameModal');
};

window.openProfileModal = (profileId = null, gameId = null) => {
  const profile = profileId ? getProfile(profileId) : null;
  el('#profileModalTitle').textContent = profile ? 'Edit Profile' : 'Add Profile';
  el('#profileEditId').value = profile?.id || '';
  el('#profileGameId').value = profile?.gameId || gameId || state.view.id || '';
  el('#profileNameInput').value = profile?.name || '';
  el('#profileTypeInput').value = profile?.type || 'world';
  el('#profileStatusInput').value = profile?.status || 'active';
  el('#profileTagInput').value = profile?.tag || '';
  openDialog('profileModal');
};

function newBuilderRow(type='field', data={}){
  const row = document.createElement('div');
  row.className = 'builder-row';
  row.innerHTML = type === 'field' ? `
    <div class="form-grid two">
      <label><span>Label</span><input class="builder-label" type="text" value="${escapeAttr(data.label || '')}" required /></label>
      <label><span>Type</span><select class="builder-type"><option value="text">Text</option><option value="number">Number</option><option value="select">Dropdown</option><option value="toggle">Toggle</option></select></label>
    </div>
    <label class="builder-options-wrap"><span>Options (comma separated for dropdown)</span><input class="builder-options" type="text" value="${escapeAttr((data.options||[]).join(', '))}" /></label>
    <div class="row-actions"><button type="button" class="ghost-btn remove-builder">Remove</button></div>
  ` : `
    <div class="form-grid two">
      <label><span>Column label</span><input class="builder-label" type="text" value="${escapeAttr(data.label || '')}" required /></label>
      <label><span>Type</span><select class="builder-type"><option value="text">Text</option><option value="number">Number</option><option value="select">Dropdown</option><option value="toggle">Toggle</option></select></label>
    </div>
    <label class="builder-options-wrap"><span>Options (comma separated for dropdown)</span><input class="builder-options" type="text" value="${escapeAttr((data.options||[]).join(', '))}" /></label>
    <div class="row-actions"><button type="button" class="ghost-btn remove-builder">Remove</button></div>
  `;
  row.querySelector('.builder-type').value = data.type || 'text';
  row.querySelector('.builder-type').onchange = (e) => {
    row.querySelector('.builder-options-wrap').style.display = e.target.value === 'select' ? 'grid' : 'none';
  };
  row.querySelector('.remove-builder').onclick = () => row.remove();
  row.querySelector('.builder-options-wrap').style.display = (data.type || 'text') === 'select' ? 'grid' : 'none';
  return row;
}

window.openModuleModal = (moduleId = null, profileId = null) => {
  const mod = moduleId ? state.data.modules.find(m=>m.id===moduleId) : null;
  el('#moduleModalTitle').textContent = mod ? 'Edit Module' : 'Add Module';
  el('#moduleEditId').value = mod?.id || '';
  el('#moduleProfileId').value = mod?.profileId || profileId || state.view.id || '';
  el('#moduleTitleInput').value = mod?.title || '';
  el('#moduleTypeInput').value = mod?.type || 'notes';
  el('#moduleIconInput').value = mod?.icon || '';
  el('#fieldBuilderList').innerHTML = '';
  el('#columnBuilderList').innerHTML = '';
  (mod?.fields || []).forEach(f => el('#fieldBuilderList').appendChild(newBuilderRow('field', f)));
  (mod?.columns || []).forEach(c => el('#columnBuilderList').appendChild(newBuilderRow('col', c)));
  toggleModuleBuilders();
  openDialog('moduleModal');
};

window.openEntryModal = (entryId = null, moduleId = null) => {
  const entry = entryId ? state.data.entries.find(e=>e.id===entryId) : null;
  el('#entryModalTitle').textContent = entry ? 'Edit Entry' : 'Add Entry';
  el('#entryEditId').value = entry?.id || '';
  el('#entryModuleId').value = entry?.moduleId || moduleId;
  el('#entryTitleInput').value = entry?.title || '';
  el('#entryContentInput').value = entry?.content || '';
  openDialog('entryModal');
};

window.openTableRowModal = (moduleId, rowId = null) => {
  const mod = state.data.modules.find(m=>m.id===moduleId);
  const row = rowId ? (mod.rows || []).find(r=>r.id===rowId) : null;
  el('#tableRowTitle').textContent = row ? 'Edit Row' : 'Add Row';
  el('#tableRowEditId').value = row?.id || '';
  el('#tableRowModuleId').value = moduleId;
  const wrap = el('#tableRowFields');
  wrap.innerHTML = '';
  (mod.columns || []).forEach((col, i) => {
    const value = row?.values?.[i];
    const label = document.createElement('label');
    label.className = 'field-card';
    label.innerHTML = `<span>${col.label}</span>`;
    let input;
    if(col.type === 'select'){
      input = document.createElement('select');
      input.innerHTML = (col.options || []).map(opt => `<option value="${escapeAttr(opt)}" ${opt===value ? 'selected' : ''}>${opt}</option>`).join('');
    } else if(col.type === 'toggle'){
      input = document.createElement('select');
      input.innerHTML = `<option value="false" ${value ? '' : 'selected'}>No</option><option value="true" ${value ? 'selected' : ''}>Yes</option>`;
    } else {
      input = document.createElement('input');
      input.type = col.type === 'number' ? 'number' : 'text';
      input.value = value ?? '';
    }
    input.dataset.colIndex = i;
    input.dataset.colType = col.type;
    label.appendChild(input);
    wrap.appendChild(label);
  });
  openDialog('tableRowModal');
};

function toggleModuleBuilders(){
  const type = el('#moduleTypeInput').value;
  el('#customFieldBuilderSection').classList.toggle('hidden', type !== 'custom');
  el('#tableBuilderSection').classList.toggle('hidden', type !== 'table');
}

window.toggleFavorite = (gameId) => {
  const game = getGame(gameId); game.favorite = !game.favorite; saveData(); render();
};
window.deleteGame = (gameId) => {
  if(!confirm('Delete this game and all profiles/modules/entries under it?')) return;
  const profileIds = state.data.profiles.filter(p=>p.gameId===gameId).map(p=>p.id);
  const moduleIds = state.data.modules.filter(m=>profileIds.includes(m.profileId)).map(m=>m.id);
  state.data.games = state.data.games.filter(g=>g.id!==gameId);
  state.data.profiles = state.data.profiles.filter(p=>p.gameId!==gameId);
  state.data.modules = state.data.modules.filter(m=>!profileIds.includes(m.profileId));
  state.data.entries = state.data.entries.filter(e=>!moduleIds.includes(e.moduleId));
  saveData(); setView('home');
};
window.deleteProfile = (profileId) => {
  if(!confirm('Delete this profile and its modules?')) return;
  const moduleIds = state.data.modules.filter(m=>m.profileId===profileId).map(m=>m.id);
  state.data.profiles = state.data.profiles.filter(p=>p.id!==profileId);
  state.data.modules = state.data.modules.filter(m=>m.profileId!==profileId);
  state.data.entries = state.data.entries.filter(e=>!moduleIds.includes(e.moduleId));
  saveData(); render();
};
window.deleteModule = (moduleId) => {
  if(!confirm('Delete this module?')) return;
  state.data.modules = state.data.modules.filter(m=>m.id!==moduleId);
  state.data.entries = state.data.entries.filter(e=>e.moduleId!==moduleId);
  saveData(); render();
};
window.deleteEntry = (entryId) => { state.data.entries = state.data.entries.filter(e=>e.id!==entryId); saveData(); render(); };
window.toggleCheck = (entryId) => { const e = state.data.entries.find(x=>x.id===entryId); e.checked = !e.checked; saveData(); render(); };
window.moveModule = (moduleId, dir) => {
  const modules = modulesForProfile(state.data.modules.find(m=>m.id===moduleId).profileId);
  const idx = modules.findIndex(m=>m.id===moduleId); const swap = modules[idx+dir]; if(!swap) return;
  const cur = modules[idx]; [cur.order, swap.order] = [swap.order, cur.order]; saveData(); render();
};
window.updateCustomField = (moduleId, fieldId, value) => {
  const mod = state.data.modules.find(m=>m.id===moduleId); if(!mod.values) mod.values = {};
  mod.values[fieldId] = value; saveData();
};
window.deleteTableRow = (moduleId,rowId) => { const mod = state.data.modules.find(m=>m.id===moduleId); mod.rows = (mod.rows||[]).filter(r=>r.id!==rowId); saveData(); render(); };

el('#gameForm').onsubmit = (e) => {
  e.preventDefault();
  const gameId = el('#gameEditId').value;
  const payload = {
    title: el('#gameTitleInput').value.trim(),
    status: el('#gameStatusInput').value,
    categoryId: el('#gameCategoryInput').value,
    banner: el('#gameBannerInput').value.trim(),
    favorite: el('#gameFavoriteInput').value === 'true',
    steamAppId: el('#gameSteamInput').value.trim(),
    lastViewed: now(),
  };
  if(gameId){ Object.assign(getGame(gameId), payload); }
  else state.data.games.push({ id: id('game'), ...payload });
  saveData(); closeDialog('gameModal'); render();
};

el('#profileForm').onsubmit = (e) => {
  e.preventDefault();
  const profileId = el('#profileEditId').value;
  const payload = {
    gameId: el('#profileGameId').value,
    name: el('#profileNameInput').value.trim(),
    type: el('#profileTypeInput').value,
    status: el('#profileStatusInput').value,
    tag: el('#profileTagInput').value.trim(),
    lastViewed: now(),
  };
  if(profileId){ Object.assign(getProfile(profileId), payload); }
  else state.data.profiles.push({ id: id('profile'), ...payload });
  saveData(); closeDialog('profileModal'); render();
};

el('#moduleForm').onsubmit = (e) => {
  e.preventDefault();
  const modId = el('#moduleEditId').value;
  const type = el('#moduleTypeInput').value;
  const base = {
    profileId: el('#moduleProfileId').value,
    title: el('#moduleTitleInput').value.trim(),
    type,
    icon: el('#moduleIconInput').value.trim(),
  };
  let extra = {};
  if(type === 'custom'){
    extra.fields = [...el('#fieldBuilderList').children].map(row => ({
      id: id('field'),
      label: row.querySelector('.builder-label').value.trim(),
      type: row.querySelector('.builder-type').value,
      options: row.querySelector('.builder-type').value === 'select' ? row.querySelector('.builder-options').value.split(',').map(s=>s.trim()).filter(Boolean) : [],
    })).filter(x=>x.label);
    if(modId){ extra.values = state.data.modules.find(m=>m.id===modId).values || {}; }
    else extra.values = {};
  }
  if(type === 'table'){
    extra.columns = [...el('#columnBuilderList').children].map(row => ({
      id: id('col'),
      label: row.querySelector('.builder-label').value.trim(),
      type: row.querySelector('.builder-type').value,
      options: row.querySelector('.builder-type').value === 'select' ? row.querySelector('.builder-options').value.split(',').map(s=>s.trim()).filter(Boolean) : [],
    })).filter(x=>x.label);
    extra.rows = modId ? state.data.modules.find(m=>m.id===modId).rows || [] : [];
  }
  if(modId){
    const mod = state.data.modules.find(m=>m.id===modId);
    Object.assign(mod, base, extra);
  } else {
    const maxOrder = Math.max(0, ...modulesForProfile(base.profileId).map(m=>m.order || 0));
    state.data.modules.push({ id: id('module'), order: maxOrder + 1, ...base, ...extra });
  }
  saveData(); closeDialog('moduleModal'); render();
};

el('#entryForm').onsubmit = (e) => {
  e.preventDefault();
  const entryId = el('#entryEditId').value;
  const payload = { moduleId: el('#entryModuleId').value, title: el('#entryTitleInput').value.trim(), content: el('#entryContentInput').value.trim() };
  if(entryId){ Object.assign(state.data.entries.find(x=>x.id===entryId), payload); }
  else state.data.entries.push({ id: id('entry'), checked: false, ...payload });
  saveData(); closeDialog('entryModal'); render();
};

el('#tableRowForm').onsubmit = (e) => {
  e.preventDefault();
  const moduleId = el('#tableRowModuleId').value;
  const mod = state.data.modules.find(m=>m.id===moduleId);
  const rowId = el('#tableRowEditId').value;
  const values = {};
  [...el('#tableRowFields').querySelectorAll('input,select')].forEach(input => {
    const idx = input.dataset.colIndex;
    values[idx] = input.dataset.colType === 'toggle' ? input.value === 'true' : input.value;
  });
  if(rowId){ Object.assign(mod.rows.find(r=>r.id===rowId), { values }); }
  else {
    if(!mod.rows) mod.rows = [];
    mod.rows.push({ id: id('row'), values });
  }
  saveData(); closeDialog('tableRowModal'); render();
};

el('#moduleTypeInput').onchange = toggleModuleBuilders;
el('#addFieldBtn').onclick = () => el('#fieldBuilderList').appendChild(newBuilderRow('field'));
el('#addColumnBtn').onclick = () => el('#columnBuilderList').appendChild(newBuilderRow('col'));

el('#openSidebarBtn').onclick = openSidebar;
el('#closeSidebarBtn').onclick = closeSidebar;
el('#overlay').onclick = closeSidebar;
els('[data-close]').forEach(btn => btn.onclick = () => closeDialog(btn.dataset.close));
els('.nav-btn[data-view]').forEach(btn => btn.onclick = () => { setView(btn.dataset.view); closeSidebar(); });
el('#addGameBtn').onclick = () => openGameModal();
el('#searchInput').oninput = (e) => { state.search = e.target.value; render(); };

el('#exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'game-codex-v5-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
};
el('#importInput').onchange = async (e) => {
  const file = e.target.files[0]; if(!file) return;
  try {
    const text = await file.text();
    state.data = JSON.parse(text);
    saveData(); render();
    alert('Backup imported.');
  } catch { alert('Import failed. Use a valid Game Codex backup JSON.'); }
};
el('#resetBtn').onclick = () => { if(confirm('Reset to demo data?')){ state.data = seedData(); saveData(); setView('home'); } };

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

render();
