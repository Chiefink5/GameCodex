
// ===== DEBUG LOGGER CORE =====
window.__DEBUG_LOGS__ = [];

function pushLog(type, args) {
  const entry = {
    type,
    args: args.map(a => {
      try {
        return typeof a === 'object'
          ? JSON.stringify(a)
          : String(a);
      } catch {
        return '[unserializable]';
      }
    }),
    time: new Date().toISOString()
  };

  window.__DEBUG_LOGS__.push(entry);

  if (window.__DEBUG_LOGS__.length > 200) {
    window.__DEBUG_LOGS__.shift();
  }

  renderDebugConsole();
}

['log', 'warn', 'error'].forEach(type => {
  const original = console[type];
  console[type] = (...args) => {
    pushLog(type, args);
    original.apply(console, args);
  };
});

window.onerror = function (msg, src, line, col, err) {
  pushLog('error', [
    'GLOBAL ERROR:',
    msg,
    `${src}:${line}:${col}`,
    err && err.stack
  ]);
};

window.onunhandledrejection = function (e) {
  pushLog('error', [
    'PROMISE ERROR:',
    e.reason && e.reason.stack ? e.reason.stack : e.reason
  ]);
};

function renderDebugConsole() {
  let el = document.getElementById('debug-console');

  if (!el) {
    el = document.createElement('div');
    el.id = 'debug-console';

    el.style.position = 'fixed';
    el.style.bottom = '0';
    el.style.left = '0';
    el.style.right = '0';
    el.style.maxHeight = '40%';
    el.style.overflowY = 'auto';
    el.style.background = 'rgba(0,0,0,0.9)';
    el.style.color = '#0f0';
    el.style.fontSize = '12px';
    el.style.zIndex = '99999';
    el.style.padding = '8px';

    document.body.appendChild(el);
  }

  el.innerHTML = window.__DEBUG_LOGS__
    .map(l => `
      <div style="margin-bottom:4px;">
        <b>[${l.type}]</b> ${l.time}<br/>
        ${l.args.join(' ')}
      </div>
    `)
    .join('');
}

(function addDebugToggle() {
  const btn = document.createElement('button');
  btn.textContent = '⚙️';
  btn.style.position = 'fixed';
  btn.style.bottom = '80px';
  btn.style.right = '20px';
  btn.style.zIndex = '100000';

  btn.onclick = () => {
    const el = document.getElementById('debug-console');
    if (el) {
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  };

  document.body.appendChild(btn);
})();


(async function(){
  const { id, slug, cap, esc, gid, clone } = window.GCUtils;
  const Storage = window.GCStorage;
  const UI = window.UI || window.GCUI || {};
  const Mods = window.GCModules;

  const TAXONOMY_TYPES = Object.keys(Mods.TRACKER_DEFS);

  const safeUI = {
    cardMarkup: (...args) => (UI.cardMarkup ? UI.cardMarkup(...args) : `<article class="card"><h3>Card</h3></article>`),
    subCardMarkup: (...args) => (UI.subCardMarkup ? UI.subCardMarkup(...args) : `<article class="card"><h3>${String(args[1] || '')}</h3></article>`),
    profileRowMarkup: (...args) => (UI.profileRowMarkup ? UI.profileRowMarkup(...args) : `<div class="item-shell"><div class="item-left"><div class="item-title">${String(args[0]?.name || 'Profile')}</div></div></div>`),
    serverRowMarkup: (...args) => (UI.serverRowMarkup ? UI.serverRowMarkup(...args) : `<div class="item-shell"><div class="item-left"><div class="item-title">${String(args[0]?.name || 'Server')}</div></div></div>`),
    archiveRowMarkup: (...args) => (UI.archiveRowMarkup ? UI.archiveRowMarkup(...args) : `<div class="item-shell"><div class="item-left"><div class="item-title">${String(args[0] || '')}</div></div></div>`),
    renderModuleMarkup: (...args) => (UI.renderModuleMarkup ? UI.renderModuleMarkup(...args) : `<div class="item-shell"><div class="item-left"><div class="muted">Module renderer unavailable.</div></div></div>`)
  };


  const defaultState = {
    theme:{gold:'#d4af37',accent:'#6c4ea5'},
    route:{name:'home',id:null},
    ui:{recent:[]},
    categories:[
      {id:id(),name:'Sandbox / Creative',icon:'🧱',color:'#d4af37'},
      {id:id(),name:'Automation / Factory',icon:'⚙️',color:'#6c4ea5'},
      {id:id(),name:'Open World RPG',icon:'🗡',color:'#4f8a64'},
      {id:id(),name:'Simulation / Systems',icon:'🖥',color:'#9a6a2d'}
    ],
    presets:[
      {id:id(),name:'Build Progression',moduleType:'fields',fields:[
        {key:'buildType',label:'Build Type',type:'select',options:['Mage','Tank','Ranger','Hybrid'],value:'Mage'},
        {key:'mainWeapon',label:'Main Weapon',type:'text',value:''},
        {key:'progress',label:'Progress %',type:'number',value:''},
        {key:'active',label:'Active Build',type:'toggle',value:false}
      ]},
      {id:id(),name:'DDS Inventory Tracker',moduleType:'table',columns:[
        {key:'item',label:'Item'},{key:'category',label:'Category'},{key:'qty',label:'Qty'},{key:'location',label:'Location'},{key:'notes',label:'Notes'}
      ]},
      {id:id(),name:'DDS Recipe Tracker',moduleType:'recipe',recipes:[]},
      {id:id(),name:'Schedule 1 Chain Tracker',moduleType:'chain',chains:[]}
    ],
    games:[], profiles:[], servers:[], modules:[]
  };

  TAXONOMY_TYPES.forEach(t => {
    defaultState.presets.push({ id:id(), name: Mods.TRACKER_DEFS[t].label, moduleType:t, entries:[], view:{filter:'',sort:'recent'} });
  });

  let state = normalizeState(await Storage.migrateFromLocalStorage(clone(defaultState)));
  if (!state.games.length) seedState();

  const el = {
    bootError: gid('bootError'),
    sidebar: gid('sidebar'),
    scrim: gid('scrim'),
    menuBtn: gid('menuBtn'),
    addGameBtn: gid('addGameBtn'),
    addCategoryBtn: gid('addCategoryBtn'),
    exportBtn: gid('exportBtn'),
    importInput: gid('importInput'),
    categoryList: gid('categoryList'),
    view: gid('view'),
    modal: gid('modal')
  };

  window.GCApp = { categoryById, gameById, profileById, serverById, profilesForGame, serversForGame, modulesFor };

  bindGlobal();
  render();

  function seedState(){
    const dds = {id:id(),title:'Drug Dealer Simulator',categoryId:state.categories[3].id,favorite:true,archived:false,supportsProfiles:true,supportsServers:false,status:'active',steamAppId:'',banner:''};
    const s1 = {id:id(),title:'Schedule I',categoryId:state.categories[3].id,favorite:false,archived:false,supportsProfiles:true,supportsServers:false,status:'active',steamAppId:'',banner:''};
    state.games.push(dds, s1);

    const ddsProfile = {id:id(),gameId:dds.id,name:'Main Save',type:'save',status:'active',archived:false,favorite:false};
    const s1Profile = {id:id(),gameId:s1.id,name:'Main Run',type:'save',status:'active',archived:false,favorite:false};
    state.profiles.push(ddsProfile, s1Profile);

    state.modules.push(
      {id:id(),ownerType:'profile',ownerId:ddsProfile.id,moduleType:'recipe',title:'Drugs',recipes:[
        {id:id(),name:'Coke',base:'Coke',quantity:'12 bags',notes:'Strong but risky',ingredients:[
          {id:id(),name:'Coke',percent:75,notes:''},
          {id:id(),name:'Baking Soda',percent:15,notes:''},
          {id:id(),name:'Meth',percent:5,notes:''},
          {id:id(),name:'Fentanyl',percent:5,notes:''}
        ]}
      ]},
      {id:id(),ownerType:'profile',ownerId:s1Profile.id,moduleType:'chain',title:'Recipe Chains',chains:[
        {id:id(),name:'OG Kush Mix',startProduct:'OG Kush',finalProduct:'Moonlight OG',sellPrice:'$140',notes:'Simple seeded example',steps:[
          {id:id(),ingredient:'Cuke',result:'OG Kush + Cuke',notes:''},
          {id:id(),ingredient:'Donut',result:'Moonlight OG',notes:''}
        ]}
      ]},
      {id:id(),ownerType:'profile',ownerId:ddsProfile.id,moduleType:'economy',title:'Profit Tracking',entries:[
        {id:id(),item:'Sample Sale',cost:50,revenue:90,roi:80,notes:'Seeded example'}
      ],view:{filter:'',sort:'recent'}}
    );
    persist();
  }

  function bindGlobal(){
    el.menuBtn.onclick = toggleSidebar;
    el.scrim.onclick = closeSidebar;
    el.addGameBtn.onclick = () => openGameForm();
    el.addCategoryBtn.onclick = () => openCategoryForm();
    el.exportBtn.onclick = exportData;
    el.importInput.onchange = importData;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.onclick = () => navigate(btn.dataset.route));
    window.addEventListener('error', (e) => showBootError(formatError('App error', e.error || e.message || e)));
    window.addEventListener('unhandledrejection', (e) => showBootError(formatError('Unhandled promise rejection', e.reason)));
  }

  function formatError(prefix, err){
    const msg = err?.stack || err?.message || String(err || 'Unknown error');
    return `${prefix}: ${msg}`;
  }

  function showBootError(msg){
    if (!el.bootError) return;
    el.bootError.textContent = msg;
    el.bootError.classList.remove('hidden');
  }

  function render(){
    applyTheme();
    renderSidebar();
    const r = state.route;
    if (r.name === 'home') renderHome();
    else if (r.name === 'category') renderCategory(r.id);
    else if (r.name === 'game') renderGame(r.id);
    else if (r.name === 'profile') renderProfile(r.id);
    else if (r.name === 'server') renderServer(r.id);
    else if (r.name === 'archive') renderArchive();
    else if (r.name === 'presets') renderPresets();
    else if (r.name === 'settings') renderSettings();
    else renderHome();
    persist();
  }

  function renderSidebar(){
    el.categoryList.innerHTML = state.categories.map(c => `<button class="category-chip" data-open-category="${c.id}"><span>${c.icon} ${esc(c.name)}</span><span>›</span></button>`).join('');
    document.querySelectorAll('[data-open-category]').forEach(b => b.onclick = () => navigate('category', b.dataset.openCategory));
  }

  function renderHome(){
    const lastEditedCard = renderLastEditedCard();

    const activeGames = state.games.filter(g => !g.archived);
    el.view.innerHTML = `
      <section class="panel">
        <div class="hero">
          <div class="panel-title">
            <div class="eyebrow">Royal game archive</div>
            <h2 class="hero-title">Your worlds, runs, builds, and servers</h2>
            <div class="muted">Universal tracking engine expansion installed.</div>
          </div>
          <div class="inline-actions">
            <button id="quickAddGame" class="gold-btn">+ Add Game</button>
            <button id="quickAddCategory" class="ghost-btn">+ Category</button>
          </div>
        </div>
      </section>
      <section class="kpi-grid">
        <div class="kpi"><div class="muted">Tracked Games</div><div class="kpi-value">${activeGames.length}</div></div>
        <div class="kpi"><div class="muted">Profiles</div><div class="kpi-value">${state.profiles.filter(p => !p.archived).length}</div></div>
        <div class="kpi"><div class="muted">Servers</div><div class="kpi-value">${state.servers.filter(s => !s.archived).length}</div></div>
        <div class="kpi"><div class="muted">Module Types</div><div class="kpi-value">${4 + 2 + TAXONOMY_TYPES.length}</div></div>
      </section>
      <section class="panel">
        <div class="panel-title"><h3>Last Edited</h3><div class="muted">Jump back to the last thing you changed.</div></div>
        <div class="grid" style="margin-top:14px">${lastEditedCard}</div>
      </section>
      <section class="panel">
        <div class="panel-title"><h3>Find Games</h3><div class="muted">Search, filter, sort.</div></div>
        <div class="filters" style="margin-top:14px">
          <input id="homeSearch" placeholder="Search games..." />
          <select id="homeCategory"><option value="">All categories</option>${state.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
          <select id="homeStatus"><option value="">All statuses</option>${['active','planning','paused','completed','wishlist','dropped'].map(v => `<option value="${v}">${cap(v)}</option>`).join('')}</select>
          <select id="homeSort"><option value="recent">Sort: Recent</option><option value="title">Sort: Title</option><option value="profiles">Sort: Profile Count</option><option value="servers">Sort: Server Count</option></select>
        </div>
        <div id="homeResults" class="grid" style="margin-top:14px"></div>
      </section>`;
    gid('quickAddGame').onclick = () => openGameForm();
    gid('quickAddCategory').onclick = () => openCategoryForm();
    ['homeSearch','homeCategory','homeStatus','homeSort'].forEach(i => { gid(i).oninput = update; gid(i).onchange = update; });
    update();
    function update(){
      const q = gid('homeSearch').value.trim().toLowerCase();
      const cat = gid('homeCategory').value;
      const status = gid('homeStatus').value;
      const sort = gid('homeSort').value;
      let list = activeGames.filter(g => (!q || g.title.toLowerCase().includes(q)) && (!cat || g.categoryId === cat) && (!status || g.status === status));
      if (sort === 'title') list.sort((a,b) => a.title.localeCompare(b.title));
      if (sort === 'profiles') list.sort((a,b) => profilesForGame(b.id).length - profilesForGame(a.id).length);
      if (sort === 'servers') list.sort((a,b) => serversForGame(b.id).length - serversForGame(a.id).length);
      gid('homeResults').innerHTML = list.map(g => safeUI.cardMarkup(g, window.GCApp)).join('') || `<div class="card"><h3>No matches</h3><div class="muted">Try a different filter.</div></div>`;
      bindDynamic();
    }
  }

  function renderCategory(id){
    const c = categoryById(id); if (!c) return navigate('home');
    const games = state.games.filter(g => g.categoryId === id && !g.archived);
    el.view.innerHTML = `<section class="panel"><div class="hero"><div class="panel-title"><div class="eyebrow">Category chamber</div><h2 class="hero-title">${c.icon} ${esc(c.name)}</h2><div class="muted">Manage games in this lane.</div></div><div class="inline-actions"><button id="editCategoryBtn" class="ghost-btn">Edit</button><button id="addGameToCategoryBtn" class="gold-btn">+ Game</button></div></div></section><section class="grid">${games.map(g => safeUI.cardMarkup(g, window.GCApp)).join('') || `<div class="card"><h3>No games yet</h3></div>`}</section>`;
    gid('editCategoryBtn').onclick = () => openCategoryForm(c);
    gid('addGameToCategoryBtn').onclick = () => openGameForm(null, { categoryId:c.id });
    bindDynamic();
  }

  function renderGame(id){
    const g = gameById(id); if (!g) return navigate('home');
    touchRecent('game', g.id);
    const c = categoryById(g.categoryId), profiles = profilesForGame(g.id).filter(p => !p.archived), servers = serversForGame(g.id).filter(s => !s.archived);
    el.view.innerHTML = `<section class="panel"><div class="hero"><div class="panel-title"><div class="eyebrow">Game chamber</div><h2 class="hero-title">${esc(g.title)} ${g.favorite ? '<span class="favorite">★</span>' : ''}</h2><div class="tag-row"><span class="stat-chip">${c?.icon || '📁'} ${esc(c?.name || 'Unknown')}</span><span class="stat-chip">${cap(g.status || 'active')}</span>${g.supportsProfiles ? '<span class="stat-chip">Profiles On</span>' : ''}${g.supportsServers ? '<span class="stat-chip">Servers On</span>' : ''}</div></div><div class="inline-actions"><button id="toggleFavoriteGameBtn" class="ghost-btn">${g.favorite ? '★ Unfavorite' : '☆ Favorite'}</button><button id="editGameBtn" class="ghost-btn">Edit</button><button id="archiveGameBtn" class="danger-btn">${g.archived ? 'Restore' : 'Archive'}</button></div></div></section>${g.supportsProfiles ? `<section class="panel"><div class="section-head"><div class="panel-title"><h3>Profiles</h3><div class="muted">Worlds, runs, saves, builds.</div></div><button id="addProfileBtn" class="gold-btn">+ Add Profile</button></div><div class="list" style="margin-top:14px">${profiles.map(p => safeUI.profileRowMarkup(p)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No profiles yet.</div></div></div>`}</div></section>` : ''}${g.supportsServers ? `<section class="panel"><div class="section-head"><div class="panel-title"><h3>Servers</h3><div class="muted">Planning spaces for SMPs and more.</div></div><button id="addServerBtn" class="gold-btn">+ Create Server</button></div><div class="list" style="margin-top:14px">${servers.map(s => safeUI.serverRowMarkup(s)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No servers yet.</div></div></div>`}</div></section>` : ''}`;
    gid('toggleFavoriteGameBtn').onclick = () => { g.favorite = !g.favorite; persist(); render(); };
    gid('editGameBtn').onclick = () => openGameForm(g);
    gid('archiveGameBtn').onclick = () => { g.archived = !g.archived; persist(); navigate(g.archived ? 'archive' : 'game', g.id); };
    if (g.supportsProfiles) gid('addProfileBtn').onclick = () => openProfileForm(g.id);
    if (g.supportsServers) gid('addServerBtn').onclick = () => openServerForm(g.id);
    bindDynamic();
  }

  function renderProfile(id){
    const p = profileById(id); if (!p) return navigate('home');
    touchRecent('profile', p.id);
    const g = gameById(p.gameId), mods = modulesFor('profile', p.id);
    el.view.innerHTML = `<section class="panel"><div class="hero"><div class="panel-title"><div class="eyebrow">Profile chamber</div><h2 class="hero-title">${esc(p.name)}</h2><div class="tag-row"><span class="stat-chip">${esc(p.type || 'Profile')}</span><span class="stat-chip">${cap(p.status || 'active')}</span><span class="stat-chip">${esc(g?.title || '')}</span></div></div><div class="inline-actions"><button id="editProfileBtn" class="ghost-btn">Edit</button><button id="cloneProfileBtn" class="ghost-btn">Clone</button><button id="archiveProfileBtn" class="danger-btn">${p.archived ? 'Restore' : 'Archive'}</button></div></div></section><section class="panel"><div class="section-head"><div class="panel-title"><h3>Modules</h3><div class="muted">Additive expansion only — all original systems preserved.</div></div><div class="inline-actions"><button id="addPresetModuleBtn" class="ghost-btn">+ From Preset</button><button id="addModuleBtn" class="gold-btn">+ Add Module</button></div></div><div class="list" style="margin-top:14px">${mods.map(m => safeUI.renderModuleMarkup(m)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No modules yet.</div></div></div>`}</div></section>`;
    gid('editProfileBtn').onclick = () => openProfileForm(p.gameId, p);
    gid('cloneProfileBtn').onclick = () => cloneProfile(p);
    gid('archiveProfileBtn').onclick = () => { p.archived = !p.archived; persist(); navigate(p.archived ? 'archive' : 'profile', p.id); };
    gid('addModuleBtn').onclick = () => openModuleForm('profile', p.id);
    gid('addPresetModuleBtn').onclick = () => openPresetPicker('profile', p.id);
    bindDynamic();
  }

  function renderServer(id){
    const s = serverById(id); if (!s) return navigate('home');
    touchRecent('server', s.id);
    const g = gameById(s.gameId), mods = modulesFor('server', s.id);
    el.view.innerHTML = `<section class="panel"><div class="hero"><div class="panel-title"><div class="eyebrow">Server chamber</div><h2 class="hero-title">${esc(s.name)}</h2><div class="tag-row"><span class="stat-chip">Server</span><span class="stat-chip">${esc(s.template || 'Blank')}</span><span class="stat-chip">${cap(s.status || 'planning')}</span><span class="stat-chip">${esc(g?.title || '')}</span></div></div><div class="inline-actions"><button id="editServerBtn" class="ghost-btn">Edit</button><button id="cloneServerBtn" class="ghost-btn">Clone</button><button id="archiveServerBtn" class="danger-btn">${s.archived ? 'Restore' : 'Archive'}</button></div></div></section><section class="panel"><div class="section-head"><div class="panel-title"><h3>Server Modules</h3><div class="muted">Works independently or alongside every other module.</div></div><div class="inline-actions"><button id="addServerPresetModuleBtn" class="ghost-btn">+ From Preset</button><button id="addServerModuleBtn" class="gold-btn">+ Add Module</button></div></div><div class="list" style="margin-top:14px">${mods.map(m => safeUI.renderModuleMarkup(m)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No modules yet.</div></div></div>`}</div></section>`;
    gid('editServerBtn').onclick = () => openServerForm(s.gameId, s);
    gid('cloneServerBtn').onclick = () => cloneServer(s);
    gid('archiveServerBtn').onclick = () => { s.archived = !s.archived; persist(); navigate(s.archived ? 'archive' : 'server', s.id); };
    gid('addServerModuleBtn').onclick = () => openModuleForm('server', s.id);
    gid('addServerPresetModuleBtn').onclick = () => openPresetPicker('server', s.id);
    bindDynamic();
  }

  function renderArchive(){
    el.view.innerHTML = `<section class="panel"><div class="panel-title"><div class="eyebrow">Archive vault</div><h2 class="hero-title">Archive</h2><div class="muted">Old stuff without deleting it.</div></div></section><section class="panel"><div class="panel-title"><h3>Games</h3></div><div class="list" style="margin-top:14px">${state.games.filter(g => g.archived).map(g => safeUI.archiveRowMarkup(g.title, categoryById(g.categoryId)?.name || '', 'game', g.id)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No archived games.</div></div></div>`}</div></section><section class="panel"><div class="panel-title"><h3>Profiles</h3></div><div class="list" style="margin-top:14px">${state.profiles.filter(p => p.archived).map(p => safeUI.archiveRowMarkup(p.name, gameById(p.gameId)?.title || '', 'profile', p.id)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No archived profiles.</div></div></div>`}</div></section><section class="panel"><div class="panel-title"><h3>Servers</h3></div><div class="list" style="margin-top:14px">${state.servers.filter(s => s.archived).map(s => safeUI.archiveRowMarkup(s.name, gameById(s.gameId)?.title || '', 'server', s.id)).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No archived servers.</div></div></div>`}</div></section>`;
    bindDynamic();
  }

  function renderPresets(){
    el.view.innerHTML = `<section class="panel"><div class="panel-title"><div class="eyebrow">Preset vault</div><h2 class="hero-title">Module Presets</h2><div class="muted">Expanded taxonomy included.</div></div><div class="list" style="margin-top:14px">${state.presets.map(p => `<div class="item-shell"><div class="item-left"><div class="item-title">${esc(p.name)}</div><div class="muted">${esc(p.moduleType)}</div></div><div class="inline-actions"><button class="ghost-btn" data-edit-preset="${p.id}">Edit</button><button class="danger-btn" data-delete-preset="${p.id}">Delete</button></div></div>`).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No presets yet.</div></div></div>`}</div></section>`;
    bindDynamic();
  }

  function renderSettings(){
    el.view.innerHTML = `<section class="panel"><div class="panel-title"><div class="eyebrow">Royal styling</div><h2 class="hero-title">Theme Editor</h2><div class="muted">Tune the gold and accent color.</div></div><div class="field-grid" style="margin-top:14px"><label><div class="small-note">Gold Accent</div><input id="themeGoldInput" type="color" value="${esc(state.theme.gold)}" /></label><label><div class="small-note">Accent Color</div><input id="themeAccentInput" type="color" value="${esc(state.theme.accent)}" /></label></div><div class="inline-actions" style="margin-top:14px"><button id="saveThemeBtn" class="gold-btn">Save Theme</button></div></section>`;
    gid('saveThemeBtn').onclick = () => { state.theme.gold = gid('themeGoldInput').value; state.theme.accent = gid('themeAccentInput').value; persist(); render(); };
  }

  function bindDynamic(){
    document.querySelectorAll('[data-open-game]').forEach(b => b.onclick = () => navigate('game', b.dataset.openGame));
    document.querySelectorAll('[data-open-profile]').forEach(b => b.onclick = () => navigate('profile', b.dataset.openProfile));
    document.querySelectorAll('[data-open-server]').forEach(b => b.onclick = () => navigate('server', b.dataset.openServer));
    document.querySelectorAll('[data-restore-item]').forEach(b => b.onclick = () => {
      const [t,i] = b.dataset.restoreItem.split(':');
      const o = t === 'game' ? gameById(i) : t === 'profile' ? profileById(i) : serverById(i);
      if (!o) return; o.archived = false; persist(); render();
    });
    document.querySelectorAll('[data-edit-preset]').forEach(b => b.onclick = () => openPresetEditor(b.dataset.editPreset));
    document.querySelectorAll('[data-delete-preset]').forEach(b => b.onclick = () => { state.presets = state.presets.filter(p => p.id !== b.dataset.deletePreset); persist(); render(); });
    document.querySelectorAll('[data-edit-module]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.editModule); if (m) openModuleForm(m.ownerType, m.ownerId, m); });
    document.querySelectorAll('[data-toggle-check]').forEach(inp => inp.onchange = () => {
      const [mid,iid] = inp.dataset.toggleCheck.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const item = m.items.find(i => i.id === iid); if (!item) return; item.done = inp.checked; persist(); render();
    });
    document.querySelectorAll('[data-add-check-item]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.addCheckItem); if (m) openChecklistItemForm(m); });
    document.querySelectorAll('[data-delete-check-item]').forEach(b => b.onclick = () => {
      const [mid,iid] = b.dataset.deleteCheckItem.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; m.items = m.items.filter(i => i.id !== iid); persist(); render();
    });
    document.querySelectorAll('[data-edit-columns]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.editColumns); if (m) openTableColumnsForm(m); });
    document.querySelectorAll('[data-add-row]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.addRow); if (m) openTableRowForm(m); });
    document.querySelectorAll('[data-delete-row]').forEach(b => b.onclick = () => {
      const [mid,rid] = b.dataset.deleteRow.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; m.rows = m.rows.filter(r => r.id !== rid); persist(); render();
    });
    document.querySelectorAll('[data-add-field]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.addField); if (m) openFieldForm(m); });
    document.querySelectorAll('[data-field-input]').forEach(inp => inp.onchange = () => {
      const [mid,key,type] = inp.dataset.fieldInput.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const f = m.fields.find(x => x.key === key); if (!f) return; f.value = type === 'toggle' ? inp.checked : inp.value; persist(); render();
    });

    document.querySelectorAll('[data-add-recipe]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.addRecipe); if (m) openRecipeForm(m); });
    document.querySelectorAll('[data-edit-recipe]').forEach(b => b.onclick = () => {
      const [mid,rid] = b.dataset.editRecipe.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const recipe = m.recipes.find(r => r.id === rid); if (recipe) openRecipeForm(m, recipe);
    });
    document.querySelectorAll('[data-delete-recipe]').forEach(b => b.onclick = () => {
      const [mid,rid] = b.dataset.deleteRecipe.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; m.recipes = m.recipes.filter(r => r.id !== rid); persist(); render();
    });
    document.querySelectorAll('[data-add-ingredient]').forEach(b => b.onclick = () => {
      const [mid,rid] = b.dataset.addIngredient.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const recipe = m.recipes.find(r => r.id === rid); if (recipe) openIngredientForm(recipe, m);
    });
    document.querySelectorAll('[data-delete-ingredient]').forEach(b => b.onclick = () => {
      const [mid,rid,iid] = b.dataset.deleteIngredient.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const recipe = m.recipes.find(r => r.id === rid); if (!recipe) return; recipe.ingredients = recipe.ingredients.filter(i => i.id !== iid); persist(); render();
    });

    document.querySelectorAll('[data-add-chain]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.addChain); if (m) openChainForm(m); });
    document.querySelectorAll('[data-edit-chain]').forEach(b => b.onclick = () => {
      const [mid,cid] = b.dataset.editChain.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const chain = m.chains.find(c => c.id === cid); if (chain) openChainForm(m, chain);
    });
    document.querySelectorAll('[data-delete-chain]').forEach(b => b.onclick = () => {
      const [mid,cid] = b.dataset.deleteChain.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; m.chains = m.chains.filter(c => c.id !== cid); persist(); render();
    });
    document.querySelectorAll('[data-add-step]').forEach(b => b.onclick = () => {
      const [mid,cid] = b.dataset.addStep.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const chain = m.chains.find(c => c.id === cid); if (chain) openStepForm(chain, m);
    });
    document.querySelectorAll('[data-delete-step]').forEach(b => b.onclick = () => {
      const [mid,cid,sid] = b.dataset.deleteStep.split(':'); const m = state.modules.find(x => x.id === mid); if (!m) return; const chain = m.chains.find(c => c.id === cid); if (!chain) return; chain.steps = chain.steps.filter(s => s.id !== sid); persist(); render();
    });

    document.querySelectorAll('[data-add-tracker-entry]').forEach(b => b.onclick = () => { const m = state.modules.find(x => x.id === b.dataset.addTrackerEntry); if (m) openTrackerEntryForm(m); });
    document.querySelectorAll('[data-edit-tracker-entry]').forEach(b => b.onclick = () => {
      const [mid,eid] = b.dataset.editTrackerEntry.split(':'); const m = state.modules.find(x => x.id === mid); const e = m?.entries?.find(x => x.id === eid); if (m && e) openTrackerEntryForm(m, e);
    });
    document.querySelectorAll('[data-delete-tracker-entry]').forEach(b => b.onclick = () => {
      const [mid,eid] = b.dataset.deleteTrackerEntry.split(':'); const m = state.modules.find(x => x.id === mid); if (m) { m.entries = m.entries.filter(e => e.id !== eid); persist(); render(); }
    });
    document.querySelectorAll('[data-tracker-filter]').forEach(inp => inp.oninput = () => {
      const m = state.modules.find(x => x.id === inp.dataset.trackerFilter); if (m) { m.view.filter = inp.value; persist(); render(); }
    });
    document.querySelectorAll('[data-tracker-sort]').forEach(sel => sel.onchange = () => {
      const m = state.modules.find(x => x.id === sel.dataset.trackerSort); if (m) { m.view.sort = sel.value; persist(); render(); }
    });
  }

  function openCategoryForm(c=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${c ? 'Edit Category' : 'Add Category'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Name</div><input id="categoryNameInput" value="${esc(c?.name || '')}" /></label><label><div class="small-note">Icon</div><select id="categoryIconInput">${ICONS.map(i => `<option ${c?.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select></label><label><div class="small-note">Accent Color</div><select id="categoryColorInput">${COLORS.map(v => `<option value="${v}" ${c?.color === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><div class="modal-actions">${c ? '<button id="deleteCategoryBtn" class="danger-btn">Delete</button>' : '<span></span>'}<div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveCategoryBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveCategoryBtn').onclick = () => {
      const p = { name:gid('categoryNameInput').value.trim(), icon:gid('categoryIconInput').value, color:gid('categoryColorInput').value };
      if (!p.name) return;
      if (c) Object.assign(c, p); else state.categories.push({ id:id(), ...p });
      persist(); closeModal(); render();
    };
    if (c) gid('deleteCategoryBtn').onclick = () => {
      const fb = state.categories.find(x => x.id !== c.id); if (!fb) return alert('Need at least one category.');
      state.games.filter(g => g.categoryId === c.id).forEach(g => g.categoryId = fb.id);
      state.categories = state.categories.filter(x => x.id !== c.id); persist(); closeModal(); render();
    };
  }

  function openGameForm(g=null, defaults={}){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${g ? 'Edit Game' : 'Add Game'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Title</div><input id="gameTitleInput" value="${esc(g?.title || '')}" /></label><label><div class="small-note">Category</div><select id="gameCategoryInput">${state.categories.map(c => `<option value="${c.id}" ${(g?.categoryId || defaults.categoryId) === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label><label><div class="small-note">Status</div><select id="gameStatusInput">${['active','planning','paused','completed','wishlist','dropped'].map(v => `<option value="${v}" ${(g?.status || 'active') === v ? 'selected' : ''}>${cap(v)}</option>`).join('')}</select></label></div><div class="field-grid"><label><input id="gameProfilesToggle" type="checkbox" ${(g?.supportsProfiles ?? true) ? 'checked' : ''} /> Allow Profiles</label><label><input id="gameServersToggle" type="checkbox" ${(g?.supportsServers || false) ? 'checked' : ''} /> Allow Servers</label><label><input id="gameFavoriteToggle" type="checkbox" ${(g?.favorite || false) ? 'checked' : ''} /> Favorite</label></div><div class="modal-actions">${g ? '<button id="deleteGameBtn" class="danger-btn">Delete</button>' : '<span></span>'}<div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveGameBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveGameBtn').onclick = () => {
      const p = { title:gid('gameTitleInput').value.trim(), categoryId:gid('gameCategoryInput').value, status:gid('gameStatusInput').value, supportsProfiles:gid('gameProfilesToggle').checked, supportsServers:gid('gameServersToggle').checked, favorite:gid('gameFavoriteToggle').checked, archived:g?.archived || false, steamAppId:g?.steamAppId || '', banner:g?.banner || '' };
      if (!p.title) return;
      if (g) Object.assign(g, p); else state.games.push({ id:id(), ...p });
      setLastEdited('game', g ? g.id : state.games[state.games.length - 1].id);
      persist(); closeModal(); render();
    };
    if (g) gid('deleteGameBtn').onclick = () => {
      state.games = state.games.filter(x => x.id !== g.id);
      state.profiles = state.profiles.filter(x => x.gameId !== g.id);
      state.servers = state.servers.filter(x => x.gameId !== g.id);
      state.modules = state.modules.filter(m => {
        if (m.ownerType === 'profile') return state.profiles.some(p => p.id === m.ownerId);
        if (m.ownerType === 'server') return state.servers.some(s => s.id === m.ownerId);
        return true;
      });
      persist(); closeModal(); navigate('home');
    };
  }

  function openProfileForm(gameId, p=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${p ? 'Edit Profile' : 'Add Profile'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Name</div><input id="profileNameInput" value="${esc(p?.name || '')}" /></label><label><div class="small-note">Type</div><select id="profileTypeInput">${['world','playthrough','save','run','build','custom'].map(v => `<option value="${v}" ${(p?.type || 'world') === v ? 'selected' : ''}>${cap(v)}</option>`).join('')}</select></label><label><div class="small-note">Status</div><select id="profileStatusInput">${['active','planning','paused','finished','abandoned'].map(v => `<option value="${v}" ${(p?.status || 'active') === v ? 'selected' : ''}>${cap(v)}</option>`).join('')}</select></label></div><div class="modal-actions">${p ? '<button id="deleteProfileBtn" class="danger-btn">Delete</button>' : '<span></span>'}<div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveProfileBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveProfileBtn').onclick = () => {
      const data = { gameId, name:gid('profileNameInput').value.trim(), type:gid('profileTypeInput').value, status:gid('profileStatusInput').value, archived:p?.archived || false, favorite:p?.favorite || false };
      if (!data.name) return;
      if (p) Object.assign(p, data); else state.profiles.push({ id:id(), ...data });
      setLastEdited('profile', p ? p.id : state.profiles[state.profiles.length - 1].id);
      persist(); closeModal(); render();
    };
    if (p) gid('deleteProfileBtn').onclick = () => {
      state.profiles = state.profiles.filter(x => x.id !== p.id);
      state.modules = state.modules.filter(m => !(m.ownerType === 'profile' && m.ownerId === p.id));
      persist(); closeModal(); navigate('game', gameId);
    };
  }

  function openServerForm(gameId, s=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${s ? 'Edit Server' : 'Create Server'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Name</div><input id="serverNameInput" value="${esc(s?.name || '')}" /></label><label><div class="small-note">Template</div><select id="serverTemplateInput">${['Blank Server','SMP','RPG','Economy','Modded'].map(v => `<option ${(s?.template || 'SMP') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label><div class="small-note">Status</div><select id="serverStatusInput">${['planning','active','paused','finished'].map(v => `<option value="${v}" ${(s?.status || 'planning') === v ? 'selected' : ''}>${cap(v)}</option>`).join('')}</select></label></div><div class="modal-actions">${s ? '<button id="deleteServerBtn" class="danger-btn">Delete</button>' : '<span></span>'}<div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveServerBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveServerBtn').onclick = () => {
      const data = { gameId, name:gid('serverNameInput').value.trim(), template:gid('serverTemplateInput').value, status:gid('serverStatusInput').value, archived:s?.archived || false, favorite:s?.favorite || false };
      if (!data.name) return;
      if (s) Object.assign(s, data); else state.servers.push({ id:id(), ...data });
      setLastEdited('server', s ? s.id : state.servers[state.servers.length - 1].id);
      persist(); closeModal(); render();
    };
    if (s) gid('deleteServerBtn').onclick = () => {
      state.servers = state.servers.filter(x => x.id !== s.id);
      state.modules = state.modules.filter(m => !(m.ownerType === 'server' && m.ownerId === s.id));
      persist(); closeModal(); navigate('game', gameId);
    };
  }

  function ensureModuleShape(mod){
    if (mod.moduleType === 'notes' && !('content' in mod)) mod.content = '';
    if (mod.moduleType === 'checklist' && !mod.items) mod.items = [];
    if (mod.moduleType === 'table') { if (!mod.columns) mod.columns = [{key:'col1',label:'Column 1'}]; if (!mod.rows) mod.rows = []; }
    if (mod.moduleType === 'fields' && !mod.fields) mod.fields = [];
    if (mod.moduleType === 'recipe' && !mod.recipes) mod.recipes = [];
    if (mod.moduleType === 'chain' && !mod.chains) mod.chains = [];
    if (Mods.isTrackerType(mod.moduleType)) Mods.ensureTrackerModule(mod);
  }


  function normalizeState(nextState){
    const merged = Object.assign(clone(defaultState), nextState || {});
    merged.theme = Object.assign({}, defaultState.theme, merged.theme || {});
    merged.route = Object.assign({}, defaultState.route, merged.route || {});
    merged.ui = Object.assign({ recent: [], lastEdited: null }, merged.ui || {});
    merged.ui.recent = Array.isArray(merged.ui.recent) ? merged.ui.recent.slice(0, 1) : [];
    merged.categories = Array.isArray(merged.categories) ? merged.categories : [];
    merged.games = Array.isArray(merged.games) ? merged.games : [];
    merged.profiles = Array.isArray(merged.profiles) ? merged.profiles : [];
    merged.servers = Array.isArray(merged.servers) ? merged.servers : [];
    merged.modules = Array.isArray(merged.modules) ? merged.modules : [];
    merged.presets = Array.isArray(merged.presets) ? merged.presets : [];

    merged.modules.forEach(ensureModuleShape);
    merged.presets.forEach(ensureModuleShape);

    const validRoutes = new Set(['home', 'category', 'game', 'profile', 'server', 'archive', 'presets', 'settings']);
    if (!validRoutes.has(merged.route.name)) merged.route = { name: 'home', id: null };

    return merged;
  }

  function openModuleForm(ownerType, ownerId, m=null){
    const typeOptions = ['notes','checklist','table','fields','recipe','chain'].concat(TAXONOMY_TYPES)
      .map(v => `<option value="${v}" ${(m?.moduleType || 'notes') === v ? 'selected' : ''}>${Mods.TRACKER_DEFS[v]?.label || cap(v)}</option>`).join('');
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${m ? 'Edit Module' : 'Add Module'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Title</div><input id="moduleTitleInput" value="${esc(m?.title || '')}" /></label><label><div class="small-note">Type</div><select id="moduleTypeInput">${typeOptions}</select></label></div><div class="modal-actions">${m ? '<button id="deleteModuleBtn" class="danger-btn">Delete</button>' : '<span></span>'}<div class="modal-right-actions">${m ? '<button id="saveAsPresetBtn" class="ghost-btn">Save as Preset</button>' : ''}<button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveModuleBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveModuleBtn').onclick = () => {
      const type = gid('moduleTypeInput').value;
      const title = gid('moduleTitleInput').value.trim() || (Mods.TRACKER_DEFS[type]?.label || 'Untitled Module');
      if (m){
        m.title = title; m.moduleType = type; ensureModuleShape(m);
      } else {
        let fresh;
        if (Mods.isTrackerType(type)) fresh = Mods.createTrackerModule(type, title, id);
        else fresh = { id:id(), ownerType, ownerId, moduleType:type, title };
        fresh.ownerType = ownerType; fresh.ownerId = ownerId;
        ensureModuleShape(fresh);
        state.modules.push(fresh);
      }
      persist(); closeModal(); render();
    };
    if (m){
      gid('deleteModuleBtn').onclick = () => { state.modules = state.modules.filter(x => x.id !== m.id); persist(); closeModal(); render(); };
      gid('saveAsPresetBtn').onclick = () => {
        const preset = clone(m); preset.id = id(); delete preset.ownerId; delete preset.ownerType; preset.name = m.title;
        state.presets.push(preset); persist(); closeModal(); render();
      };
    }
  }

  function openPresetPicker(ownerType, ownerId){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>Add From Preset</h3></div><div class="modal-body"><div class="list">${state.presets.map(p => `<div class="item-shell"><div class="item-left"><div class="item-title">${esc(p.name)}</div><div class="muted">${esc(p.moduleType)}</div></div><button class="gold-btn" data-use-preset="${p.id}">Use</button></div>`).join('') || `<div class="item-shell"><div class="item-left"><div class="muted">No presets yet.</div></div></div>`}</div><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Close</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    document.querySelectorAll('[data-use-preset]').forEach(btn => btn.onclick = () => {
      const p = state.presets.find(x => x.id === btn.dataset.usePreset); if (!p) return;
      const fresh = clone(p);
      fresh.id = id(); fresh.ownerType = ownerType; fresh.ownerId = ownerId; fresh.title = p.name;
      delete fresh.name;
      ensureModuleShape(fresh);
      state.modules.push(fresh); persist(); closeModal(); render();
    });
  }

  function openPresetEditor(presetId){
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return;
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>Edit Preset</h3></div><div class="modal-body"><label><div class="small-note">Name</div><input id="presetNameInput" value="${esc(preset.name)}" /></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="savePresetBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('savePresetBtn').onclick = () => { preset.name = gid('presetNameInput').value.trim() || preset.name; persist(); closeModal(); render(); };
  }

  function openChecklistItemForm(m){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>Add Checklist Item</h3></div><div class="modal-body"><label><div class="small-note">Item</div><input id="checkItemInput" /></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveCheckItemBtn" class="gold-btn">Add</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveCheckItemBtn').onclick = () => { const txt = gid('checkItemInput').value.trim(); if (!txt) return; m.items.push({ id:id(), text:txt, done:false }); persist(); closeModal(); render(); };
  }

  function openTableColumnsForm(m){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>Edit Columns</h3></div><div class="modal-body"><label><div class="small-note">Comma-separated column names</div><input id="columnNamesInput" value="${esc((m.columns || []).map(c => c.label).join(', '))}" /></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveColumnsBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveColumnsBtn').onclick = () => { const raw = gid('columnNamesInput').value.trim(); m.columns = raw.split(',').map(x => x.trim()).filter(Boolean).map(label => ({ key:slug(label), label })); persist(); closeModal(); render(); };
  }

  function openTableRowForm(m){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>Add Row</h3></div><div class="modal-body"><div class="field-grid">${(m.columns || []).map(c => `<label><div class="small-note">${esc(c.label)}</div><input data-row-input="${c.key}" /></label>`).join('')}</div><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveRowBtn" class="gold-btn">Add Row</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveRowBtn').onclick = () => { const row = { id:id() }; (m.columns || []).forEach(c => row[c.key] = document.querySelector(`[data-row-input="${c.key}"]`)?.value || ''); m.rows.push(row); persist(); closeModal(); render(); };
  }

  function openFieldForm(m){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>Add Field</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Label</div><input id="fieldLabelInput" /></label><label><div class="small-note">Type</div><select id="fieldTypeInput"><option value="text">Text</option><option value="number">Number</option><option value="select">Dropdown</option><option value="toggle">Toggle</option></select></label><label id="fieldOptionsWrap" class="hidden"><div class="small-note">Dropdown Options (comma-separated)</div><input id="fieldOptionsInput" placeholder="Option A, Option B" /></label></div><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveFieldBtn" class="gold-btn">Add Field</button></div></div></div></div>`);
    gid('fieldTypeInput').onchange = () => gid('fieldOptionsWrap').classList.toggle('hidden', gid('fieldTypeInput').value !== 'select');
    gid('closeModalBtn').onclick = closeModal;
    gid('saveFieldBtn').onclick = () => {
      const label = gid('fieldLabelInput').value.trim(); const type = gid('fieldTypeInput').value; if (!label) return;
      const f = { key:slug(label), label, type, value:type === 'toggle' ? false : '' };
      if (type === 'select') { f.options = (gid('fieldOptionsInput').value || '').split(',').map(x => x.trim()).filter(Boolean); f.value = f.options[0] || ''; }
      m.fields.push(f); persist(); closeModal(); render();
    };
  }

  function openRecipeForm(m, recipe=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${recipe ? 'Edit Recipe' : 'New Recipe'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Recipe Name</div><input id="recipeNameInput" value="${esc(recipe?.name || '')}" /></label><label><div class="small-note">Base</div><input id="recipeBaseInput" value="${esc(recipe?.base || '')}" /></label><label><div class="small-note">Quantity</div><input id="recipeQtyInput" value="${esc(recipe?.quantity || '')}" /></label></div><label><div class="small-note">Notes</div><textarea id="recipeNotesInput">${esc(recipe?.notes || '')}</textarea></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveRecipeBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveRecipeBtn').onclick = () => {
      const data = { id:recipe?.id || id(), name:gid('recipeNameInput').value.trim(), base:gid('recipeBaseInput').value.trim(), quantity:gid('recipeQtyInput').value.trim(), notes:gid('recipeNotesInput').value.trim(), ingredients:recipe?.ingredients || [] };
      if (!data.name) return;
      if (recipe) Object.assign(recipe, data); else m.recipes.push(data);
      setLastEdited(m.ownerType, m.ownerId);
      persist(); closeModal(); render();
    };
  }

  function openIngredientForm(recipe, modRef=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>+ Ingredient</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Ingredient</div><input id="ingredientNameInput" /></label><label><div class="small-note">Percent</div><input id="ingredientPercentInput" type="number" /></label></div><label><div class="small-note">Notes</div><input id="ingredientNotesInput" /></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveIngredientBtn" class="gold-btn">Add</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveIngredientBtn').onclick = () => {
      const name = gid('ingredientNameInput').value.trim(); if (!name) return;
      recipe.ingredients.push({ id:id(), name, percent:Number(gid('ingredientPercentInput').value || 0), notes:gid('ingredientNotesInput').value.trim() });
      if (modRef) setLastEdited(modRef.ownerType, modRef.ownerId);
      persist(); closeModal(); render();
    };
  }

  function openChainForm(m, chain=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${chain ? 'Edit Chain' : 'New Chain'}</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Chain Name</div><input id="chainNameInput" value="${esc(chain?.name || '')}" /></label><label><div class="small-note">Start Product</div><input id="chainStartInput" value="${esc(chain?.startProduct || '')}" /></label><label><div class="small-note">Final Product</div><input id="chainFinalInput" value="${esc(chain?.finalProduct || '')}" /></label><label><div class="small-note">Sell Price</div><input id="chainSellInput" value="${esc(chain?.sellPrice || '')}" /></label></div><label><div class="small-note">Notes</div><textarea id="chainNotesInput">${esc(chain?.notes || '')}</textarea></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveChainBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveChainBtn').onclick = () => {
      const data = { id:chain?.id || id(), name:gid('chainNameInput').value.trim(), startProduct:gid('chainStartInput').value.trim(), finalProduct:gid('chainFinalInput').value.trim(), sellPrice:gid('chainSellInput').value.trim(), notes:gid('chainNotesInput').value.trim(), steps:chain?.steps || [] };
      if (!data.name) return;
      if (chain) Object.assign(chain, data); else m.chains.push(data);
      setLastEdited(m.ownerType, m.ownerId);
      persist(); closeModal(); render();
    };
  }

  function openStepForm(chain, modRef=null){
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>+ Step</h3></div><div class="modal-body"><div class="field-grid"><label><div class="small-note">Ingredient Added</div><input id="stepIngredientInput" /></label><label><div class="small-note">Result After This Step</div><input id="stepResultInput" /></label></div><label><div class="small-note">Notes</div><textarea id="stepNotesInput"></textarea></label><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveStepBtn" class="gold-btn">Add</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveStepBtn').onclick = () => {
      const ingredient = gid('stepIngredientInput').value.trim(); const result = gid('stepResultInput').value.trim();
      if (!ingredient || !result) return;
      chain.steps.push({ id:id(), ingredient, result, notes:gid('stepNotesInput').value.trim() });
      if (modRef) setLastEdited(modRef.ownerType, modRef.ownerId);
      persist(); closeModal(); render();
    };
  }

  function openTrackerEntryForm(mod, entry=null){
    const def = Mods.TRACKER_DEFS[mod.moduleType];
    openModal(`<div class="modal-shell"><div class="modal-head"><h3>${entry ? 'Edit Entry' : 'Add Entry'} — ${esc(def.label)}</h3></div><div class="modal-body"><div class="field-grid">${def.fields.map(f => `<label><div class="small-note">${esc(f.label)}</div><input id="trackerField_${esc(f.key)}" type="${f.type === 'number' ? 'number' : 'text'}" value="${esc(entry?.[f.key] ?? '')}" /></label>`).join('')}</div><div class="modal-actions"><span></span><div class="modal-right-actions"><button id="closeModalBtn" class="ghost-btn">Cancel</button><button id="saveTrackerEntryBtn" class="gold-btn">Save</button></div></div></div></div>`);
    gid('closeModalBtn').onclick = closeModal;
    gid('saveTrackerEntryBtn').onclick = () => {
      const data = { id: entry?.id || id() };
      def.fields.forEach(f => {
        const raw = gid(`trackerField_${f.key}`).value;
        data[f.key] = f.type === 'number' ? Number(raw || 0) : raw.trim();
      });
      if (!data[def.fields[0].key]) return;
      if (entry) Object.assign(entry, data); else mod.entries.unshift(data);
      setLastEdited(mod.ownerType, mod.ownerId);
      persist(); closeModal(); render();
    };
  }

  function cloneProfile(p){
    const copy = clone(p); copy.id = id(); copy.name = `${p.name} Copy`; copy.archived = false; state.profiles.push(copy);
    modulesFor('profile', p.id).forEach(m => { const c = clone(m); c.id = id(); c.ownerId = copy.id; state.modules.push(c); });
    persist(); navigate('profile', copy.id);
  }

  function cloneServer(s){
    const copy = clone(s); copy.id = id(); copy.name = `${s.name} Copy`; copy.archived = false; state.servers.push(copy);
    modulesFor('server', s.id).forEach(m => { const c = clone(m); c.id = id(); c.ownerId = copy.id; state.modules.push(c); });
    persist(); navigate('server', copy.id);
  }

  function exportData(){
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'game-codex-backup.json'; a.click(); URL.revokeObjectURL(url);
  }

  function importData(e){
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => { try { state = normalizeState(Object.assign(clone(defaultState), JSON.parse(r.result))); await persist(); render(); } catch { alert('Import failed.'); } };
    r.readAsText(f);
  }

  function navigate(name, id=null){ state.route = { name, id }; persist(); closeSidebar(); render(); }
  function toggleSidebar(){ el.sidebar.classList.toggle('open'); el.scrim.classList.toggle('show'); }
  function closeSidebar(){ el.sidebar.classList.remove('open'); el.scrim.classList.remove('show'); }
  function applyTheme(){ document.documentElement.style.setProperty('--gold', state.theme.gold); document.documentElement.style.setProperty('--accent', state.theme.accent); }
  async function persist(){
    state = normalizeState(state);
    try {
      await Storage.setState(state);
    } catch (err) {
      showBootError(formatError('Save failed', err));
    }
  }

  
  function setLastEdited(type, idValue){
    if (!idValue) return;
    state.ui.lastEdited = { type, id: idValue, ts: Date.now() };
    persist();
  }

  function renderLastEditedCard(){
    const item = state.ui?.lastEdited;
    if (!item || !item.type || !item.id) {
      return `<div class="card"><h3>No last edited item yet</h3><div class="muted">When you save a game, profile, or server, it’ll show up here.</div></div>`;
    }
    if (item.type === 'game') {
      const g = gameById(item.id);
      if (!g) return `<div class="card"><h3>No last edited item yet</h3></div>`;
      return `<article class="card last-edited-card"><div class="eyebrow">Last Edited: Game</div><h3>${esc(g.title)}</h3><div class="meta">${esc(categoryById(g.categoryId)?.name || '')}</div><div style="margin-top:auto"><button class="gold-btn" data-open-game="${g.id}">View</button></div></article>`;
    }
    if (item.type === 'profile') {
      const p = profileById(item.id);
      if (!p) return `<div class="card"><h3>No last edited item yet</h3></div>`;
      return `<article class="card last-edited-card"><div class="eyebrow">Last Edited: Profile</div><h3>${esc(p.name)}</h3><div class="meta">${esc(gameById(p.gameId)?.title || '')}</div><div style="margin-top:auto"><button class="gold-btn" data-open-profile="${p.id}">View</button></div></article>`;
    }
    if (item.type === 'server') {
      const s = serverById(item.id);
      if (!s) return `<div class="card"><h3>No last edited item yet</h3></div>`;
      return `<article class="card last-edited-card"><div class="eyebrow">Last Edited: Server</div><h3>${esc(s.name)}</h3><div class="meta">${esc(gameById(s.gameId)?.title || '')}</div><div style="margin-top:auto"><button class="gold-btn" data-open-server="${s.id}">View</button></div></article>`;
    }
    return `<div class="card"><h3>No last edited item yet</h3></div>`;
  }

function touchRecent(type, idValue){
    const tok = `${type}:${idValue}`;
    state.ui.recent = [tok, ...state.ui.recent.filter(x => x !== tok)].slice(0, 1);
    persist();
  }

  function categoryById(idValue){ return state.categories.find(c => c.id === idValue); }
  function gameById(idValue){ return state.games.find(g => g.id === idValue); }
  function profileById(idValue){ return state.profiles.find(p => p.id === idValue); }
  function serverById(idValue){ return state.servers.find(s => s.id === idValue); }
  function profilesForGame(gameId){ return state.profiles.filter(p => p.gameId === gameId); }
  function serversForGame(gameId){ return state.servers.filter(s => s.gameId === gameId); }
  function modulesFor(type, ownerId){ return state.modules.filter(m => m.ownerType === type && m.ownerId === ownerId); }

  function openModal(html){ el.modal.innerHTML = html; el.modal.showModal(); }
  function closeModal(){ el.modal.close(); el.modal.innerHTML = ''; }
})().catch(err => {
  console.error(err);
  const node = document.getElementById('bootError');
  node.textContent = (err && (err.stack || err.message)) ? ('Boot failed: ' + (err.stack || err.message)) : ('Boot failed: ' + String(err));
  node.classList.remove('hidden');
});
