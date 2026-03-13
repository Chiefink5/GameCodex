const STORAGE_KEY = 'gameCodexV7';

const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,10)}`;
const now = () => Date.now();
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapeHtml = (str='') => str.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const steamHeader = (appid) => appid ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg` : '';

const serverTemplates = {
  blank: { modules:[{type:'notes', title:'Server Overview', icon:'👑'},{type:'notes', title:'Planning / Ideas', icon:'🧠'},{type:'table', title:'Plugin List', icon:'🧩', columns:[{label:'Plugin', type:'text'},{label:'Purpose', type:'text'},{label:'Status', type:'text'},{label:'Notes', type:'text'}]},{type:'checklist', title:'Roadmap', icon:'🛠️'}]},
  smp: { modules:[{type:'notes', title:'Server Overview', icon:'👑'},{type:'table', title:'Plugin List', icon:'🧩', columns:[{label:'Plugin', type:'text'},{label:'Purpose', type:'text'},{label:'Configured', type:'text'},{label:'Notes', type:'text'}]},{type:'notes', title:'Rules / Identity', icon:'📜'},{type:'checklist', title:'Roadmap', icon:'🛠️'}]},
  rpg: { modules:[{type:'notes', title:'Core Gameplay Loop', icon:'⚔️'},{type:'table', title:'Plugin List', icon:'🧩', columns:[{label:'Plugin', type:'text'},{label:'Purpose', type:'text'},{label:'Installed', type:'text'},{label:'Notes', type:'text'}]},{type:'notes', title:'Progression Systems', icon:'📈'},{type:'checklist', title:'Quest / Systems Roadmap', icon:'🗺️'},{type:'table', title:'Bug Tracker', icon:'🐞', columns:[{label:'Issue', type:'text'},{label:'Severity', type:'text'},{label:'Status', type:'text'},{label:'Notes', type:'text'}]}]},
  economy: { modules:[{type:'notes', title:'Economy Design', icon:'💰'},{type:'table', title:'Plugin List', icon:'🧩', columns:[{label:'Plugin', type:'text'},{label:'Purpose', type:'text'},{label:'Status', type:'text'},{label:'Notes', type:'text'}]},{type:'table', title:'Money Sources', icon:'📊', columns:[{label:'Source', type:'text'},{label:'Rate', type:'text'},{label:'Risk', type:'text'},{label:'Notes', type:'text'}]},{type:'checklist', title:'Balancing Roadmap', icon:'⚖️'}]},
  modded: { modules:[{type:'notes', title:'Modpack / Server Overview', icon:'🧪'},{type:'table', title:'Mods / Plugins', icon:'🧩', columns:[{label:'Name', type:'text'},{label:'Role', type:'text'},{label:'Status', type:'text'},{label:'Notes', type:'text'}]},{type:'notes', title:'Theme / Progression', icon:'🌌'},{type:'checklist', title:'Testing Checklist', icon:'✅'}]}
};

const defaultState = () => {
  const categories = [
    {id:uid('cat'), name:'Sandbox / Creative', icon:'🧱', color:'#d4af37', order:0},
    {id:uid('cat'), name:'Automation / Factory', icon:'⚙️', color:'#b886f8', order:1},
    {id:uid('cat'), name:'Life Sim / Business', icon:'🏙️', color:'#62c7c7', order:2},
    {id:uid('cat'), name:'Open World RPG', icon:'🗡️', color:'#ff9c6b', order:3},
    {id:uid('cat'), name:'Survival / Exploration', icon:'🔥', color:'#7ad66d', order:4},
  ];
  const [sandbox, automation, , rpg] = categories;
  const games = [
    {id:uid('game'), title:'Minecraft', categoryId:sandbox.id, status:'active', favorite:true, banner:'', steamAppId:'', supportsProfiles:true, supportsServers:true, archived:false, lastViewed:now()-1000*60*5},
    {id:uid('game'), title:'Satisfactory', categoryId:automation.id, status:'active', favorite:true, banner:steamHeader('526870'), steamAppId:'526870', supportsProfiles:true, supportsServers:true, archived:false, lastViewed:now()-1000*60*40},
    {id:uid('game'), title:'Cyberpunk 2077', categoryId:rpg.id, status:'paused', favorite:false, banner:steamHeader('1091500'), steamAppId:'1091500', supportsProfiles:true, supportsServers:false, archived:false, lastViewed:now()-1000*60*80},
  ];
  const profiles = [];
  const servers = [];
  const modules = [];

  const mc = games[0];
  const sat = games[1];
  const cp = games[2];
  const mcProfile = {id:uid('profile'), gameId:mc.id, name:'Modded RPG World', type:'world', status:'active', tag:'skill plugin grind', archived:false, favorite:true, lastViewed:now()-1000*60*3};
  const satProfile = {id:uid('profile'), gameId:sat.id, name:'Main Factory', type:'save', status:'active', tag:'desert start', archived:false, favorite:false, lastViewed:now()-1000*60*22};
  const cpProfile = {id:uid('profile'), gameId:cp.id, name:'Stealth Build Run', type:'playthrough', status:'paused', tag:'knife + silenced pistols', archived:false, favorite:false, lastViewed:now()-1000*60*70};
  profiles.push(mcProfile, satProfile, cpProfile);

  const mcServer = {id:uid('server'), gameId:mc.id, name:'VoidCraft SMP', template:'smp', status:'planning', version:'1.21.1 Paper', theme:'dark fantasy progression', archived:false, favorite:false, lastViewed:now()-1000*60*11};
  servers.push(mcServer);

  // Seed modules
  modules.push(
    {id:uid('mod'), ownerType:'profile', ownerId:mcProfile.id, type:'table', title:'Skill XP Methods', icon:'📊', columns:[{label:'Skill', type:'text'},{label:'Best Method', type:'text'},{label:'XP Rate', type:'text'},{label:'Notes', type:'text'}], rows:[{id:uid('row'), values:['Mining','Deep cave strip mine','High','Good with ore doubling']},{id:uid('row'), values:['Combat','Mob grinder','High','Best overnight farm']}]},
    {id:uid('mod'), ownerType:'profile', ownerId:mcProfile.id, type:'custom', title:'Plugin Build Focus', icon:'🧠', schema:[{id:uid('f'), label:'Main Skill Plugin', type:'text', options:''},{id:uid('f'), label:'Current Grind Focus', type:'text', options:''},{id:uid('f'), label:'Best Early Skill', type:'text', options:''},{id:uid('f'), label:'Level Goal', type:'number', options:''}], values:{}},
    {id:uid('mod'), ownerType:'profile', ownerId:satProfile.id, type:'checklist', title:'Factory Goals', icon:'✅', entries:[{id:uid('e'), title:'Automate motors', content:'', done:false},{id:uid('e'), title:'Expand power', content:'', done:true}]},
    {id:uid('mod'), ownerType:'profile', ownerId:cpProfile.id, type:'notes', title:'Build Notes', icon:'📜', entries:[{id:uid('e'), title:'Core loop', content:'Stealth openers, finish with blade.'}]}
  );
  // apply server template
  applyServerTemplate(modules, mcServer.id, 'blank');
  return {categories, games, profiles, servers, modules, recents:[], currentView:{name:'home'}};
};

function applyServerTemplate(modulesArr, serverId, key) {
  (serverTemplates[key] || serverTemplates.blank).modules.forEach(m => {
    const base = {id:uid('mod'), ownerType:'server', ownerId:serverId, type:m.type, title:m.title, icon:m.icon || '📦'};
    if (m.type === 'table') base.columns = m.columns || [], base.rows = [];
    if (m.type === 'custom') base.schema = m.schema || [], base.values = {};
    if (m.type === 'notes' || m.type === 'checklist') base.entries = [];
    modulesArr.push(base);
  });
}

let state = loadState();
let fieldDraft = [];
let columnDraft = [];
let context = { ownerType:'', ownerId:'', moduleId:'' };

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch { return defaultState(); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function sortedCategories(){ return [...state.categories].sort((a,b)=>(a.order??0)-(b.order??0)); }
function findCategory(id){ return state.categories.find(x=>x.id===id); }
function findGame(id){ return state.games.find(x=>x.id===id); }
function findProfile(id){ return state.profiles.find(x=>x.id===id); }
function findServer(id){ return state.servers.find(x=>x.id===id); }
function ownerLabel(ownerType){ return ownerType==='server'?'Server':'Profile'; }
function modulesFor(ownerType, ownerId){ return state.modules.filter(m=>m.ownerType===ownerType && m.ownerId===ownerId); }
function touchRecent(kind,id){ const key=`${kind}:${id}`; state.recents = [key,...state.recents.filter(x=>x!==key)].slice(0,3); }

function setView(name, payload={}){
  state.currentView = {name, ...payload};
  saveState();
  render();
}

function render(){
  renderSidebar();
  const title = $('#viewTitle');
  const views = ['home','category','game','profile','server','favorites','archive'];
  views.forEach(v => $(`#${v}View`)?.classList.add('hidden'));

  if (state.currentView.name === 'home') { title.textContent='Game Codex'; $('#homeView').classList.remove('hidden'); renderHome(); }
  if (state.currentView.name === 'category') { const cat=findCategory(state.currentView.categoryId); title.textContent = cat?.name || 'Category'; $('#categoryView').classList.remove('hidden'); renderCategory(cat); }
  if (state.currentView.name === 'game') { const game=findGame(state.currentView.gameId); if(game){title.textContent=game.title; $('#gameView').classList.remove('hidden'); renderGame(game);} }
  if (state.currentView.name === 'profile') { const profile=findProfile(state.currentView.profileId); if(profile){ title.textContent=profile.name; $('#profileView').classList.remove('hidden'); renderOwnerPage('profile', profile);} }
  if (state.currentView.name === 'server') { const server=findServer(state.currentView.serverId); if(server){ title.textContent=server.name; $('#serverView').classList.remove('hidden'); renderOwnerPage('server', server);} }
  if (state.currentView.name === 'favorites') { title.textContent='Favorites'; $('#favoritesView').classList.remove('hidden'); renderFavorites(); }
  if (state.currentView.name === 'archive') { title.textContent='Archive'; $('#archiveView').classList.remove('hidden'); renderArchive(); }
  updateActiveNav();
}

function renderSidebar(){
  const wrap = $('#sidebarCategories');
  wrap.innerHTML = sortedCategories().map(cat => `<button class="nav-btn" data-cat="${cat.id}" type="button">${cat.icon || '📁'} ${escapeHtml(cat.name)}</button>`).join('');
  wrap.querySelectorAll('[data-cat]').forEach(btn => btn.onclick = () => { closeSidebar(); setView('category',{categoryId:btn.dataset.cat}); });
  renderCategoryManager();
}

function renderHome(){
  const q = $('#searchInput').value.trim().toLowerCase();
  const recents = state.recents.map(key => {
    const [kind,id] = key.split(':');
    if (kind === 'game') return {kind, item:findGame(id)};
    if (kind === 'profile') return {kind, item:findProfile(id)};
    if (kind === 'server') return {kind, item:findServer(id)};
  }).filter(x=>x?.item && !x.item.archived);

  const catCards = sortedCategories().map(cat => {
    const gameCount = state.games.filter(g => g.categoryId===cat.id && !g.archived).length;
    return `<button class="card" style="border-color:${cat.color}55" data-open-cat="${cat.id}"><div class="status">${cat.icon || '📁'} Category</div><h3>${escapeHtml(cat.name)}</h3><div class="muted">${gameCount} game${gameCount===1?'':'s'}</div></button>`;
  }).join('');

  let searchResults = '';
  if (q) {
    const gameResults = state.games.filter(g => !g.archived && g.title.toLowerCase().includes(q));
    const profileResults = state.profiles.filter(p => !p.archived && (p.name.toLowerCase().includes(q) || (p.tag||'').toLowerCase().includes(q)));
    const serverResults = state.servers.filter(s => !s.archived && (s.name.toLowerCase().includes(q) || (s.theme||'').toLowerCase().includes(q)));
    searchResults = `<div class="card"><div class="section-head"><div><div class="eyebrow">Search</div><h3>Results for “${escapeHtml(q)}”</h3></div></div>
      <div class="stack-list">
        ${gameResults.map(g=>entityRow('game',g)).join('')}
        ${profileResults.map(p=>entityRow('profile',p)).join('')}
        ${serverResults.map(s=>entityRow('server',s)).join('')}
        ${(!gameResults.length && !profileResults.length && !serverResults.length) ? `<div class="empty">Nothing matched that search.</div>`:''}
      </div></div>`;
  }

  $('#homeView').innerHTML = `
    <div class="split">
      <div class="col">
        <div class="card"><div class="section-head"><div><div class="eyebrow">Quick Access</div><h3>Recently Viewed</h3></div></div>
          <div class="grid cards">${recents.length ? recents.map(r=>recentCard(r.kind,r.item)).join('') : `<div class="empty">Open a game, profile, or server and your last 3 show up here.</div>`}</div>
        </div>
        ${searchResults}
      </div>
      <div class="col">
        <div class="card"><div class="section-head"><div><div class="eyebrow">Library</div><h3>Categories</h3></div></div><div class="grid cards">${catCards}</div></div>
      </div>
    </div>`;
  $$('[data-open-cat]').forEach(btn => btn.onclick = () => setView('category',{categoryId:btn.dataset.openCat}));
  bindEntityRows($('#homeView'));
}

function renderCategory(cat){
  const games = state.games.filter(g => g.categoryId===cat?.id && !g.archived);
  $('#categoryView').innerHTML = cat ? `<div class="section-head"><div><div class="eyebrow">Category</div><h3>${cat.icon || '📁'} ${escapeHtml(cat.name)}</h3></div></div>
    <div class="grid cards">${games.length ? games.map(gameCard).join('') : `<div class="empty">No games in this category yet.</div>`}</div>` : `<div class="empty">Category not found.</div>`;
  bindEntityRows($('#categoryView'));
}

function renderGame(game){
  touchRecent('game', game.id); game.lastViewed = now(); saveState();
  const category = findCategory(game.categoryId);
  const profiles = state.profiles.filter(p => p.gameId===game.id && !p.archived);
  const servers = state.servers.filter(s => s.gameId===game.id && !s.archived);
  $('#gameView').innerHTML = `
    <div class="card banner">
      <div class="banner-top" style="background-image:${game.banner ? `linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.5)), url('${escapeHtml(game.banner)}')` : `linear-gradient(135deg,#563896,#1b1624)`}"></div>
      <div class="card-body">
        <div class="section-head">
          <div>
            <div class="eyebrow">${escapeHtml(category?.name || 'Game')}</div>
            <h3>${escapeHtml(game.title)}</h3>
            <div class="pill-row">
              <span class="tag gold">Status: ${escapeHtml(game.status)}</span>
              <span class="tag">Profiles: ${game.supportsProfiles ? 'Enabled' : 'Off'}</span>
              <span class="tag">Servers: ${game.supportsServers ? 'Enabled' : 'Off'}</span>
              ${game.favorite ? `<span class="tag">⭐ Favorite</span>`:''}
            </div>
          </div>
          <div class="actions">
            <button class="secondary-btn" data-edit-game="${game.id}">Edit</button>
            <button class="secondary-btn" data-archive-game="${game.id}">${game.archived ? 'Restore' : 'Archive'}</button>
            <button class="secondary-btn danger" data-delete-game="${game.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
    <div class="split">
      <div class="col">
        <div class="card"><div class="section-head"><div><div class="eyebrow">Runs & Worlds</div><h3>Profiles</h3></div>${game.supportsProfiles ? `<button class="primary-btn" data-add-profile="${game.id}">+ Add Profile</button>` : ''}</div>
          <div class="stack-list">${game.supportsProfiles ? (profiles.length ? profiles.map(p=>entityRow('profile',p)).join('') : `<div class="empty">No profiles yet.</div>`) : `<div class="empty">Profiles are disabled for this game.</div>`}</div>
        </div>
      </div>
      <div class="col">
        <div class="card"><div class="section-head"><div><div class="eyebrow">Projects & Admin</div><h3>Servers</h3></div>${game.supportsServers ? `<button class="primary-btn" data-add-server="${game.id}">+ Create Server</button>` : ''}</div>
          <div class="stack-list">${game.supportsServers ? (servers.length ? servers.map(s=>entityRow('server',s)).join('') : `<div class="empty">No servers yet.</div>`) : `<div class="empty">Servers are disabled for this game. Turn them on in Edit Game.</div>`}</div>
        </div>
      </div>
    </div>`;
  bindEntityRows($('#gameView'));
  $('[data-edit-game]')?.addEventListener('click', ()=>openGameModal(game.id));
  $('[data-archive-game]')?.addEventListener('click', ()=>toggleArchiveGame(game.id));
  $('[data-delete-game]')?.addEventListener('click', ()=>deleteGame(game.id));
  $('[data-add-profile]')?.addEventListener('click', ()=>openProfileModal('', game.id));
  $('[data-add-server]')?.addEventListener('click', ()=>openServerModal('', game.id));
}

function renderOwnerPage(ownerType, owner){
  touchRecent(ownerType, owner.id); owner.lastViewed = now(); saveState();
  const game = findGame(owner.gameId);
  const ownerModules = modulesFor(ownerType, owner.id);
  const target = ownerType==='profile' ? $('#profileView') : $('#serverView');
  const status = owner.status || 'active';
  target.innerHTML = `
    <div class="card"><div class="section-head"><div><div class="eyebrow">${ownerLabel(ownerType)}</div><h3>${escapeHtml(owner.name)}</h3><div class="pill-row"><span class="tag gold">${escapeHtml(status)}</span>${owner.tag ? `<span class="tag">${escapeHtml(owner.tag)}</span>`:''}${owner.version ? `<span class="tag">${escapeHtml(owner.version)}</span>`:''}${owner.theme ? `<span class="tag">${escapeHtml(owner.theme)}</span>`:''}</div><div class="muted">Parent game: ${escapeHtml(game?.title || 'Unknown')}</div></div>
      <div class="actions">
        <button class="primary-btn" data-add-module="${owner.id}">+ Add Module</button>
        <button class="secondary-btn" data-edit-owner="${owner.id}">Edit</button>
        <button class="secondary-btn" data-clone-owner="${owner.id}">Clone</button>
        <button class="secondary-btn" data-archive-owner="${owner.id}">${owner.archived ? 'Restore' : 'Archive'}</button>
        <button class="secondary-btn danger" data-delete-owner="${owner.id}">Delete</button>
      </div></div></div>
    <div class="grid">${ownerModules.length ? ownerModules.map(m=>moduleCard(m)).join('') : `<div class="empty">No modules yet. Add one and start logging.</div>`}</div>`;
  target.querySelector('[data-add-module]')?.addEventListener('click', ()=>openModuleModal('', ownerType, owner.id));
  target.querySelector('[data-edit-owner]')?.addEventListener('click', ()=> ownerType==='profile' ? openProfileModal(owner.id, owner.gameId) : openServerModal(owner.id, owner.gameId));
  target.querySelector('[data-clone-owner]')?.addEventListener('click', ()=> cloneOwner(ownerType, owner.id));
  target.querySelector('[data-archive-owner]')?.addEventListener('click', ()=> toggleArchiveOwner(ownerType, owner.id));
  target.querySelector('[data-delete-owner]')?.addEventListener('click', ()=> deleteOwner(ownerType, owner.id));
  bindModuleActions(target, ownerType, owner.id);
}

function renderFavorites(){
  const items = [
    ...state.games.filter(x=>x.favorite && !x.archived).map(x=>({type:'game', item:x})),
    ...state.profiles.filter(x=>x.favorite && !x.archived).map(x=>({type:'profile', item:x})),
    ...state.servers.filter(x=>x.favorite && !x.archived).map(x=>({type:'server', item:x})),
  ];
  $('#favoritesView').innerHTML = `<div class="card"><div class="section-head"><div><div class="eyebrow">Pinned</div><h3>Favorites</h3></div></div><div class="stack-list">${items.length ? items.map(({type,item})=>entityRow(type,item)).join('') : `<div class="empty">No favorites yet.</div>`}</div></div>`;
  bindEntityRows($('#favoritesView'));
}

function renderArchive(){
  const games = state.games.filter(x=>x.archived);
  const profiles = state.profiles.filter(x=>x.archived);
  const servers = state.servers.filter(x=>x.archived);
  $('#archiveView').innerHTML = `<div class="split">
    <div class="col"><div class="card"><div class="section-head"><div><div class="eyebrow">Archived</div><h3>Games</h3></div></div><div class="stack-list">${games.length ? games.map(g=>entityRow('game',g)).join('') : `<div class="empty">No archived games.</div>`}</div></div></div>
    <div class="col"><div class="card"><div class="section-head"><div><div class="eyebrow">Archived</div><h3>Profiles & Servers</h3></div></div><div class="stack-list">${profiles.map(p=>entityRow('profile',p)).join('')}${servers.map(s=>entityRow('server',s)).join('') || (!profiles.length && !servers.length ? `<div class="empty">No archived profiles or servers.</div>`:'')}</div></div></div>
  </div>`;
  bindEntityRows($('#archiveView'));
}

function gameCard(game){
  const cat=findCategory(game.categoryId);
  return `<button class="card banner" data-open-game="${game.id}"><div class="banner-top" style="background-image:${game.banner ? `linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.5)), url('${escapeHtml(game.banner)}')` : `linear-gradient(135deg,#563896,#1b1624)`}"></div><div class="card-body"><div class="status">${escapeHtml(cat?.name||'Game')}</div><h3>${escapeHtml(game.title)}</h3><div class="muted">${game.supportsProfiles?'Profiles':''}${game.supportsProfiles&&game.supportsServers?' · ':''}${game.supportsServers?'Servers':''}</div></div></button>`;
}
function recentCard(kind,item){ return `<button class="card" data-open-${kind}="${item.id}"><div class="status">${kind}</div><h3>${escapeHtml(item.name || item.title)}</h3><div class="muted">Last touched just now-ish</div></button>`; }
function entityRow(type,item){
  const meta = type==='game' ? `${findCategory(item.categoryId)?.icon || '🎮'} ${findCategory(item.categoryId)?.name || ''}` : `${findGame(item.gameId)?.title || ''}`;
  const extra = type==='profile' ? item.type : (type==='server' ? `${item.status} · ${item.version||'No version set'}` : item.status);
  return `<div class="list-row"><div><div class="status">${escapeHtml(type)}</div><strong>${escapeHtml(item.name || item.title)}</strong><div class="muted">${escapeHtml(meta)}${extra ? ` · ${escapeHtml(extra)}`:''}</div></div><div class="actions"><button class="secondary-btn" data-open-${type}="${item.id}">Open</button>${item.archived ? `<button class="secondary-btn" data-restore-${type}="${item.id}">Restore</button>`:''}</div></div>`;
}
function moduleCard(module){
  let body = '';
  if (module.type === 'notes' || module.type === 'checklist') {
    const entries = module.entries || [];
    body = entries.length ? entries.map(entry => module.type==='checklist' ? `<div class="entry check-item"><input type="checkbox" ${entry.done?'checked':''} data-toggle-entry="${entry.id}" data-module="${module.id}" /><div><h4>${escapeHtml(entry.title)}</h4>${entry.content ? `<p>${escapeHtml(entry.content)}</p>`:''}</div><div class="actions"><button class="tiny-btn" data-edit-entry="${entry.id}" data-module="${module.id}">Edit</button><button class="tiny-btn danger" data-delete-entry="${entry.id}" data-module="${module.id}">Delete</button></div></div>` : `<div class="entry"><h4>${escapeHtml(entry.title)}</h4>${entry.content ? `<p>${escapeHtml(entry.content)}</p>`:''}<div class="actions" style="margin-top:10px"><button class="tiny-btn" data-edit-entry="${entry.id}" data-module="${module.id}">Edit</button><button class="tiny-btn danger" data-delete-entry="${entry.id}" data-module="${module.id}">Delete</button></div></div>`).join('') : `<div class="empty">No entries yet.</div>`;
  }
  if (module.type === 'custom') {
    const schema = module.schema || [];
    body = schema.length ? schema.map(field => {
      const value = module.values?.[field.id] ?? '';
      return `<label><span>${escapeHtml(field.label)}</span>${renderCustomInput(module.id, field, value)}</label>`;
    }).join('') : `<div class="empty">No custom fields defined.</div>`;
  }
  if (module.type === 'table') {
    const cols = module.columns || [];
    const rows = module.rows || [];
    body = cols.length ? `<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${escapeHtml(c.label)}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.length ? rows.map(row=>`<tr>${cols.map((c,i)=>`<td>${escapeHtml(row.values?.[i] ?? '')}</td>`).join('')}<td><button class="tiny-btn" data-edit-row="${row.id}" data-module="${module.id}">Edit</button> <button class="tiny-btn danger" data-delete-row="${row.id}" data-module="${module.id}">Delete</button></td></tr>`).join('') : `<tr><td colspan="${cols.length+1}" class="muted">No rows yet.</td></tr>`}</tbody></table></div>` : `<div class="empty">No columns defined.</div>`;
  }
  return `<div class="card module-card"><div class="module-head"><div class="module-title"><div class="tag gold">${escapeHtml(module.icon || '📦')}</div><div><h3>${escapeHtml(module.title)}</h3><div class="muted">${escapeHtml(module.type)}</div></div></div><div class="actions"><button class="tiny-btn" data-move-up="${module.id}">↑</button><button class="tiny-btn" data-move-down="${module.id}">↓</button><button class="tiny-btn" data-clone-module="${module.id}">Clone</button><button class="tiny-btn" data-edit-module="${module.id}">Edit</button><button class="tiny-btn danger" data-delete-module="${module.id}">Delete</button></div></div>${body}<div class="actions">${(module.type==='notes'||module.type==='checklist')?`<button class="secondary-btn" data-add-entry="${module.id}">+ Add Entry</button>`:''}${module.type==='table'?`<button class="secondary-btn" data-add-row="${module.id}">+ Add Row</button>`:''}</div></div>`;
}
function renderCustomInput(moduleId, field, value){
  if (field.type === 'number') return `<input type="number" value="${escapeHtml(String(value))}" data-custom-input="${field.id}" data-module="${moduleId}" />`;
  if (field.type === 'toggle') return `<select data-custom-input="${field.id}" data-module="${moduleId}"><option value="false" ${String(value)==='false'?'selected':''}>No</option><option value="true" ${String(value)==='true'?'selected':''}>Yes</option></select>`;
  if (field.type === 'dropdown') {
    const opts = (field.options||'').split(',').map(x=>x.trim()).filter(Boolean);
    return `<select data-custom-input="${field.id}" data-module="${moduleId}">${opts.map(opt=>`<option value="${escapeHtml(opt)}" ${value===opt?'selected':''}>${escapeHtml(opt)}</option>`).join('')}</select>`;
  }
  return `<input type="text" value="${escapeHtml(String(value))}" data-custom-input="${field.id}" data-module="${moduleId}" />`;
}

function bindEntityRows(root){
  if (!root) return;
  root.querySelectorAll('[data-open-game]').forEach(b=>b.onclick = ()=>setView('game',{gameId:b.dataset.openGame}));
  root.querySelectorAll('[data-open-profile]').forEach(b=>b.onclick = ()=>setView('profile',{profileId:b.dataset.openProfile}));
  root.querySelectorAll('[data-open-server]').forEach(b=>b.onclick = ()=>setView('server',{serverId:b.dataset.openServer}));
  root.querySelectorAll('[data-restore-game]').forEach(b=>b.onclick = ()=>toggleArchiveGame(b.dataset.restoreGame));
  root.querySelectorAll('[data-restore-profile]').forEach(b=>b.onclick = ()=>toggleArchiveOwner('profile', b.dataset.restoreProfile));
  root.querySelectorAll('[data-restore-server]').forEach(b=>b.onclick = ()=>toggleArchiveOwner('server', b.dataset.restoreServer));
}
function bindModuleActions(root, ownerType, ownerId){
  root.querySelectorAll('[data-add-entry]').forEach(b=>b.onclick = ()=>openEntryModal('', b.dataset.addEntry));
  root.querySelectorAll('[data-edit-entry]').forEach(b=>b.onclick = ()=>openEntryModal(b.dataset.editEntry, b.dataset.module));
  root.querySelectorAll('[data-delete-entry]').forEach(b=>b.onclick = ()=>deleteEntry(b.dataset.module, b.dataset.deleteEntry));
  root.querySelectorAll('[data-toggle-entry]').forEach(b=>b.onchange = ()=>toggleChecklistEntry(b.dataset.module, b.dataset.toggleEntry));
  root.querySelectorAll('[data-edit-module]').forEach(b=>b.onclick = ()=>openModuleModal(b.dataset.editModule, ownerType, ownerId));
  root.querySelectorAll('[data-delete-module]').forEach(b=>b.onclick = ()=>deleteModule(b.dataset.deleteModule));
  root.querySelectorAll('[data-clone-module]').forEach(b=>b.onclick = ()=>cloneModule(b.dataset.cloneModule));
  root.querySelectorAll('[data-move-up]').forEach(b=>b.onclick = ()=>moveModule(ownerType, ownerId, b.dataset.moveUp, -1));
  root.querySelectorAll('[data-move-down]').forEach(b=>b.onclick = ()=>moveModule(ownerType, ownerId, b.dataset.moveDown, 1));
  root.querySelectorAll('[data-add-row]').forEach(b=>b.onclick = ()=>openTableRowModal('', b.dataset.addRow));
  root.querySelectorAll('[data-edit-row]').forEach(b=>b.onclick = ()=>openTableRowModal(b.dataset.editRow, b.dataset.module));
  root.querySelectorAll('[data-delete-row]').forEach(b=>b.onclick = ()=>deleteRow(b.dataset.module, b.dataset.deleteRow));
  root.querySelectorAll('[data-custom-input]').forEach(el=>el.onchange = ()=>updateCustomValue(el.dataset.module, el.dataset.customInput, el.value));
}

function updateActiveNav(){
  $$('.nav-btn[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === state.currentView.name));
}

function openGameModal(id=''){
  $('#gameForm').reset();
  $('#gameEditId').value = id;
  $('#gameModalTitle').textContent = id ? 'Edit Game' : 'Add Game';
  const catSelect = $('#gameCategoryInput');
  catSelect.innerHTML = sortedCategories().map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  if (id) {
    const g = findGame(id);
    $('#gameTitleInput').value = g.title;
    $('#gameStatusInput').value = g.status;
    $('#gameCategoryInput').value = g.categoryId;
    $('#gameBannerInput').value = g.banner || '';
    $('#gameFavoriteInput').value = String(!!g.favorite);
    $('#gameSteamInput').value = g.steamAppId || '';
    $('#gameSupportsProfilesInput').checked = g.supportsProfiles !== false;
    $('#gameSupportsServersInput').checked = !!g.supportsServers;
  } else {
    $('#gameSupportsProfilesInput').checked = true;
    $('#gameSupportsServersInput').checked = false;
  }
  $('#gameModal').showModal();
}
function openCategoryModal(id=''){
  $('#categoryForm').reset();
  $('#categoryEditId').value = id;
  $('#categoryModalTitle').textContent = id ? 'Edit Category' : 'Add Category';
  if (id) {
    const c = findCategory(id);
    $('#categoryNameInput').value = c.name;
    $('#categoryIconInput').value = c.icon || '';
    $('#categoryColorInput').value = c.color || '#d4af37';
  }
  $('#categoryModal').showModal();
}
function renderCategoryManager(){
  const wrap = $('#categoryManagerList');
  wrap.innerHTML = sortedCategories().map((c, idx)=>`<div class="list-row"><div><strong>${escapeHtml(c.icon || '📁')} ${escapeHtml(c.name)}</strong><div class="muted">Accent ${c.color}</div></div><div class="actions"><button class="tiny-btn" data-cat-up="${c.id}" ${idx===0?'disabled':''}>↑</button><button class="tiny-btn" data-cat-down="${c.id}" ${idx===sortedCategories().length-1?'disabled':''}>↓</button><button class="tiny-btn" data-cat-edit="${c.id}">Edit</button><button class="tiny-btn danger" data-cat-delete="${c.id}">Delete</button></div></div>`).join('');
  wrap.querySelectorAll('[data-cat-up]').forEach(b=>b.onclick=()=>moveCategory(b.dataset.catUp,-1));
  wrap.querySelectorAll('[data-cat-down]').forEach(b=>b.onclick=()=>moveCategory(b.dataset.catDown,1));
  wrap.querySelectorAll('[data-cat-edit]').forEach(b=>b.onclick=()=>openCategoryModal(b.dataset.catEdit));
  wrap.querySelectorAll('[data-cat-delete]').forEach(b=>b.onclick=()=>deleteCategory(b.dataset.catDelete));
}
function openProfileModal(id='', gameId=''){
  $('#profileForm').reset();
  $('#profileEditId').value = id; $('#profileGameId').value = gameId;
  $('#profileModalTitle').textContent = id ? 'Edit Profile' : 'Add Profile';
  if (id) {
    const p = findProfile(id);
    $('#profileGameId').value = p.gameId;
    $('#profileNameInput').value = p.name;
    $('#profileTypeInput').value = p.type;
    $('#profileStatusInput').value = p.status;
    $('#profileTagInput').value = p.tag || '';
  }
  $('#profileModal').showModal();
}
function openServerModal(id='', gameId=''){
  $('#serverForm').reset();
  $('#serverEditId').value = id; $('#serverGameId').value = gameId;
  $('#serverModalTitle').textContent = id ? 'Edit Server' : 'Create Server';
  if (id) {
    const s = findServer(id);
    $('#serverGameId').value = s.gameId;
    $('#serverNameInput').value = s.name;
    $('#serverTemplateInput').value = s.template || 'blank';
    $('#serverStatusInput').value = s.status || 'planning';
    $('#serverVersionInput').value = s.version || '';
    $('#serverThemeInput').value = s.theme || '';
  }
  $('#serverModal').showModal();
}
function openModuleModal(id='', ownerType='', ownerId=''){
  $('#moduleForm').reset();
  fieldDraft = []; columnDraft = [];
  $('#moduleEditId').value = id; $('#moduleOwnerType').value = ownerType; $('#moduleOwnerId').value = ownerId;
  $('#moduleModalTitle').textContent = id ? 'Edit Module' : 'Add Module';
  if (id) {
    const m = state.modules.find(x=>x.id===id);
    $('#moduleTitleInput').value = m.title;
    $('#moduleTypeInput').value = m.type;
    $('#moduleIconInput').value = m.icon || '';
    fieldDraft = JSON.parse(JSON.stringify(m.schema || []));
    columnDraft = JSON.parse(JSON.stringify(m.columns || []));
  }
  updateModuleBuilders();
  $('#moduleModal').showModal();
}
function updateModuleBuilders(){
  const type = $('#moduleTypeInput').value;
  $('#customFieldBuilderSection').classList.toggle('hidden', type !== 'custom');
  $('#tableBuilderSection').classList.toggle('hidden', type !== 'table');
  $('#fieldBuilderList').innerHTML = fieldDraft.map((f, i)=>`<div class="builder-row"><input value="${escapeHtml(f.label||'')}" placeholder="Field label" data-field-label="${i}" /><select data-field-type="${i}"><option value="text" ${f.type==='text'?'selected':''}>Text</option><option value="number" ${f.type==='number'?'selected':''}>Number</option><option value="dropdown" ${f.type==='dropdown'?'selected':''}>Dropdown</option><option value="toggle" ${f.type==='toggle'?'selected':''}>Toggle</option></select><input value="${escapeHtml(f.options||'')}" placeholder="dropdown options comma,separated" data-field-options="${i}" /><button class="tiny-btn danger" type="button" data-remove-field="${i}">Delete</button></div>`).join('');
  $('#columnBuilderList').innerHTML = columnDraft.map((c,i)=>`<div class="builder-row table"><input value="${escapeHtml(c.label||'')}" placeholder="Column label" data-col-label="${i}" /><select data-col-type="${i}"><option value="text" ${c.type==='text'?'selected':''}>Text</option><option value="number" ${c.type==='number'?'selected':''}>Number</option></select><button class="tiny-btn danger" type="button" data-remove-col="${i}">Delete</button></div>`).join('');
  $$('[data-field-label]').forEach(el=>el.oninput=()=>fieldDraft[+el.dataset.fieldLabel].label = el.value);
  $$('[data-field-type]').forEach(el=>el.onchange=()=>fieldDraft[+el.dataset.fieldType].type = el.value);
  $$('[data-field-options]').forEach(el=>el.oninput=()=>fieldDraft[+el.dataset.fieldOptions].options = el.value);
  $$('[data-remove-field]').forEach(el=>el.onclick=()=>{fieldDraft.splice(+el.dataset.removeField,1); updateModuleBuilders();});
  $$('[data-col-label]').forEach(el=>el.oninput=()=>columnDraft[+el.dataset.colLabel].label = el.value);
  $$('[data-col-type]').forEach(el=>el.onchange=()=>columnDraft[+el.dataset.colType].type = el.value);
  $$('[data-remove-col]').forEach(el=>el.onclick=()=>{columnDraft.splice(+el.dataset.removeCol,1); updateModuleBuilders();});
}
function openEntryModal(entryId='', moduleId=''){
  $('#entryForm').reset(); $('#entryEditId').value = entryId; $('#entryModuleId').value = moduleId;
  $('#entryModalTitle').textContent = entryId ? 'Edit Entry' : 'Add Entry';
  if (entryId) {
    const mod = state.modules.find(m=>m.id===moduleId); const entry = (mod.entries||[]).find(e=>e.id===entryId);
    $('#entryTitleInput').value = entry.title; $('#entryContentInput').value = entry.content || '';
  }
  $('#entryModal').showModal();
}
function openTableRowModal(rowId='', moduleId=''){
  $('#tableRowForm').reset(); $('#tableRowEditId').value = rowId; $('#tableRowModuleId').value = moduleId;
  const mod = state.modules.find(m=>m.id===moduleId); const row = (mod.rows||[]).find(r=>r.id===rowId);
  $('#tableRowTitle').textContent = rowId ? 'Edit Row' : 'Add Row';
  $('#tableRowFields').innerHTML = (mod.columns||[]).map((col,i)=>`<label><span>${escapeHtml(col.label)}</span><input type="${col.type==='number'?'number':'text'}" data-row-input="${i}" value="${escapeHtml(row?.values?.[i] ?? '')}" /></label>`).join('');
  $('#tableRowModal').showModal();
}

function closeModals(){ $$('dialog').forEach(d=>d.open && d.close()); }
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#overlay').classList.add('hidden'); }
function openSidebar(){ $('#sidebar').classList.add('open'); $('#overlay').classList.remove('hidden'); }

// CRUD
$('#gameForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = $('#gameEditId').value;
  const steamAppId = $('#gameSteamInput').value.trim();
  const payload = {
    title: $('#gameTitleInput').value.trim(),
    status: $('#gameStatusInput').value,
    categoryId: $('#gameCategoryInput').value,
    banner: $('#gameBannerInput').value.trim() || steamHeader(steamAppId),
    favorite: $('#gameFavoriteInput').value === 'true',
    steamAppId,
    supportsProfiles: $('#gameSupportsProfilesInput').checked,
    supportsServers: $('#gameSupportsServersInput').checked,
  };
  if (id) Object.assign(findGame(id), payload);
  else state.games.push({id:uid('game'), archived:false, lastViewed:now(), ...payload});
  saveState(); closeModals(); render();
});
$('#categoryForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = $('#categoryEditId').value;
  const payload = {name:$('#categoryNameInput').value.trim(), icon:$('#categoryIconInput').value.trim() || '📁', color:$('#categoryColorInput').value};
  if (id) Object.assign(findCategory(id), payload);
  else state.categories.push({id:uid('cat'), order:state.categories.length, ...payload});
  saveState(); closeModals(); render();
});
$('#profileForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = $('#profileEditId').value;
  const payload = {gameId:$('#profileGameId').value, name:$('#profileNameInput').value.trim(), type:$('#profileTypeInput').value, status:$('#profileStatusInput').value, tag:$('#profileTagInput').value.trim()};
  if (id) Object.assign(findProfile(id), payload);
  else state.profiles.push({id:uid('profile'), archived:false, favorite:false, lastViewed:now(), ...payload});
  saveState(); closeModals(); render();
});
$('#serverForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = $('#serverEditId').value;
  const payload = {gameId:$('#serverGameId').value, name:$('#serverNameInput').value.trim(), template:$('#serverTemplateInput').value, status:$('#serverStatusInput').value, version:$('#serverVersionInput').value.trim(), theme:$('#serverThemeInput').value.trim()};
  if (id) Object.assign(findServer(id), payload);
  else {
    const server = {id:uid('server'), archived:false, favorite:false, lastViewed:now(), ...payload};
    state.servers.push(server);
    applyServerTemplate(state.modules, server.id, server.template);
  }
  saveState(); closeModals(); render();
});
$('#moduleTypeInput').addEventListener('change', updateModuleBuilders);
$('#addFieldBtn').addEventListener('click', ()=>{ fieldDraft.push({id:uid('f'), label:'New Field', type:'text', options:''}); updateModuleBuilders(); });
$('#addColumnBtn').addEventListener('click', ()=>{ columnDraft.push({label:'New Column', type:'text'}); updateModuleBuilders(); });
$('#moduleForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = $('#moduleEditId').value;
  const payload = { ownerType:$('#moduleOwnerType').value, ownerId:$('#moduleOwnerId').value, title:$('#moduleTitleInput').value.trim(), type:$('#moduleTypeInput').value, icon:$('#moduleIconInput').value.trim() || '📦' };
  if (id) {
    const mod = state.modules.find(m=>m.id===id);
    Object.assign(mod, payload);
    if (payload.type === 'custom') { mod.schema = JSON.parse(JSON.stringify(fieldDraft)); mod.values = mod.values || {}; }
    if (payload.type === 'table') { mod.columns = JSON.parse(JSON.stringify(columnDraft)); mod.rows = mod.rows || []; }
    if (payload.type === 'notes' || payload.type === 'checklist') mod.entries = mod.entries || [];
  } else {
    const mod = {id:uid('mod'), ...payload};
    if (payload.type === 'custom') mod.schema = JSON.parse(JSON.stringify(fieldDraft)), mod.values = {};
    if (payload.type === 'table') mod.columns = JSON.parse(JSON.stringify(columnDraft)), mod.rows = [];
    if (payload.type === 'notes' || payload.type === 'checklist') mod.entries = [];
    state.modules.push(mod);
  }
  saveState(); closeModals(); render();
});
$('#entryForm').addEventListener('submit', e=>{
  e.preventDefault();
  const moduleId = $('#entryModuleId').value; const mod = state.modules.find(m=>m.id===moduleId); const id = $('#entryEditId').value;
  const payload = {title:$('#entryTitleInput').value.trim(), content:$('#entryContentInput').value.trim()};
  if (id) Object.assign((mod.entries||[]).find(e=>e.id===id), payload); else mod.entries.push({id:uid('e'), done:false, ...payload});
  saveState(); closeModals(); render();
});
$('#tableRowForm').addEventListener('submit', e=>{
  e.preventDefault();
  const moduleId = $('#tableRowModuleId').value; const mod = state.modules.find(m=>m.id===moduleId); const id = $('#tableRowEditId').value;
  const values = $$('[data-row-input]').map(el=>el.value);
  if (id) Object.assign((mod.rows||[]).find(r=>r.id===id), {values}); else mod.rows.push({id:uid('row'), values});
  saveState(); closeModals(); render();
});

function moveCategory(id, dir){ const cats = sortedCategories(); const idx=cats.findIndex(c=>c.id===id); const other=idx+dir; if(other<0||other>=cats.length)return; [cats[idx].order, cats[other].order] = [cats[other].order, cats[idx].order]; saveState(); render(); }
function deleteCategory(id){ if(!confirm('Delete this category? Games move nowhere, so do this only if you mean it.')) return; const replacement = state.categories.find(c=>c.id!==id); state.games.forEach(g=>{ if(g.categoryId===id && replacement) g.categoryId = replacement.id; }); state.categories = state.categories.filter(c=>c.id!==id); saveState(); render(); }
function toggleArchiveGame(id){ const g=findGame(id); g.archived=!g.archived; saveState(); render(); }
function deleteGame(id){ if(!confirm('Delete this game and all its profiles/servers/modules?')) return; const profileIds=state.profiles.filter(p=>p.gameId===id).map(p=>p.id); const serverIds=state.servers.filter(s=>s.gameId===id).map(s=>s.id); state.games=state.games.filter(g=>g.id!==id); state.profiles=state.profiles.filter(p=>p.gameId!==id); state.servers=state.servers.filter(s=>s.gameId!==id); state.modules=state.modules.filter(m=>!(profileIds.includes(m.ownerId)||serverIds.includes(m.ownerId))); state.recents=state.recents.filter(r=>!r.endsWith(`:${id}`)&&!profileIds.some(pid=>r.endsWith(`:${pid}`))&&!serverIds.some(sid=>r.endsWith(`:${sid}`))); setView('home'); saveState(); }
function toggleArchiveOwner(type,id){ const owner=type==='profile'?findProfile(id):findServer(id); owner.archived=!owner.archived; saveState(); render(); }
function deleteOwner(type,id){ if(!confirm(`Delete this ${type}?`)) return; if(type==='profile') state.profiles=state.profiles.filter(p=>p.id!==id); else state.servers=state.servers.filter(s=>s.id!==id); state.modules=state.modules.filter(m=>!(m.ownerType===type && m.ownerId===id)); const gameId = type==='profile'? findProfile(id)?.gameId : findServer(id)?.gameId; saveState(); setView('game',{gameId: gameId || state.currentView.gameId}); }
function cloneOwner(type,id){
  const source = type==='profile'?findProfile(id):findServer(id);
  const copy = JSON.parse(JSON.stringify(source)); copy.id = uid(type); copy.name += ' Copy'; copy.lastViewed = now(); copy.archived = false; state[type==='profile'?'profiles':'servers'].push(copy);
  modulesFor(type,id).forEach(mod=>{ const mc = JSON.parse(JSON.stringify(mod)); mc.id=uid('mod'); mc.ownerId=copy.id; if(mc.entries) mc.entries=mc.entries.map(e=>({...e,id:uid('e')})); if(mc.rows) mc.rows=mc.rows.map(r=>({...r,id:uid('row')})); if(mc.schema) mc.schema=mc.schema.map(f=>({...f,id:uid('f')})); state.modules.push(mc); });
  saveState(); render();
}
function cloneModule(id){ const mod = state.modules.find(m=>m.id===id); const copy=JSON.parse(JSON.stringify(mod)); copy.id=uid('mod'); copy.title += ' Copy'; if(copy.entries) copy.entries=copy.entries.map(e=>({...e,id:uid('e')})); if(copy.rows) copy.rows=copy.rows.map(r=>({...r,id:uid('row')})); if(copy.schema) copy.schema=copy.schema.map(f=>({...f,id:uid('f')})); state.modules.push(copy); saveState(); render(); }
function deleteModule(id){ if(!confirm('Delete this module?')) return; state.modules=state.modules.filter(m=>m.id!==id); saveState(); render(); }
function moveModule(ownerType, ownerId, moduleId, dir){ const mods = modulesFor(ownerType, ownerId); const idx = mods.findIndex(m=>m.id===moduleId); const other = idx+dir; if(other<0||other>=mods.length)return; const ids = mods.map(m=>m.id); [ids[idx], ids[other]] = [ids[other], ids[idx]]; const kept = state.modules.filter(m=>!(m.ownerType===ownerType && m.ownerId===ownerId)); state.modules = [...kept, ...ids.map(id=>mods.find(m=>m.id===id))]; saveState(); render(); }
function deleteEntry(moduleId, entryId){ const mod=state.modules.find(m=>m.id===moduleId); mod.entries = (mod.entries||[]).filter(e=>e.id!==entryId); saveState(); render(); }
function toggleChecklistEntry(moduleId, entryId){ const mod=state.modules.find(m=>m.id===moduleId); const entry=(mod.entries||[]).find(e=>e.id===entryId); entry.done=!entry.done; saveState(); }
function updateCustomValue(moduleId, fieldId, value){ const mod=state.modules.find(m=>m.id===moduleId); mod.values = mod.values || {}; mod.values[fieldId] = value; saveState(); }
function deleteRow(moduleId,rowId){ const mod=state.modules.find(m=>m.id===moduleId); mod.rows = (mod.rows||[]).filter(r=>r.id!==rowId); saveState(); render(); }

// global ui
$('#openSidebarBtn').onclick = openSidebar;
$('#closeSidebarBtn').onclick = closeSidebar;
$('#overlay').onclick = closeSidebar;
$$('[data-view]').forEach(btn=>btn.onclick = ()=>{ closeSidebar(); setView(btn.dataset.view); });
$('#addGameBtn').onclick = ()=>openGameModal();
$('#openCategoryManagerBtn').onclick = ()=>$('#categoryManagerModal').showModal();
$('#addCategoryBtn').onclick = ()=>openCategoryModal();
$$('[data-close]').forEach(btn=>btn.onclick = ()=>document.getElementById(btn.dataset.close).close());
$('#searchInput').addEventListener('input', ()=>{ if(state.currentView.name!=='home') setView('home'); else renderHome(); });
$('#exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'game-codex-v7-backup.json'; a.click();
};
$('#importInput').onchange = (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const r = new FileReader(); r.onload = ()=>{ try { state = JSON.parse(r.result); saveState(); render(); } catch { alert('That backup file is busted.'); } }; r.readAsText(file);
};
$('#resetBtn').onclick = ()=>{ if(confirm('Reset back to the demo library?')) { state = defaultState(); saveState(); render(); } };

if ('serviceWorker' in navigator) { window.addEventListener('load', ()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
render();
