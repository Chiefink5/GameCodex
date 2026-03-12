(() => {
  const STORAGE_KEY = 'game_codex_v2';
  const LEGACY_STORAGE_KEY = 'game_codex_v1';
  const THEME_KEY = 'game_codex_theme_v2';
  const LEGACY_THEME_KEY = 'game_codex_theme_v1';
  const templates = window.GAME_CODEX_TEMPLATES;
  const STEAM_SEARCH_URL = 'https://store.steampowered.com/api/storesearch/';
  const STEAM_APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails';
  const STEAM_ASSET_BASE = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps';

  const starterState = {
    categories: [
      { id: 'cat_sandbox', name: 'Sandbox / Creative', icon: '🧱' },
      { id: 'cat_automation', name: 'Automation / Factory', icon: '⚙️' },
      { id: 'cat_life', name: 'Life Sim / Business', icon: '🏙️' },
      { id: 'cat_rpg', name: 'Open World RPG', icon: '🗡️' },
      { id: 'cat_survival', name: 'Survival / Exploration', icon: '🔥' },
      { id: 'cat_sim', name: 'Simulation / Systems', icon: '🖥️' },
      { id: 'cat_odd', name: 'Experimental / Oddball', icon: '🧪' }
    ],
    games: [],
    modules: [],
    entries: [],
    recentGameIds: [],
    favoriteGameIds: []
  };

  const steamState = {
    selected: null,
    results: []
  };

  let state = loadState();
  if (!state.games.length) seedDemoGames();
  applyStoredTheme();

  const els = {
    sidebar: q('#sidebar'),
    overlay: q('#overlay'),
    openSidebarBtn: q('#openSidebarBtn'),
    closeSidebarBtn: q('#closeSidebarBtn'),
    addGameBtn: q('#addGameBtn'),
    openThemeBtn: q('#openThemeBtn'),
    exportDataBtn: q('#exportDataBtn'),
    importDataInput: q('#importDataInput'),
    resetDataBtn: q('#resetDataBtn'),
    viewTitle: q('#viewTitle'),
    categoryNav: q('#categoryNav'),
    globalSearchInput: q('#globalSearchInput'),
    homeView: q('#homeView'),
    categoryView: q('#categoryView'),
    gameView: q('#gameView'),
    favoritesView: q('#favoritesView'),
    gameModal: q('#gameModal'),
    gameForm: q('#gameForm'),
    gameCategorySelect: q('#gameCategorySelect'),
    gameTemplateSelect: q('#gameTemplateSelect'),
    cancelGameModalBtn: q('#cancelGameModalBtn'),
    gameTitleInput: q('#gameTitleInput'),
    gameStatusSelect: q('#gameStatusSelect'),
    steamSearchBtn: q('#steamSearchBtn'),
    steamAppIdInput: q('#steamAppIdInput'),
    customBannerInput: q('#customBannerInput'),
    steamStatus: q('#steamStatus'),
    steamResults: q('#steamResults'),
    moduleEntryModal: q('#moduleEntryModal'),
    moduleEntryForm: q('#moduleEntryForm'),
    entryModeInput: q('#entryModeInput'),
    entryEditId: q('#entryEditId'),
    entryModuleId: q('#entryModuleId'),
    entryModuleType: q('#entryModuleType'),
    entryModalTitle: q('#entryModalTitle'),
    entryTitleInput: q('#entryTitleInput'),
    entryContentInput: q('#entryContentInput'),
    entryContentWrap: q('#entryContentWrap'),
    cancelEntryModalBtn: q('#cancelEntryModalBtn'),
    themeModal: q('#themeModal'),
    themeForm: q('#themeForm'),
    goldColorInput: q('#goldColorInput'),
    purpleColorInput: q('#purpleColorInput'),
    bgColorInput: q('#bgColorInput'),
    resetThemeBtn: q('#resetThemeBtn')
  };

  let currentView = { type: 'home' };
  let searchQuery = '';

  bindEvents();
  renderAll();

  function bindEvents() {
    els.openSidebarBtn?.addEventListener('click', openSidebar);
    els.closeSidebarBtn?.addEventListener('click', closeSidebar);
    els.overlay?.addEventListener('click', closeSidebar);
    els.addGameBtn.addEventListener('click', openAddGameModal);
    els.openThemeBtn.addEventListener('click', () => els.themeModal.showModal());
    els.exportDataBtn.addEventListener('click', exportBackup);
    els.importDataInput.addEventListener('change', importBackup);
    els.cancelGameModalBtn.addEventListener('click', () => els.gameModal.close());
    els.cancelEntryModalBtn.addEventListener('click', () => els.moduleEntryModal.close());
    els.resetDataBtn.addEventListener('click', resetData);
    els.resetThemeBtn.addEventListener('click', resetTheme);
    els.steamSearchBtn.addEventListener('click', findSteamMatch);

    els.globalSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderAll();
    });

    els.gameTitleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) return;
    });

    document.addEventListener('click', handleDocumentClick);

    els.gameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await createGameFromForm();
    });

    els.moduleEntryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveModuleEntry();
    });

    els.themeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyThemeFromForm();
      els.themeModal.close();
    });
  }

  function handleDocumentClick(e) {
    const target = e.target.closest('[data-action], [data-view], [data-category-id], [data-game-id], [data-module-id], [data-check-id], [data-entry-id], [data-steam-index]');
    if (!target) return;

    const { action, view, categoryId, gameId, moduleId, checkId, entryId, steamIndex } = target.dataset;

    if (view) {
      setView({ type: view });
      closeSidebar();
      return;
    }

    if (categoryId && !action) {
      setView({ type: 'category', categoryId });
      closeSidebar();
      return;
    }

    if (gameId && !action) {
      markRecent(gameId);
      setView({ type: 'game', gameId });
      closeSidebar();
      return;
    }

    switch (action) {
      case 'open-category':
        setView({ type: 'category', categoryId });
        break;
      case 'favorite-game':
        toggleFavorite(gameId);
        break;
      case 'add-entry':
        openEntryModal(moduleId);
        break;
      case 'edit-entry':
        openEntryModal(moduleId, entryId);
        break;
      case 'delete-entry':
        deleteEntry(entryId);
        break;
      case 'delete-game':
        deleteGame(gameId);
        break;
      case 'toggle-check':
        toggleCheck(checkId);
        break;
      case 'steam-pick':
        selectSteamResult(Number(steamIndex));
        break;
      default:
        break;
    }
  }

  function setView(next) {
    currentView = next;
    renderAll();
  }

  function renderAll() {
    renderSidebar();
    renderHome();
    renderCategory();
    renderGame();
    renderFavorites();
    updateViewVisibility();
  }

  function updateViewVisibility() {
    [els.homeView, els.categoryView, els.gameView, els.favoritesView].forEach(v => v.classList.add('hidden'));

    if (currentView.type === 'home') {
      els.viewTitle.textContent = searchQuery ? `Search: ${searchQuery}` : 'Game Codex';
      els.homeView.classList.remove('hidden');
    }
    if (currentView.type === 'category') {
      const category = state.categories.find(c => c.id === currentView.categoryId);
      els.viewTitle.textContent = category?.name || 'Category';
      els.categoryView.classList.remove('hidden');
    }
    if (currentView.type === 'game') {
      const game = state.games.find(g => g.id === currentView.gameId);
      els.viewTitle.textContent = game?.title || 'Game';
      els.gameView.classList.remove('hidden');
    }
    if (currentView.type === 'favorites') {
      els.viewTitle.textContent = 'Favorites';
      els.favoritesView.classList.remove('hidden');
    }

    [...document.querySelectorAll('.nav-link')].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === currentView.type);
    });
  }

  function renderSidebar() {
    els.categoryNav.innerHTML = state.categories.map(category => `
      <button class="category-nav-link ${currentView.categoryId === category.id ? 'active' : ''}" data-category-id="${category.id}">
        ${category.icon} ${category.name}
      </button>
    `).join('');

    els.gameCategorySelect.innerHTML = state.categories.map(category => `
      <option value="${category.id}">${category.name}</option>
    `).join('');

    els.gameTemplateSelect.innerHTML = Object.values(templates).map(template => `
      <option value="${template.id}">${template.name}</option>
    `).join('');
  }

  function renderHome() {
    const recentGames = state.recentGameIds.map(id => state.games.find(game => game.id === id)).filter(Boolean).slice(0, 3);

    if (searchQuery) {
      const results = findSearchResults(searchQuery);
      els.homeView.innerHTML = `
        <div class="section-block">
          <div class="section-head">
            <div>
              <div class="eyebrow">Codex Sweep</div>
              <h3>Search Results</h3>
            </div>
          </div>
          ${results.length ? `
            <div class="search-results-grid">
              ${results.map(renderSearchCard).join('')}
            </div>
          ` : `<div class="empty-state">No matches. Try a game title, module name, or note text.</div>`}
        </div>
      `;
      return;
    }

    els.homeView.innerHTML = `
      <div class="section-block">
        <div class="section-head">
          <div>
            <div class="eyebrow">Quick Return</div>
            <h3>Recently Viewed</h3>
          </div>
        </div>
        ${recentGames.length ? `
          <div class="recent-list">
            ${recentGames.map(game => renderRecentCard(game)).join('')}
          </div>
        ` : `<div class="empty-state">No recent games yet. Open a game and it’ll live up here.</div>`}
      </div>

      <div class="section-block">
        <div class="section-head">
          <div>
            <div class="eyebrow">Archive Paths</div>
            <h3>Categories</h3>
          </div>
        </div>
        <div class="category-grid">
          ${state.categories.map(category => {
            const count = state.games.filter(game => game.categoryId === category.id).length;
            return `
              <button class="category-card" data-category-id="${category.id}">
                <div class="row-between">
                  <span class="badge">${category.icon} ${count} game${count === 1 ? '' : 's'}</span>
                </div>
                <h4>${category.name}</h4>
                <div class="subtext">Open category archive</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderCategory() {
    if (currentView.type !== 'category') {
      els.categoryView.innerHTML = '';
      return;
    }

    const category = state.categories.find(c => c.id === currentView.categoryId);
    const games = state.games.filter(game => game.categoryId === category.id);

    els.categoryView.innerHTML = `
      <div class="section-block">
        <div class="section-head">
          <div>
            <div class="eyebrow">Category Archive</div>
            <h3>${category.icon} ${category.name}</h3>
          </div>
          <button class="primary-btn" id="categoryAddGameBtn">+ Add Game</button>
        </div>

        ${games.length ? `
          <div class="favorites-grid">
            ${games.map(game => renderGameCard(game)).join('')}
          </div>
        ` : `<div class="empty-state">No games in this category yet. Add one and give it a template.</div>`}
      </div>
    `;

    q('#categoryAddGameBtn')?.addEventListener('click', () => {
      els.gameCategorySelect.value = category.id;
      openAddGameModal();
    });
  }

  function renderGame() {
    if (currentView.type !== 'game') {
      els.gameView.innerHTML = '';
      return;
    }

    const game = state.games.find(g => g.id === currentView.gameId);
    if (!game) return;

    const category = state.categories.find(c => c.id === game.categoryId);
    const modules = state.modules.filter(module => module.gameId === game.id).sort((a, b) => a.order - b.order);

    els.gameView.innerHTML = `
      <div class="game-card">
        ${renderBanner(game)}
        <div class="game-header">
          <div>
            <div class="eyebrow">Codex Page</div>
            <h3>${game.title}</h3>
          </div>
          <div class="entry-actions">
            <button class="secondary-btn" data-action="favorite-game" data-game-id="${game.id}">
              ${isFavorite(game.id) ? '⭐ Favorited' : '☆ Favorite'}
            </button>
            <button class="danger-btn" data-action="delete-game" data-game-id="${game.id}">Delete Game</button>
          </div>
        </div>
        <div class="row-between" style="margin-top: 12px; flex-wrap: wrap;">
          <span class="badge">${category?.icon || '📁'} ${category?.name || 'Unsorted'}</span>
          <span class="badge">Status: ${capitalize(game.status)}</span>
          <span class="badge">Template: ${templates[game.templateId]?.name || 'Custom'}</span>
        </div>
        <div class="steam-meta" style="margin-top:12px;">
          ${game.steamAppId ? `<span class="badge">Steam App ID: ${game.steamAppId}</span>` : ''}
          ${game.steamStoreUrl ? `<a class="secondary-btn tiny" href="${escapeAttr(game.steamStoreUrl)}" target="_blank" rel="noopener noreferrer">Open Steam Page</a>` : ''}
        </div>
      </div>

      <div class="section-block">
        <div class="section-head">
          <div>
            <div class="eyebrow">Modules</div>
            <h3>Knowledge + Tracking</h3>
          </div>
        </div>
        <div class="module-grid">
          ${modules.map(module => renderModuleCard(module)).join('')}
        </div>
      </div>
    `;
  }

  function renderFavorites() {
    const favorites = state.favoriteGameIds.map(id => state.games.find(game => game.id === id)).filter(Boolean);

    els.favoritesView.innerHTML = `
      <div class="section-block">
        <div class="section-head">
          <div>
            <div class="eyebrow">Pinned Titles</div>
            <h3>Favorites</h3>
          </div>
        </div>
        ${favorites.length ? `
          <div class="favorites-grid">
            ${favorites.map(game => renderGameCard(game)).join('')}
          </div>
        ` : `<div class="empty-state">No favorites yet. Mark a game from its codex page.</div>`}
      </div>
    `;
  }

  function renderSearchCard(result) {
    return `
      <button class="game-card" data-game-id="${result.game.id}">
        <div class="badge">${result.matchType}</div>
        <h4>${result.game.title}</h4>
        <div class="subtext">${result.preview}</div>
      </button>
    `;
  }

  function renderRecentCard(game) {
    const category = state.categories.find(c => c.id === game.categoryId);
    return `
      <button class="recent-card" data-game-id="${game.id}">
        <div class="badge">${category?.icon || '📁'} ${category?.name || 'Category'}</div>
        <h4>${game.title}</h4>
        <div class="subtext">Status: ${capitalize(game.status)}</div>
      </button>
    `;
  }

  function renderGameCard(game) {
    const category = state.categories.find(c => c.id === game.categoryId);
    return `
      <button class="game-card" data-game-id="${game.id}">
        <div class="row-between">
          <span class="badge">${category?.icon || '📁'} ${category?.name || 'Category'}</span>
          <span>${isFavorite(game.id) ? '⭐' : ''}</span>
        </div>
        <h4>${game.title}</h4>
        <div class="subtext">Status: ${capitalize(game.status)}</div>
        ${game.steamAppId ? `<div class="subtext tiny">Steam-linked</div>` : ''}
      </button>
    `;
  }

  function renderModuleCard(module) {
    const entries = state.entries.filter(entry => entry.moduleId === module.id);

    return `
      <div class="module-card">
        <div class="module-head">
          <div>
            <div class="eyebrow">${module.type}</div>
            <h4>${module.icon} ${module.title}</h4>
          </div>
          <button class="secondary-btn" data-action="add-entry" data-module-id="${module.id}">+ Add Entry</button>
        </div>
        ${entries.length ? `<div class="entry-list">${entries.map(entry => renderEntry(entry, module)).join('')}</div>` : `<div class="empty-state">Nothing here yet. Add the first entry.</div>`}
      </div>
    `;
  }

  function renderEntry(entry, module) {
    if (module.type === 'checklist') {
      return `
        <div class="entry-item ${entry.completed ? 'is-complete' : ''}">
          <label class="check-item" style="display:flex;align-items:center;gap:10px;margin:0;">
            <input type="checkbox" data-action="toggle-check" data-check-id="${entry.id}" ${entry.completed ? 'checked' : ''} />
            <span>${escapeHtml(entry.title)}</span>
          </label>
          <div class="entry-actions">
            <button class="ghost-btn" data-action="edit-entry" data-entry-id="${entry.id}" data-module-id="${module.id}">Edit</button>
            <button class="ghost-btn" data-action="delete-entry" data-entry-id="${entry.id}">Delete</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="entry-item">
        <strong>${escapeHtml(entry.title)}</strong>
        <div class="subtext">${escapeHtml(entry.content || '')}</div>
        <div class="entry-actions">
          <button class="ghost-btn" data-action="edit-entry" data-entry-id="${entry.id}" data-module-id="${module.id}">Edit</button>
          <button class="ghost-btn" data-action="delete-entry" data-entry-id="${entry.id}">Delete</button>
        </div>
      </div>
    `;
  }

  function renderBanner(game) {
    const bannerUrl = game.bannerUrl || '';
    if (!bannerUrl) return `<div class="game-banner">${escapeHtml(game.title)}</div>`;
    return `
      <div class="game-banner has-image" style="background-image:url('${escapeAttr(bannerUrl)}');">
        <div class="banner-fade"><strong>${escapeHtml(game.title)}</strong></div>
      </div>
    `;
  }

  function openAddGameModal() {
    els.gameTitleInput.value = '';
    els.gameStatusSelect.value = 'active';
    els.steamAppIdInput.value = '';
    els.customBannerInput.value = '';
    steamState.selected = null;
    steamState.results = [];
    els.steamStatus.textContent = 'Use the search button or paste an App ID. If Steam lookup fails, the game still creates normally.';
    els.steamResults.innerHTML = '';
    els.gameModal.showModal();
  }

  async function createGameFromForm() {
    const title = els.gameTitleInput.value.trim();
    const categoryId = els.gameCategorySelect.value;
    const templateId = els.gameTemplateSelect.value;
    const status = els.gameStatusSelect.value;
    const steamAppId = els.steamAppIdInput.value.trim();
    const customBanner = els.customBannerInput.value.trim();
    if (!title) return;

    let steamData = steamState.selected;
    if (!steamData && steamAppId) {
      steamData = await lookupSteamByAppId(steamAppId);
    }

    const gameId = uid('game');
    const template = templates[templateId] || templates.blank;

    const game = {
      id: gameId,
      title,
      categoryId,
      templateId,
      status,
      lastViewed: Date.now(),
      steamAppId: steamData?.appid || steamAppId || '',
      steamStoreUrl: steamData?.storeUrl || (steamAppId ? `https://store.steampowered.com/app/${steamAppId}/` : ''),
      bannerUrl: customBanner || steamData?.header_image || autoSteamHeader(steamAppId) || '',
      capsuleUrl: steamData?.capsule_image || autoSteamCapsule(steamAppId) || '',
      steamName: steamData?.name || ''
    };

    state.games.unshift(game);
    buildModulesForGame(gameId, template);

    markRecent(gameId);
    saveState();
    els.gameModal.close();
    setView({ type: 'game', gameId });
  }

  function buildModulesForGame(gameId, template) {
    template.modules.forEach((moduleDef, index) => {
      const moduleId = uid('mod');
      state.modules.push({
        id: moduleId,
        gameId,
        type: moduleDef.type,
        title: moduleDef.title,
        icon: moduleDef.icon,
        order: index + 1
      });

      const starter = template.starterEntries?.[moduleDef.title] || [];
      starter.forEach(item => {
        const normalized = typeof item === 'string'
          ? { title: item, content: defaultContentForType(moduleDef.type), completed: false }
          : { title: item.title, content: item.content || '', completed: false };

        state.entries.push({
          id: uid('entry'),
          moduleId,
          title: normalized.title,
          content: normalized.content,
          completed: normalized.completed
        });
      });
    });
  }

  function defaultContentForType(type) {
    if (type === 'resource') return '0';
    if (type === 'production') return '0 / min';
    if (type === 'locations') return 'X: 0, Y: 0, Z: 0';
    return '';
  }

  function openEntryModal(moduleId, entryId = '') {
    const module = state.modules.find(m => m.id === moduleId);
    if (!module) return;

    const entry = entryId ? state.entries.find(item => item.id === entryId) : null;
    els.entryModeInput.value = entry ? 'edit' : 'create';
    els.entryEditId.value = entry?.id || '';
    els.entryModuleId.value = module.id;
    els.entryModuleType.value = module.type;
    els.entryModalTitle.textContent = `${entry ? 'Edit' : 'Add to'} ${module.title}`;
    els.entryTitleInput.value = entry?.title || '';
    els.entryContentInput.value = entry?.content || '';
    els.entryContentWrap.classList.toggle('hidden', module.type === 'checklist');
    els.moduleEntryModal.showModal();
  }

  function saveModuleEntry() {
    const moduleId = els.entryModuleId.value;
    const moduleType = els.entryModuleType.value;
    const title = els.entryTitleInput.value.trim();
    const content = els.entryContentInput.value.trim();
    const mode = els.entryModeInput.value;
    const editId = els.entryEditId.value;
    if (!moduleId || !title) return;

    if (mode === 'edit' && editId) {
      const entry = state.entries.find(item => item.id === editId);
      if (!entry) return;
      entry.title = title;
      entry.content = moduleType === 'checklist' ? '' : content;
    } else {
      state.entries.unshift({
        id: uid('entry'),
        moduleId,
        title,
        content: moduleType === 'checklist' ? '' : content,
        completed: false
      });
    }

    saveState();
    els.moduleEntryModal.close();
    renderAll();
  }

  function deleteEntry(entryId) {
    if (!entryId) return;
    state.entries = state.entries.filter(item => item.id !== entryId);
    saveState();
    renderAll();
  }

  function toggleCheck(entryId) {
    const entry = state.entries.find(item => item.id === entryId);
    if (!entry) return;
    entry.completed = !entry.completed;
    saveState();
    renderAll();
  }

  function deleteGame(gameId) {
    if (!gameId) return;
    state.games = state.games.filter(game => game.id !== gameId);
    const moduleIds = state.modules.filter(module => module.gameId === gameId).map(module => module.id);
    state.modules = state.modules.filter(module => module.gameId !== gameId);
    state.entries = state.entries.filter(entry => !moduleIds.includes(entry.moduleId));
    state.recentGameIds = state.recentGameIds.filter(id => id !== gameId);
    state.favoriteGameIds = state.favoriteGameIds.filter(id => id !== gameId);
    saveState();
    setView({ type: 'home' });
  }

  function toggleFavorite(gameId) {
    if (isFavorite(gameId)) {
      state.favoriteGameIds = state.favoriteGameIds.filter(id => id !== gameId);
    } else {
      state.favoriteGameIds.unshift(gameId);
    }
    saveState();
    renderAll();
  }

  function isFavorite(gameId) {
    return state.favoriteGameIds.includes(gameId);
  }

  function markRecent(gameId) {
    state.recentGameIds = [gameId, ...state.recentGameIds.filter(id => id !== gameId)].slice(0, 3);
    const game = state.games.find(g => g.id === gameId);
    if (game) game.lastViewed = Date.now();
    saveState();
  }

  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    state = structuredClone(starterState);
    seedDemoGames();
    saveState();
    setView({ type: 'home' });
  }

  function seedDemoGames() {
    createDemoGame('Satisfactory', 'cat_automation', 'automation', 'active', { appid: '526870' });
    createDemoGame('Cyberpunk 2077', 'cat_rpg', 'openWorldRpg', 'active', { appid: '1091500' });
    createDemoGame('Minecraft', 'cat_sandbox', 'sandbox', 'paused', {});
    createDemoGame('Big Ambitions', 'cat_life', 'lifeSim', 'researching', { appid: '1331550' });
  }

  function createDemoGame(title, categoryId, templateId, status, steam = {}) {
    const gameId = uid('game');
    const template = templates[templateId];
    state.games.push({
      id: gameId,
      title,
      categoryId,
      templateId,
      status,
      lastViewed: Date.now(),
      steamAppId: steam.appid || '',
      steamStoreUrl: steam.appid ? `https://store.steampowered.com/app/${steam.appid}/` : '',
      bannerUrl: steam.appid ? autoSteamHeader(steam.appid) : '',
      capsuleUrl: steam.appid ? autoSteamCapsule(steam.appid) : '',
      steamName: title
    });
    buildModulesForGame(gameId, template);
    markRecent(gameId);
  }

  async function findSteamMatch() {
    const rawTitle = els.gameTitleInput.value.trim();
    const rawAppId = els.steamAppIdInput.value.trim();

    els.steamResults.innerHTML = '';
    steamState.results = [];
    steamState.selected = null;

    if (rawAppId) {
      els.steamStatus.textContent = 'Checking App ID...';
      const app = await lookupSteamByAppId(rawAppId);
      if (app) {
        steamState.results = [app];
        steamState.selected = app;
        els.steamStatus.textContent = `Locked to Steam App ID ${app.appid}.`;
        renderSteamResults();
      } else {
        els.steamStatus.textContent = 'Could not pull that App ID. You can still create the game normally.';
      }
      return;
    }

    if (!rawTitle) {
      els.steamStatus.textContent = 'Type a game title first.';
      return;
    }

    els.steamStatus.textContent = 'Searching Steam...';
    try {
      const params = new URLSearchParams({ term: rawTitle, l: 'english', cc: 'US' });
      const response = await fetch(`${STEAM_SEARCH_URL}?${params.toString()}`);
      if (!response.ok) throw new Error(`Steam search failed: ${response.status}`);
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items.slice(0, 5) : [];
      steamState.results = items.map(item => ({
        appid: String(item.id),
        name: item.name,
        tiny_image: item.tiny_image || autoSteamCapsule(item.id),
        capsule_image: autoSteamCapsule(item.id),
        header_image: autoSteamHeader(item.id),
        storeUrl: `https://store.steampowered.com/app/${item.id}/`
      }));
      if (!steamState.results.length) {
        els.steamStatus.textContent = 'No Steam hits found. You can still create the game normally.';
        return;
      }
      steamState.selected = steamState.results[0];
      els.steamStatus.textContent = 'Pick the right Steam result.';
      renderSteamResults();
    } catch (error) {
      console.error(error);
      els.steamStatus.textContent = 'Steam lookup failed. That can happen if Steam blocks the request in-browser. The app still works without it.';
    }
  }

  async function lookupSteamByAppId(appid) {
    if (!appid) return null;
    try {
      const params = new URLSearchParams({ appids: appid, l: 'english', cc: 'US' });
      const response = await fetch(`${STEAM_APPDETAILS_URL}?${params.toString()}`);
      if (!response.ok) throw new Error(`Steam appdetails failed: ${response.status}`);
      const data = await response.json();
      const payload = data?.[appid];
      if (!payload?.success || !payload?.data) return null;
      return {
        appid: String(appid),
        name: payload.data.name || '',
        header_image: payload.data.header_image || autoSteamHeader(appid),
        capsule_image: autoSteamCapsule(appid),
        storeUrl: `https://store.steampowered.com/app/${appid}/`
      };
    } catch (error) {
      console.error(error);
      return {
        appid: String(appid),
        name: '',
        header_image: autoSteamHeader(appid),
        capsule_image: autoSteamCapsule(appid),
        storeUrl: `https://store.steampowered.com/app/${appid}/`
      };
    }
  }

  function renderSteamResults() {
    els.steamResults.innerHTML = steamState.results.map((item, index) => `
      <button type="button" class="steam-card ${steamState.selected?.appid === item.appid ? 'selected' : ''}" data-action="steam-pick" data-steam-index="${index}">
        <img src="${escapeAttr(item.tiny_image || item.capsule_image || item.header_image)}" alt="${escapeAttr(item.name || 'Steam artwork')}" loading="lazy" />
        <div>
          <strong>${escapeHtml(item.name || 'Unknown title')}</strong>
          <div class="subtext tiny">App ID: ${escapeHtml(item.appid)}</div>
        </div>
        <span class="badge">Use</span>
      </button>
    `).join('');
  }

  function selectSteamResult(index) {
    steamState.selected = steamState.results[index] || null;
    if (!steamState.selected) return;
    els.steamAppIdInput.value = steamState.selected.appid;
    if (!els.customBannerInput.value) els.customBannerInput.value = steamState.selected.header_image || '';
    els.steamStatus.textContent = `Selected ${steamState.selected.name || 'Steam result'} (${steamState.selected.appid}).`;
    renderSteamResults();
  }

  function findSearchResults(query) {
    const seen = new Set();
    const results = [];
    const lowered = query.toLowerCase();

    state.games.forEach(game => {
      if (game.title.toLowerCase().includes(lowered)) {
        const key = `game:${game.id}`;
        if (!seen.has(key)) {
          results.push({ game, matchType: 'Game Title', preview: `Title match in ${game.title}` });
          seen.add(key);
        }
      }

      const modules = state.modules.filter(module => module.gameId === game.id);
      modules.forEach(module => {
        if (module.title.toLowerCase().includes(lowered)) {
          const key = `module:${game.id}:${module.id}`;
          if (!seen.has(key)) {
            results.push({ game, matchType: 'Module', preview: `${module.title}` });
            seen.add(key);
          }
        }
      });

      const moduleIds = modules.map(m => m.id);
      state.entries.filter(entry => moduleIds.includes(entry.moduleId)).forEach(entry => {
        const haystack = `${entry.title} ${entry.content}`.toLowerCase();
        if (haystack.includes(lowered)) {
          const key = `entry:${game.id}:${entry.id}`;
          if (!seen.has(key)) {
            results.push({
              game,
              matchType: 'Entry',
              preview: entry.title || truncate(entry.content, 80)
            });
            seen.add(key);
          }
        }
      });
    });

    return results.slice(0, 18);
  }

  function exportBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 2,
      state,
      theme: JSON.parse(localStorage.getItem(THEME_KEY) || 'null')
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `game-codex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const importedState = payload.state || payload;
      state = sanitizeState(importedState);
      saveState();
      if (payload.theme) {
        localStorage.setItem(THEME_KEY, JSON.stringify(payload.theme));
        applyTheme(payload.theme);
      }
      setView({ type: 'home' });
    } catch (error) {
      console.error(error);
      alert('That backup file is busted or in the wrong format.');
    } finally {
      e.target.value = '';
    }
  }

  function sanitizeState(raw) {
    return {
      categories: Array.isArray(raw.categories) ? raw.categories : structuredClone(starterState.categories),
      games: Array.isArray(raw.games) ? raw.games : [],
      modules: Array.isArray(raw.modules) ? raw.modules : [],
      entries: Array.isArray(raw.entries) ? raw.entries : [],
      recentGameIds: Array.isArray(raw.recentGameIds) ? raw.recentGameIds : [],
      favoriteGameIds: Array.isArray(raw.favoriteGameIds) ? raw.favoriteGameIds : []
    };
  }

  function applyThemeFromForm() {
    const theme = {
      gold: els.goldColorInput.value,
      purple: els.purpleColorInput.value,
      bg: els.bgColorInput.value
    };
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    applyTheme(theme);
  }

  function resetTheme() {
    const theme = { gold: '#d4af37', purple: '#3d2d63', bg: '#0f0c14' };
    els.goldColorInput.value = theme.gold;
    els.purpleColorInput.value = theme.purple;
    els.bgColorInput.value = theme.bg;
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    applyTheme(theme);
  }

  function applyStoredTheme() {
    const theme = JSON.parse(localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY) || 'null');
    if (!theme) return;
    els.goldColorInput.value = theme.gold || '#d4af37';
    els.purpleColorInput.value = theme.purple || '#3d2d63';
    els.bgColorInput.value = theme.bg || '#0f0c14';
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.style.setProperty('--gold', theme.gold);
    document.documentElement.style.setProperty('--purple', theme.purple);
    document.documentElement.style.setProperty('--bg', theme.bg);
    document.documentElement.style.setProperty('--gold-soft', hexToRgba(theme.gold, 0.16));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return structuredClone(starterState);
    try {
      const parsed = JSON.parse(raw);
      return sanitizeState({ ...structuredClone(starterState), ...parsed });
    } catch {
      return structuredClone(starterState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function openSidebar() {
    els.sidebar.classList.remove('closed');
    els.overlay.classList.remove('hidden');
  }

  function closeSidebar() {
    if (window.innerWidth >= 980) return;
    els.sidebar.classList.add('closed');
    els.overlay.classList.add('hidden');
  }

  function autoSteamHeader(appid) {
    return appid ? `${STEAM_ASSET_BASE}/${appid}/header.jpg` : '';
  }

  function autoSteamCapsule(appid) {
    return appid ? `${STEAM_ASSET_BASE}/${appid}/capsule_231x87.jpg` : '';
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function truncate(value, max = 80) {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`', '&#96;');
  }

  function q(selector) {
    return document.querySelector(selector);
  }
})();
