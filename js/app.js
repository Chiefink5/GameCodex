(() => {
  const STORAGE_KEY = 'game_codex_v1';
  const THEME_KEY = 'game_codex_theme_v1';
  const templates = window.GAME_CODEX_TEMPLATES;

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
    resetDataBtn: q('#resetDataBtn'),
    viewTitle: q('#viewTitle'),
    categoryNav: q('#categoryNav'),
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
    moduleEntryModal: q('#moduleEntryModal'),
    moduleEntryForm: q('#moduleEntryForm'),
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

  bindEvents();
  renderAll();

  function bindEvents() {
    els.openSidebarBtn?.addEventListener('click', openSidebar);
    els.closeSidebarBtn?.addEventListener('click', closeSidebar);
    els.overlay?.addEventListener('click', closeSidebar);
    els.addGameBtn.addEventListener('click', openAddGameModal);
    els.openThemeBtn.addEventListener('click', () => els.themeModal.showModal());
    els.cancelGameModalBtn.addEventListener('click', () => els.gameModal.close());
    els.cancelEntryModalBtn.addEventListener('click', () => els.moduleEntryModal.close());
    els.resetDataBtn.addEventListener('click', resetData);
    els.resetThemeBtn.addEventListener('click', resetTheme);

    document.addEventListener('click', handleDocumentClick);

    els.gameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createGameFromForm();
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
    const target = e.target.closest('[data-action], [data-view], [data-category-id], [data-game-id], [data-module-id], [data-check-id]');
    if (!target) return;

    const { action, view, categoryId, gameId, moduleId, checkId } = target.dataset;

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
      case 'toggle-check':
        toggleCheck(checkId);
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
      els.viewTitle.textContent = 'Game Codex';
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
    const modules = state.modules
      .filter(module => module.gameId === game.id)
      .sort((a, b) => a.order - b.order);

    els.gameView.innerHTML = `
      <div class="game-card">
        <div class="game-banner">${game.title}</div>
        <div class="game-header">
          <div>
            <div class="eyebrow">Codex Page</div>
            <h3>${game.title}</h3>
          </div>
          <button class="secondary-btn" data-action="favorite-game" data-game-id="${game.id}">
            ${isFavorite(game.id) ? '⭐ Favorited' : '☆ Favorite'}
          </button>
        </div>
        <div class="row-between" style="margin-top: 12px; flex-wrap: wrap;">
          <span class="badge">${category?.icon || '📁'} ${category?.name || 'Unsorted'}</span>
          <span class="badge">Status: ${capitalize(game.status)}</span>
          <span class="badge">Template: ${templates[game.templateId]?.name || 'Custom'}</span>
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
        ${entries.length ? `<div class="entry-list">${entries.map(entry => renderEntry(entry, module.type)).join('')}</div>` : `<div class="empty-state">Nothing here yet. Add the first entry.</div>`}
      </div>
    `;
  }

  function renderEntry(entry, type) {
    if (type === 'checklist') {
      return `
        <label class="entry-item check-item">
          <input type="checkbox" data-action="toggle-check" data-check-id="${entry.id}" ${entry.completed ? 'checked' : ''} />
          <span>${entry.title}</span>
        </label>
      `;
    }

    if (type === 'resource' || type === 'production') {
      return `
        <div class="entry-item">
          <strong>${entry.title}</strong>
          <div class="subtext">${entry.content || 'Tap add entry to record a value or note.'}</div>
        </div>
      `;
    }

    if (type === 'locations') {
      return `
        <div class="entry-item">
          <strong>${entry.title}</strong>
          <div class="subtext">${entry.content || 'No coordinates added yet.'}</div>
        </div>
      `;
    }

    return `
      <div class="entry-item">
        <strong>${entry.title}</strong>
        <div class="subtext">${entry.content || ''}</div>
      </div>
    `;
  }

  function openAddGameModal() {
    els.gameTitleInput.value = '';
    els.gameStatusSelect.value = 'active';
    els.gameModal.showModal();
  }

  function createGameFromForm() {
    const title = els.gameTitleInput.value.trim();
    const categoryId = els.gameCategorySelect.value;
    const templateId = els.gameTemplateSelect.value;
    const status = els.gameStatusSelect.value;
    if (!title) return;

    const gameId = uid('game');
    const template = templates[templateId] || templates.blank;

    const game = {
      id: gameId,
      title,
      categoryId,
      templateId,
      status,
      lastViewed: Date.now()
    };

    state.games.unshift(game);

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
          ? { title: item, content: defaultContentForType(moduleDef.type, item), completed: false }
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

    markRecent(gameId);
    saveState();
    els.gameModal.close();
    setView({ type: 'game', gameId });
  }

  function defaultContentForType(type, text) {
    if (type === 'resource') return '0';
    if (type === 'production') return '0 / min';
    if (type === 'locations') return 'X: 0, Y: 0, Z: 0';
    return '';
  }

  function openEntryModal(moduleId) {
    const module = state.modules.find(m => m.id === moduleId);
    if (!module) return;

    els.entryModuleId.value = module.id;
    els.entryModuleType.value = module.type;
    els.entryModalTitle.textContent = `Add to ${module.title}`;
    els.entryTitleInput.value = '';
    els.entryContentInput.value = '';
    els.entryContentWrap.classList.toggle('hidden', module.type === 'checklist');
    els.moduleEntryModal.showModal();
  }

  function saveModuleEntry() {
    const moduleId = els.entryModuleId.value;
    const moduleType = els.entryModuleType.value;
    const title = els.entryTitleInput.value.trim();
    const content = els.entryContentInput.value.trim();
    if (!moduleId || !title) return;

    state.entries.unshift({
      id: uid('entry'),
      moduleId,
      title,
      content: moduleType === 'checklist' ? '' : content,
      completed: false
    });

    saveState();
    els.moduleEntryModal.close();
    renderAll();
  }

  function toggleCheck(entryId) {
    const entry = state.entries.find(item => item.id === entryId);
    if (!entry) return;
    entry.completed = !entry.completed;
    saveState();
    renderAll();
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
    state = structuredClone(starterState);
    seedDemoGames();
    saveState();
    setView({ type: 'home' });
  }

  function seedDemoGames() {
    createDemoGame('Satisfactory', 'cat_automation', 'automation', 'active');
    createDemoGame('Cyberpunk 2077', 'cat_rpg', 'openWorldRpg', 'active');
    createDemoGame('Minecraft', 'cat_sandbox', 'sandbox', 'paused');
  }

  function createDemoGame(title, categoryId, templateId, status) {
    const gameId = uid('game');
    const template = templates[templateId];
    state.games.push({ id: gameId, title, categoryId, templateId, status, lastViewed: Date.now() });
    template.modules.forEach((moduleDef, index) => {
      const moduleId = uid('mod');
      state.modules.push({ id: moduleId, gameId, type: moduleDef.type, title: moduleDef.title, icon: moduleDef.icon, order: index + 1 });
      const starter = template.starterEntries?.[moduleDef.title] || [];
      starter.forEach(item => {
        const normalized = typeof item === 'string'
          ? { title: item, content: defaultContentForType(moduleDef.type, item), completed: false }
          : { title: item.title, content: item.content || '', completed: false };
        state.entries.push({ id: uid('entry'), moduleId, title: normalized.title, content: normalized.content, completed: normalized.completed });
      });
    });
    markRecent(gameId);
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
    const theme = JSON.parse(localStorage.getItem(THEME_KEY) || 'null');
    if (!theme) return;
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.style.setProperty('--gold', theme.gold);
    document.documentElement.style.setProperty('--purple', theme.purple);
    document.documentElement.style.setProperty('--bg', theme.bg);
    document.documentElement.style.setProperty('--gold-soft', hexToRgba(theme.gold, 0.16));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(starterState);
    try {
      const parsed = JSON.parse(raw);
      return { ...structuredClone(starterState), ...parsed };
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

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function q(selector) {
    return document.querySelector(selector);
  }
})();
