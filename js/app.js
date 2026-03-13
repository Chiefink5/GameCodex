(() => {
  const STORAGE_KEY = 'game_codex_v4';
  const THEME_KEY = 'game_codex_theme_v4';
  const defaultTemplates = window.GAME_CODEX_DEFAULT_TEMPLATES;
  const defaultTheme = { gold: '#d4af37', purple: '#3d2d63', bg: '#0f0c14' };

  const starterState = {
    categories: [
      { id: 'cat_sandbox', name: 'Sandbox / Creative', icon: '🧱', defaultTemplateId: 'sandbox' },
      { id: 'cat_automation', name: 'Automation / Factory', icon: '⚙️', defaultTemplateId: 'automation' },
      { id: 'cat_life', name: 'Life Sim / Business', icon: '🏙️', defaultTemplateId: 'lifeSim' },
      { id: 'cat_rpg', name: 'Open World RPG', icon: '🗡️', defaultTemplateId: 'openWorldRpg' },
      { id: 'cat_survival', name: 'Survival / Exploration', icon: '🔥', defaultTemplateId: 'survival' },
      { id: 'cat_sim', name: 'Simulation / Systems', icon: '🖥️', defaultTemplateId: 'blank' },
      { id: 'cat_odd', name: 'Experimental / Oddball', icon: '🧪', defaultTemplateId: 'blank' }
    ],
    templates: [
      {
        id: 'tpl_sat_run',
        name: 'Satisfactory Run',
        description: 'Factory-first layout with one extra expansion module.',
        system: false,
        modules: [
          { type: 'checklist', title: 'Factory Goals', icon: '✔' },
          { type: 'resource', title: 'Resource Tracker', icon: '📦' },
          { type: 'production', title: 'Production Tracker', icon: '⚙️' },
          { type: 'notes', title: 'Expansion Plans', icon: '🗺️' },
          { type: 'notes', title: 'Bottlenecks / Problems', icon: '⚠️' },
          { type: 'locations', title: 'Locations', icon: '📍' }
        ]
      }
    ],
    games: [],
    modules: [],
    entries: [],
    recentGameIds: [],
    favoriteGameIds: []
  };

  let state = loadState();
  let currentView = { type: 'home' };
  let searchQuery = '';

  const els = mapElements();

  init();

  function init() {
    applyTheme(loadTheme());
    wireEvents();
    ensureDemoGames();
    syncTemplateSelects();
    syncCategorySelect();
    render();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  function mapElements() {
    const q = (s) => document.querySelector(s);
    return {
      sidebar: q('#sidebar'), overlay: q('#overlay'), openSidebarBtn: q('#openSidebarBtn'), closeSidebarBtn: q('#closeSidebarBtn'),
      sidebarCategories: q('#sidebarCategories'), viewTitle: q('#viewTitle'), searchInput: q('#searchInput'),
      homeView: q('#homeView'), categoryView: q('#categoryView'), gameView: q('#gameView'), favoritesView: q('#favoritesView'), templatesView: q('#templatesView'),
      addGameBtn: q('#addGameBtn'), exportBtn: q('#exportBtn'), importInput: q('#importInput'), resetBtn: q('#resetBtn'), openThemeBtn: q('#openThemeBtn'), openTemplateBtn: q('#openTemplateBtn'),
      gameModal: q('#gameModal'), gameModalTitle: q('#gameModalTitle'), gameForm: q('#gameForm'), gameEditId: q('#gameEditId'), gameTitleInput: q('#gameTitleInput'), gameStatusSelect: q('#gameStatusSelect'), gameCategorySelect: q('#gameCategorySelect'), gameTemplateSelect: q('#gameTemplateSelect'), steamAppIdInput: q('#steamAppIdInput'), bannerUrlInput: q('#bannerUrlInput'), bannerFileInput: q('#bannerFileInput'),
      moduleModal: q('#moduleModal'), moduleModalTitle: q('#moduleModalTitle'), moduleForm: q('#moduleForm'), moduleEditId: q('#moduleEditId'), moduleGameId: q('#moduleGameId'), moduleTypeSelect: q('#moduleTypeSelect'), moduleIconInput: q('#moduleIconInput'), moduleTitleInput: q('#moduleTitleInput'),
      entryModal: q('#entryModal'), entryModalTitle: q('#entryModalTitle'), entryForm: q('#entryForm'), entryEditId: q('#entryEditId'), entryModuleId: q('#entryModuleId'), entryModuleType: q('#entryModuleType'), entryTitleInput: q('#entryTitleInput'), entryContentInput: q('#entryContentInput'),
      templateModal: q('#templateModal'), templateModalTitle: q('#templateModalTitle'), templateForm: q('#templateForm'), templateEditId: q('#templateEditId'), templateNameInput: q('#templateNameInput'), templateDescriptionInput: q('#templateDescriptionInput'), templateBaseSelect: q('#templateBaseSelect'), templateModuleBuilder: q('#templateModuleBuilder'), addTemplateModuleBtn: q('#addTemplateModuleBtn'),
      themeModal: q('#themeModal'), themeForm: q('#themeForm'), goldInput: q('#goldInput'), purpleInput: q('#purpleInput'), bgInput: q('#bgInput')
    };
  }

  function wireEvents() {
    els.openSidebarBtn.addEventListener('click', openSidebar);
    els.closeSidebarBtn.addEventListener('click', closeSidebar);
    els.overlay.addEventListener('click', closeSidebar);
    document.querySelectorAll('[data-nav-view]').forEach(btn => btn.addEventListener('click', () => switchView({ type: btn.dataset.navView })));
    document.querySelectorAll('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => closeDialog(btn.dataset.closeDialog)));

    els.searchInput.addEventListener('input', e => { searchQuery = e.target.value.trim().toLowerCase(); render(); });
    els.addGameBtn.addEventListener('click', () => openGameModal());
    els.openThemeBtn.addEventListener('click', () => els.themeModal.showModal());
    els.openTemplateBtn.addEventListener('click', () => openTemplateModal());
    els.exportBtn.addEventListener('click', exportBackup);
    els.importInput.addEventListener('change', importBackup);
    els.resetBtn.addEventListener('click', () => { if (confirm('Reset back to clean demo data?')) { localStorage.removeItem(STORAGE_KEY); state = loadState(true); ensureDemoGames(); render(); } });

    els.gameCategorySelect.addEventListener('change', () => {
      const cat = state.categories.find(c => c.id === els.gameCategorySelect.value);
      if (cat && !els.gameEditId.value) els.gameTemplateSelect.value = cat.defaultTemplateId || 'blank';
    });

    els.gameForm.addEventListener('submit', async (e) => { e.preventDefault(); await saveGameFromForm(); });
    els.moduleForm.addEventListener('submit', (e) => { e.preventDefault(); saveModuleFromForm(); });
    els.entryForm.addEventListener('submit', (e) => { e.preventDefault(); saveEntryFromForm(); });
    els.themeForm.addEventListener('submit', (e) => { e.preventDefault(); saveTheme(); });
    els.templateForm.addEventListener('submit', (e) => { e.preventDefault(); saveTemplateFromForm(); });
    els.addTemplateModuleBtn.addEventListener('click', () => appendTemplateModuleRow());

    document.addEventListener('click', handleActionClick);
  }

  function handleActionClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, gameId, moduleId, entryId, templateId } = btn.dataset;
    if (action === 'open-category') switchView({ type: 'category', id });
    if (action === 'open-game') openGame(id);
    if (action === 'toggle-favorite') toggleFavorite(id);
    if (action === 'edit-game') openGameModal(id);
    if (action === 'delete-game') deleteGame(id);
    if (action === 'add-module') openModuleModal(gameId);
    if (action === 'edit-module') openModuleModal(gameId, moduleId);
    if (action === 'delete-module') deleteModule(moduleId);
    if (action === 'move-module-up') moveModule(moduleId, -1);
    if (action === 'move-module-down') moveModule(moduleId, 1);
    if (action === 'add-entry') openEntryModal(moduleId);
    if (action === 'edit-entry') openEntryModal(moduleId, entryId);
    if (action === 'delete-entry') deleteEntry(entryId);
    if (action === 'toggle-check') toggleChecklist(entryId);
    if (action === 'edit-template') openTemplateModal(templateId);
    if (action === 'delete-template') deleteTemplate(templateId);
    if (action === 'clone-template') cloneTemplate(templateId);
    if (action === 'use-template') openGameModal('', templateId);
  }

  function switchView(view) {
    currentView = view;
    closeSidebar();
    render();
  }

  function openSidebar() { els.sidebar.classList.remove('closed'); els.overlay.classList.remove('hidden'); }
  function closeSidebar() { els.sidebar.classList.add('closed'); els.overlay.classList.add('hidden'); }
  function closeDialog(id) { const el = document.getElementById(id); if (el?.open) el.close(); }

  function render() {
    renderSidebarCategories();
    renderViews();
    saveState();
  }

  function renderSidebarCategories() {
    els.sidebarCategories.innerHTML = state.categories.map(cat => `<button class="nav-btn" data-action="open-category" data-id="${cat.id}">${cat.icon} ${escapeHtml(cat.name)}</button>`).join('');
  }

  function renderViews() {
    hideAllViews();
    highlightNav();
    if (searchQuery) return renderSearch();
    if (currentView.type === 'home') return renderHome();
    if (currentView.type === 'favorites') return renderFavorites();
    if (currentView.type === 'templates') return renderTemplates();
    if (currentView.type === 'category') return renderCategory(currentView.id);
    if (currentView.type === 'game') return renderGame(currentView.id);
    renderHome();
  }

  function hideAllViews() { [els.homeView, els.categoryView, els.gameView, els.favoritesView, els.templatesView].forEach(v => v.classList.add('hidden')); }
  function highlightNav() {
    document.querySelectorAll('[data-nav-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.navView === currentView.type));
  }

  function renderHome() {
    els.viewTitle.textContent = 'Game Codex';
    els.homeView.classList.remove('hidden');
    const recent = state.recentGameIds.map(id => getGame(id)).filter(Boolean).slice(0, 3);
    const kpis = [
      ['Tracked Games', state.games.length],
      ['Custom Templates', state.templates.filter(t => !t.system).length],
      ['Favorites', state.favoriteGameIds.length],
      ['Entries', state.entries.length]
    ];
    els.homeView.innerHTML = `
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Dashboard</div><h3>Royal command center</h3></div></div>
        <div class="kpi-grid">${kpis.map(([l,v]) => `<div class="kpi"><div class="eyebrow">${l}</div><h3>${v}</h3></div>`).join('')}</div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Quick Access</div><h3>Recent 3</h3></div></div>
        <div class="recent-grid">${recent.length ? recent.map(renderRecentCard).join('') : empty('Open some games and they show up here.')}</div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Categories</div><h3>Track what matters</h3></div></div>
        <div class="categories-grid">${state.categories.map(renderCategoryCard).join('')}</div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Templates</div><h3>Launch faster</h3></div><button class="secondary-btn" data-action="use-template" data-template-id="blank">Use Blank</button></div>
        <div class="templates-grid">${allTemplates().slice(0, 4).map(renderTemplateCard).join('')}</div>
      </section>`;
  }

  function renderFavorites() {
    els.viewTitle.textContent = 'Favorites';
    els.favoritesView.classList.remove('hidden');
    const games = state.favoriteGameIds.map(id => getGame(id)).filter(Boolean);
    els.favoritesView.innerHTML = `<section class="section"><div class="section-head"><div><div class="eyebrow">Pinned</div><h3>Favorite games</h3></div></div><div class="favorites-grid">${games.length ? games.map(renderGameCard).join('') : empty('No favorites yet. Star the ones you actually care about.')}</div></section>`;
  }

  function renderTemplates() {
    els.viewTitle.textContent = 'Templates';
    els.templatesView.classList.remove('hidden');
    const templates = allTemplates();
    els.templatesView.innerHTML = `
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Template Forge</div><h3>System + custom templates</h3></div><button class="primary-btn" id="inlineTemplateBtn">+ New Template</button></div>
        <div class="templates-grid">${templates.map(renderTemplateCard).join('')}</div>
      </section>`;
    document.getElementById('inlineTemplateBtn').addEventListener('click', () => openTemplateModal());
  }

  function renderCategory(categoryId) {
    const cat = state.categories.find(c => c.id === categoryId);
    if (!cat) return renderHome();
    els.viewTitle.textContent = cat.name;
    els.categoryView.classList.remove('hidden');
    const games = state.games.filter(g => g.categoryId === categoryId);
    els.categoryView.innerHTML = `<section class="section"><div class="section-head"><div><div class="eyebrow">${cat.icon} Category</div><h3>${escapeHtml(cat.name)}</h3></div><button class="primary-btn" data-action="open-category" data-id="${categoryId}" disabled>${games.length} games</button></div><div class="section-grid">${games.length ? games.map(renderGameCard).join('') : empty('No games here yet. Add one and use the category default template.')}</div></section>`;
  }

  function renderGame(gameId) {
    const game = getGame(gameId);
    if (!game) return renderHome();
    els.viewTitle.textContent = game.title;
    els.gameView.classList.remove('hidden');
    const category = state.categories.find(c => c.id === game.categoryId);
    const modules = getModulesForGame(game.id);
    els.gameView.innerHTML = `
      <section class="section game-card">
        <div class="game-banner ${game.banner ? '' : 'empty'}" style="${game.banner ? `background-image:url('${escapeAttribute(game.banner)}')` : ''}">
          ${game.banner ? `<div class="banner-overlay"><div class="eyebrow">${escapeHtml(category?.name || 'Game')}</div><h3>${escapeHtml(game.title)}</h3></div>` : '<div>Upload a banner or use a Steam App ID</div>'}
        </div>
        <div class="split-row"><div><div class="eyebrow">${escapeHtml(category?.name || 'Unknown')}</div><h2>${escapeHtml(game.title)}</h2><div class="tag-row"><span class="chip">${escapeHtml(game.status)}</span>${game.steamAppId ? `<span class="chip">Steam ${escapeHtml(game.steamAppId)}</span>` : ''}${game.templateId ? `<span class="chip">${escapeHtml(getTemplate(game.templateId)?.name || 'Template')}</span>` : ''}</div></div><div class="inline-actions"><button class="icon-btn" data-action="toggle-favorite" data-id="${game.id}">${isFavorite(game.id) ? '★' : '☆'}</button><button class="secondary-btn" data-action="edit-game" data-id="${game.id}">Edit Game</button><button class="danger-btn" data-action="delete-game" data-id="${game.id}">Delete Game</button></div></div>
      </section>
      <section class="section">
        <div class="section-head"><div><div class="eyebrow">Modules</div><h3>Game brain</h3></div><button class="primary-btn" data-action="add-module" data-game-id="${game.id}">+ Add Module</button></div>
        <div class="module-stack">${modules.length ? modules.map(m => renderModuleCard(m, game.id)).join('') : empty('No modules yet. Add one or rebuild the game from a better template.')}</div>
      </section>`;
  }

  function renderSearch() {
    els.viewTitle.textContent = `Search: ${searchQuery}`;
    els.homeView.classList.remove('hidden');
    const matchedGames = state.games.filter(g => `${g.title} ${g.status}`.toLowerCase().includes(searchQuery));
    const matchedModules = state.modules.filter(m => `${m.title} ${m.type}`.toLowerCase().includes(searchQuery));
    const matchedEntries = state.entries.filter(en => `${en.title} ${en.content || ''}`.toLowerCase().includes(searchQuery));
    els.homeView.innerHTML = `
      <section class="section"><div class="section-head"><div><div class="eyebrow">Search Results</div><h3>${searchQuery}</h3></div></div>
      <div class="search-grid">
        ${matchedGames.map(g => `<div class="search-card"><div class="eyebrow">Game</div><h4>${escapeHtml(g.title)}</h4><div class="muted">${escapeHtml(g.status)}</div><div class="inline-actions"><button class="secondary-btn" data-action="open-game" data-id="${g.id}">Open</button></div></div>`).join('')}
        ${matchedModules.map(m => `<div class="search-card"><div class="eyebrow">Module</div><h4>${escapeHtml(m.title)}</h4><div class="muted">${escapeHtml(getGame(m.gameId)?.title || '')}</div><div class="inline-actions"><button class="secondary-btn" data-action="open-game" data-id="${m.gameId}">Open Game</button></div></div>`).join('')}
        ${matchedEntries.map(en => `<div class="search-card"><div class="eyebrow">Entry</div><h4>${escapeHtml(en.title)}</h4><div class="muted">${escapeHtml(getModule(en.moduleId)?.title || '')}</div><div class="tiny">${escapeHtml((en.content || '').slice(0, 120))}</div><div class="inline-actions"><button class="secondary-btn" data-action="open-game" data-id="${getModule(en.moduleId)?.gameId || ''}">Open Game</button></div></div>`).join('')}
        ${(!matchedGames.length && !matchedModules.length && !matchedEntries.length) ? empty('Nothing matched. Your search may just suck, or the data is not there yet.') : ''}
      </div></section>`;
  }

  function renderRecentCard(game) {
    return `<button class="recent-card" data-action="open-game" data-id="${game.id}"><div class="eyebrow">Recent</div><h4>${escapeHtml(game.title)}</h4><div class="muted">${escapeHtml(game.status)}</div></button>`;
  }
  function renderCategoryCard(cat) {
    const count = state.games.filter(g => g.categoryId === cat.id).length;
    return `<button class="category-card" data-action="open-category" data-id="${cat.id}"><div class="eyebrow">${cat.icon} Category</div><h4>${escapeHtml(cat.name)}</h4><div class="muted">${count} tracked</div></button>`;
  }
  function renderGameCard(game) {
    const category = state.categories.find(c => c.id === game.categoryId);
    return `<div class="game-card"><div class="eyebrow">${escapeHtml(category?.name || '')}</div><h4>${escapeHtml(game.title)}</h4><div class="tag-row"><span class="chip">${escapeHtml(game.status)}</span>${isFavorite(game.id) ? '<span class="chip">favorite</span>' : ''}</div><div class="inline-actions"><button class="secondary-btn" data-action="open-game" data-id="${game.id}">Open</button><button class="icon-btn" data-action="toggle-favorite" data-id="${game.id}">${isFavorite(game.id) ? '★' : '☆'}</button></div></div>`;
  }
  function renderTemplateCard(template) {
    return `<div class="template-card"><div class="eyebrow">${template.system ? 'System Template' : 'Custom Template'}</div><h4>${escapeHtml(template.name)}</h4><div class="muted">${escapeHtml(template.description || 'No description')}</div><div class="tag-row">${template.modules.slice(0,4).map(m => `<span class="chip">${escapeHtml(m.title)}</span>`).join('')}</div><div class="inline-actions"><button class="secondary-btn" data-action="use-template" data-template-id="${template.id}">Use</button><button class="secondary-btn" data-action="clone-template" data-template-id="${template.id}">Clone</button><button class="secondary-btn" data-action="edit-template" data-template-id="${template.id}">Edit</button>${template.system ? '' : `<button class="danger-btn" data-action="delete-template" data-template-id="${template.id}">Delete</button>`}</div></div>`;
  }

  function renderModuleCard(module, gameId) {
    const entries = getEntriesForModule(module.id);
    return `<div class="module-card"><div class="module-head"><div><div class="eyebrow">${escapeHtml(module.type)}</div><h4>${escapeHtml(module.icon || '📜')} ${escapeHtml(module.title)}</h4></div><div class="module-actions"><button class="secondary-btn" data-action="move-module-up" data-module-id="${module.id}">↑</button><button class="secondary-btn" data-action="move-module-down" data-module-id="${module.id}">↓</button><button class="secondary-btn" data-action="edit-module" data-game-id="${gameId}" data-module-id="${module.id}">Edit</button><button class="danger-btn" data-action="delete-module" data-module-id="${module.id}">Delete</button></div></div><div class="entry-list">${entries.length ? entries.map(en => renderEntry(module, en)).join('') : empty('No entries yet.')}</div><div class="inline-actions"><button class="primary-btn" data-action="add-entry" data-module-id="${module.id}">+ Add Entry</button></div></div>`;
  }

  function renderEntry(module, entry) {
    const check = module.type === 'checklist';
    return `<div class="entry ${check ? 'check' : ''} ${entry.completed ? 'complete' : ''}">${check ? `<input type="checkbox" ${entry.completed ? 'checked' : ''} data-action="toggle-check" data-entry-id="${entry.id}" />` : ''}<div><strong>${escapeHtml(entry.title)}</strong>${entry.content ? `<div class="entry-copy">${escapeHtml(entry.content)}</div>` : ''}<div class="entry-actions"><button class="secondary-btn" data-action="edit-entry" data-module-id="${module.id}" data-entry-id="${entry.id}">Edit</button><button class="danger-btn" data-action="delete-entry" data-entry-id="${entry.id}">Delete</button></div></div></div>`;
  }

  function empty(text) { return `<div class="empty-state">${escapeHtml(text)}</div>`; }

  function openGame(gameId) {
    const game = getGame(gameId);
    if (!game) return;
    touchRecent(gameId);
    currentView = { type: 'game', id: gameId };
    render();
  }

  function touchRecent(gameId) {
    state.recentGameIds = [gameId, ...state.recentGameIds.filter(id => id !== gameId)].slice(0,3);
  }

  function isFavorite(gameId) { return state.favoriteGameIds.includes(gameId); }
  function toggleFavorite(gameId) {
    state.favoriteGameIds = isFavorite(gameId) ? state.favoriteGameIds.filter(id => id !== gameId) : [gameId, ...state.favoriteGameIds];
    render();
  }

  function openGameModal(gameId = '', forcedTemplateId = '') {
    syncCategorySelect();
    syncTemplateSelects();
    els.gameForm.reset();
    els.gameEditId.value = '';
    els.bannerFileInput.value = '';
    els.gameModalTitle.textContent = gameId ? 'Edit Game' : 'Add Game';
    if (gameId) {
      const game = getGame(gameId);
      if (!game) return;
      els.gameEditId.value = game.id;
      els.gameTitleInput.value = game.title;
      els.gameStatusSelect.value = game.status;
      els.gameCategorySelect.value = game.categoryId;
      els.gameTemplateSelect.value = game.templateId || 'blank';
      els.steamAppIdInput.value = game.steamAppId || '';
      els.bannerUrlInput.value = game.banner && !game.banner.startsWith('data:') ? game.banner : '';
    } else {
      const firstCat = state.categories[0];
      els.gameCategorySelect.value = firstCat?.id || '';
      els.gameTemplateSelect.value = forcedTemplateId || firstCat?.defaultTemplateId || 'blank';
    }
    els.gameModal.showModal();
  }

  async function saveGameFromForm() {
    const editId = els.gameEditId.value;
    const bannerUpload = await fileToDataUrl(els.bannerFileInput.files[0]);
    const title = els.gameTitleInput.value.trim();
    const categoryId = els.gameCategorySelect.value;
    const templateId = els.gameTemplateSelect.value;
    const steamAppId = els.steamAppIdInput.value.trim();
    let banner = bannerUpload || els.bannerUrlInput.value.trim();
    if (!banner && steamAppId) banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
    if (editId) {
      const game = getGame(editId);
      if (!game) return;
      game.title = title; game.status = els.gameStatusSelect.value; game.categoryId = categoryId; game.templateId = templateId; game.steamAppId = steamAppId; if (banner) game.banner = banner;
    } else {
      const game = { id: uid('game'), title, status: els.gameStatusSelect.value, categoryId, templateId, steamAppId, banner, createdAt: Date.now() };
      state.games.unshift(game);
      instantiateTemplate(game.id, templateId);
      touchRecent(game.id);
      currentView = { type: 'game', id: game.id };
    }
    closeDialog('gameModal');
    render();
  }

  function instantiateTemplate(gameId, templateId) {
    const template = getTemplate(templateId) || getTemplate('blank');
    const currentMods = state.modules.filter(m => m.gameId === gameId);
    if (currentMods.length) return;
    template.modules.forEach((m, index) => {
      state.modules.push({ id: uid('mod'), gameId, type: m.type, title: m.title, icon: m.icon || '📜', order: index });
    });
  }

  function openModuleModal(gameId, moduleId = '') {
    els.moduleForm.reset();
    els.moduleEditId.value = '';
    els.moduleGameId.value = gameId;
    els.moduleModalTitle.textContent = moduleId ? 'Edit Module' : 'Add Module';
    if (moduleId) {
      const mod = getModule(moduleId);
      if (!mod) return;
      els.moduleEditId.value = mod.id;
      els.moduleTypeSelect.value = mod.type;
      els.moduleIconInput.value = mod.icon || '';
      els.moduleTitleInput.value = mod.title;
    }
    els.moduleModal.showModal();
  }

  function saveModuleFromForm() {
    const editId = els.moduleEditId.value;
    if (editId) {
      const mod = getModule(editId);
      if (!mod) return;
      mod.type = els.moduleTypeSelect.value; mod.icon = els.moduleIconInput.value.trim() || defaultIconFor(mod.type); mod.title = els.moduleTitleInput.value.trim();
    } else {
      const gameModules = getModulesForGame(els.moduleGameId.value);
      state.modules.push({ id: uid('mod'), gameId: els.moduleGameId.value, type: els.moduleTypeSelect.value, title: els.moduleTitleInput.value.trim(), icon: els.moduleIconInput.value.trim() || defaultIconFor(els.moduleTypeSelect.value), order: gameModules.length });
    }
    closeDialog('moduleModal');
    render();
  }

  function deleteModule(moduleId) {
    if (!confirm('Delete this module and its entries?')) return;
    state.modules = state.modules.filter(m => m.id !== moduleId);
    state.entries = state.entries.filter(e => e.moduleId !== moduleId);
    render();
  }

  function moveModule(moduleId, delta) {
    const mod = getModule(moduleId); if (!mod) return;
    const mods = getModulesForGame(mod.gameId);
    const idx = mods.findIndex(m => m.id === moduleId); const swap = idx + delta;
    if (swap < 0 || swap >= mods.length) return;
    const a = mods[idx], b = mods[swap];
    [a.order, b.order] = [b.order, a.order];
    render();
  }

  function openEntryModal(moduleId, entryId = '') {
    els.entryForm.reset();
    els.entryEditId.value = '';
    els.entryModuleId.value = moduleId;
    els.entryModuleType.value = getModule(moduleId)?.type || 'notes';
    els.entryModalTitle.textContent = entryId ? 'Edit Entry' : 'Add Entry';
    if (entryId) {
      const entry = getEntry(entryId); if (!entry) return;
      els.entryEditId.value = entry.id; els.entryTitleInput.value = entry.title; els.entryContentInput.value = entry.content || '';
    }
    els.entryModal.showModal();
  }

  function saveEntryFromForm() {
    const editId = els.entryEditId.value;
    if (editId) {
      const entry = getEntry(editId); if (!entry) return;
      entry.title = els.entryTitleInput.value.trim(); entry.content = els.entryContentInput.value.trim();
    } else {
      state.entries.push({ id: uid('entry'), moduleId: els.entryModuleId.value, title: els.entryTitleInput.value.trim(), content: els.entryContentInput.value.trim(), completed: false });
    }
    closeDialog('entryModal');
    render();
  }

  function deleteEntry(entryId) {
    state.entries = state.entries.filter(e => e.id !== entryId);
    render();
  }

  function toggleChecklist(entryId) {
    const entry = getEntry(entryId); if (!entry) return;
    entry.completed = !entry.completed;
    render();
  }

  function openTemplateModal(templateId = '') {
    syncTemplateBaseSelect();
    els.templateForm.reset();
    els.templateEditId.value = '';
    els.templateModuleBuilder.innerHTML = '';
    els.templateModalTitle.textContent = templateId ? 'Edit Template' : 'Create Template';
    if (templateId) {
      const template = getTemplate(templateId); if (!template) return;
      els.templateEditId.value = template.id;
      els.templateNameInput.value = template.name;
      els.templateDescriptionInput.value = template.description || '';
      els.templateBaseSelect.value = template.id;
      template.modules.forEach(m => appendTemplateModuleRow(m));
    } else {
      els.templateBaseSelect.value = 'blank';
      defaultTemplates.blank.modules.forEach(m => appendTemplateModuleRow(m));
    }
    els.templateModal.showModal();
  }

  function appendTemplateModuleRow(module = { title: '', type: 'notes', icon: '📜' }) {
    const row = document.createElement('div');
    row.className = 'builder-row';
    row.innerHTML = `
      <div class="builder-row-grid">
        <input class="small-input" data-role="title" placeholder="Module title" value="${escapeAttribute(module.title || '')}" />
        <select class="small-select" data-role="type">
          ${['notes','checklist','resource','production','locations'].map(t => `<option value="${t}" ${module.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <input class="small-input" data-role="icon" maxlength="4" value="${escapeAttribute(module.icon || defaultIconFor(module.type))}" />
        <button type="button" class="danger-btn" data-role="remove">Delete</button>
      </div>`;
    row.querySelector('[data-role="remove"]').addEventListener('click', () => row.remove());
    els.templateModuleBuilder.appendChild(row);
  }

  function saveTemplateFromForm() {
    const modules = [...els.templateModuleBuilder.querySelectorAll('.builder-row')].map(row => ({
      title: row.querySelector('[data-role="title"]').value.trim(),
      type: row.querySelector('[data-role="type"]').value,
      icon: row.querySelector('[data-role="icon"]').value.trim() || defaultIconFor(row.querySelector('[data-role="type"]').value)
    })).filter(m => m.title);
    if (!modules.length) return alert('Need at least one module in the template.');
    const editId = els.templateEditId.value;
    if (editId && defaultTemplates[editId]) return alert('System templates cannot be overwritten. Clone one instead.');
    if (editId) {
      const tpl = state.templates.find(t => t.id === editId); if (!tpl) return;
      tpl.name = els.templateNameInput.value.trim(); tpl.description = els.templateDescriptionInput.value.trim(); tpl.modules = modules;
    } else {
      state.templates.unshift({ id: uid('tpl'), name: els.templateNameInput.value.trim(), description: els.templateDescriptionInput.value.trim(), modules, system: false });
    }
    syncTemplateSelects();
    closeDialog('templateModal');
    render();
  }

  function deleteTemplate(templateId) {
    const tpl = state.templates.find(t => t.id === templateId);
    if (!tpl || tpl.system) return;
    if (!confirm('Delete this custom template?')) return;
    state.templates = state.templates.filter(t => t.id !== templateId);
    state.games.forEach(g => { if (g.templateId === templateId) g.templateId = 'blank'; });
    syncTemplateSelects();
    render();
  }

  function cloneTemplate(templateId) {
    const tpl = getTemplate(templateId); if (!tpl) return;
    openTemplateModal();
    els.templateNameInput.value = `${tpl.name} Copy`;
    els.templateDescriptionInput.value = tpl.description || '';
    els.templateModuleBuilder.innerHTML = '';
    tpl.modules.forEach(m => appendTemplateModuleRow(m));
  }

  function syncTemplateSelects() {
    const options = allTemplates().map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    els.gameTemplateSelect.innerHTML = options;
  }

  function syncTemplateBaseSelect() {
    els.templateBaseSelect.innerHTML = allTemplates().map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    els.templateBaseSelect.onchange = () => {
      const base = getTemplate(els.templateBaseSelect.value);
      if (!base || els.templateEditId.value) return;
      els.templateModuleBuilder.innerHTML = '';
      base.modules.forEach(m => appendTemplateModuleRow(m));
    };
  }

  function syncCategorySelect() {
    els.gameCategorySelect.innerHTML = state.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
  }

  function saveTheme() {
    const theme = { gold: els.goldInput.value, purple: els.purpleInput.value, bg: els.bgInput.value };
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    applyTheme(theme);
    closeDialog('themeModal');
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--gold', theme.gold);
    root.style.setProperty('--purple', theme.purple);
    root.style.setProperty('--bg', theme.bg);
    els.goldInput.value = theme.gold; els.purpleInput.value = theme.purple; els.bgInput.value = theme.bg;
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'game-codex-v4-backup.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        state = normalizeState(parsed);
        syncCategorySelect(); syncTemplateSelects(); render();
      } catch { alert('Import failed. That file is garbage or not from Game Codex.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function deleteGame(gameId) {
    if (!confirm('Delete this game and all its data?')) return;
    const moduleIds = state.modules.filter(m => m.gameId === gameId).map(m => m.id);
    state.games = state.games.filter(g => g.id !== gameId);
    state.modules = state.modules.filter(m => m.gameId !== gameId);
    state.entries = state.entries.filter(e => !moduleIds.includes(e.moduleId));
    state.recentGameIds = state.recentGameIds.filter(id => id !== gameId);
    state.favoriteGameIds = state.favoriteGameIds.filter(id => id !== gameId);
    currentView = { type: 'home' };
    render();
  }

  function ensureDemoGames() {
    if (state.games.length) return;
    const demos = [
      { title: 'Satisfactory', categoryId: 'cat_automation', templateId: 'tpl_sat_run', steamAppId: '526870', status: 'active' },
      { title: 'Cyberpunk 2077', categoryId: 'cat_rpg', templateId: 'openWorldRpg', steamAppId: '1091500', status: 'researching' },
      { title: 'Minecraft', categoryId: 'cat_sandbox', templateId: 'sandbox', steamAppId: '', status: 'active' }
    ];
    demos.forEach(d => {
      const game = { id: uid('game'), ...d, banner: d.steamAppId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${d.steamAppId}/header.jpg` : '', createdAt: Date.now() };
      state.games.push(game);
      instantiateTemplate(game.id, game.templateId);
    });
    const sat = state.games.find(g => g.title === 'Satisfactory');
    const mc = state.games.find(g => g.title === 'Minecraft');
    const cp = state.games.find(g => g.title === 'Cyberpunk 2077');
    addEntryByTitle(sat.id, 'Factory Goals', 'Automate reinforced plates');
    addEntryByTitle(sat.id, 'Production Tracker', 'Motors / min', '5');
    addEntryByTitle(mc.id, 'Project Checklist', 'Start villager hall');
    addEntryByTitle(cp.id, 'Main Goals', 'Track build direction');
    state.recentGameIds = [sat.id, cp.id, mc.id];
    state.favoriteGameIds = [sat.id];
    saveState();
  }

  function addEntryByTitle(gameId, moduleTitle, title, content='') {
    const mod = getModulesForGame(gameId).find(m => m.title === moduleTitle);
    if (!mod) return;
    state.entries.push({ id: uid('entry'), moduleId: mod.id, title, content, completed: false });
  }

  function loadState(forceFresh = false) {
    if (forceFresh) return normalizeState(structuredClone(starterState));
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved ? normalizeState(saved) : normalizeState(structuredClone(starterState));
    } catch { return normalizeState(structuredClone(starterState)); }
  }

  function normalizeState(raw) {
    const normalized = {
      categories: Array.isArray(raw.categories) ? raw.categories : structuredClone(starterState.categories),
      templates: Array.isArray(raw.templates) ? raw.templates : [],
      games: Array.isArray(raw.games) ? raw.games : [],
      modules: Array.isArray(raw.modules) ? raw.modules : [],
      entries: Array.isArray(raw.entries) ? raw.entries : [],
      recentGameIds: Array.isArray(raw.recentGameIds) ? raw.recentGameIds : [],
      favoriteGameIds: Array.isArray(raw.favoriteGameIds) ? raw.favoriteGameIds : []
    };
    Object.values(defaultTemplates).forEach(tpl => { if (!normalized.templates.find(t => t.id === tpl.id)) normalized.templates.unshift(structuredClone(tpl)); });
    normalized.templates = dedupeById(normalized.templates.map(t => ({ ...t, system: !!(t.system || defaultTemplates[t.id]) })));
    return normalized;
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadTheme() { try { return { ...defaultTheme, ...(JSON.parse(localStorage.getItem(THEME_KEY)) || {}) }; } catch { return defaultTheme; } }

  function allTemplates() { return dedupeById([...state.templates, ...Object.values(defaultTemplates)]).sort((a,b) => Number(a.system) - Number(b.system) || a.name.localeCompare(b.name)); }
  function getTemplate(id) { return allTemplates().find(t => t.id === id); }
  function getGame(id) { return state.games.find(g => g.id === id); }
  function getModule(id) { return state.modules.find(m => m.id === id); }
  function getEntry(id) { return state.entries.find(e => e.id === id); }
  function getModulesForGame(gameId) { return state.modules.filter(m => m.gameId === gameId).sort((a,b) => a.order - b.order); }
  function getEntriesForModule(moduleId) { return state.entries.filter(e => e.moduleId === moduleId); }

  function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2,10)}`; }
  function dedupeById(arr) { return arr.filter((item, idx, list) => list.findIndex(x => x.id === item.id) === idx); }
  function defaultIconFor(type) { return ({ notes: '📜', checklist: '✔', resource: '📦', production: '⚙️', locations: '📍' })[type] || '📜'; }
  function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[m])); }
  function escapeAttribute(v) { return escapeHtml(v).replace(/`/g, '&#96;'); }
  async function fileToDataUrl(file) {
    if (!file) return '';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
})();
