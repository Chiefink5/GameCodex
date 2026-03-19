
window.GCUI = (() => {
  const { esc, cap } = window.GCUtils;
  const { recipeTotals, chainSummary, TRACKER_DEFS, isTrackerType, trackerSummary, trackerVisibleEntries } = window.GCModules;

  function cardMarkup(game, app){
    return `<article class="card">
      ${game.banner ? `<img class="card-banner" src="${esc(game.banner)}" alt="" />` : ''}
      <h3>${esc(game.title)} ${game.favorite ? '<span class="favorite">★</span>' : ''}</h3>
      <div class="meta">${esc(app.categoryById(game.categoryId)?.name || '')}</div>
      <div class="tag-row">
        <span class="stat-chip">${cap(game.status || 'active')}</span>
        <span class="stat-chip">${app.profilesForGame(game.id).filter(p => !p.archived).length} Profiles</span>
        <span class="stat-chip">${app.serversForGame(game.id).filter(s => !s.archived).length} Servers</span>
      </div>
      <div style="margin-top:auto"><button class="gold-btn" data-open-game="${game.id}">Open Game</button></div>
    </article>`;
  }

  function subCardMarkup(type, title, sub){
    return `<article class="card"><div class="eyebrow">${esc(type)}</div><h3>${esc(title)}</h3><div class="meta">${esc(sub)}</div></article>`;
  }

  function profileRowMarkup(profile){
    return `<div class="item-shell"><div class="item-left"><div class="item-title">${esc(profile.name)}</div><div class="muted">${esc(profile.type)} · ${cap(profile.status)}</div></div><button class="gold-btn" data-open-profile="${profile.id}">Open</button></div>`;
  }

  function serverRowMarkup(server){
    return `<div class="item-shell"><div class="item-left"><div class="item-title">${esc(server.name)}</div><div class="muted">${esc(server.template)} · ${cap(server.status)}</div></div><button class="gold-btn" data-open-server="${server.id}">Open</button></div>`;
  }

  function archiveRowMarkup(title, subtext, type, id){
    return `<div class="item-shell"><div class="item-left"><div class="item-title">${esc(title)}</div><div class="muted">${esc(subtext)}</div></div><button class="gold-btn" data-restore-item="${type}:${id}">Restore</button></div>`;
  }

  function renderFieldInputMarkup(moduleId, field){
    if (field.type === 'toggle') return `<label><input type="checkbox" data-field-input="${moduleId}:${field.key}:toggle" ${field.value ? 'checked' : ''} /> ${field.value ? 'Yes' : 'No'}</label>`;
    if (field.type === 'select') return `<select data-field-input="${moduleId}:${field.key}:select">${(field.options || []).map(option => `<option ${field.value === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select>`;
    return `<input type="${field.type === 'number' ? 'number' : 'text'}" value="${esc(field.value ?? '')}" data-field-input="${moduleId}:${field.key}:${field.type}" />`;
  }

  function renderTrackerModule(mod){
    const def = TRACKER_DEFS[mod.moduleType];
    const summary = trackerSummary(mod);
    const visible = trackerVisibleEntries(mod);
    return `<article class="module">
      <div class="module-head">
        <div>
          <h4>${esc(mod.title)}</h4>
          <div class="tag-row compact-chip-row" style="margin-top:8px">
            <span class="stat-chip">${summary.count} Entries</span>
            ${summary.chips.map(c => `<span class="stat-chip">${esc(c.label)}: ${esc(String(c.value))}</span>`).join('')}
          </div>
        </div>
        <div class="inline-actions compact-actions">
          <button class="ghost-btn" data-edit-module="${mod.id}">Edit</button>
          <button class="gold-btn" data-add-tracker-entry="${mod.id}">+ Entry</button>
        </div>
      </div>
      <div class="filters">
        <input placeholder="Filter entries..." value="${esc(mod.view?.filter || '')}" data-tracker-filter="${mod.id}" />
        <select data-tracker-sort="${mod.id}">
          <option value="recent" ${(mod.view?.sort||'recent') === 'recent' ? 'selected' : ''}>Sort: Recent</option>
          <option value="a-z" ${(mod.view?.sort||'recent') === 'a-z' ? 'selected' : ''}>Sort: A–Z</option>
        </select>
      </div>
      <div class="list">
        ${visible.map(entry => `
          <div class="recipe-card compact-card">
            <div class="recipe-head">
              <div>
                <div class="recipe-title">${esc(entry[def.fields[0].key] || 'Entry')}</div>
                <div class="recipe-meta compact-chip-row">
                  ${def.fields.slice(1, 4).map(f => entry[f.key] ? `<span class="stat-chip">${esc(f.label)}: ${esc(String(entry[f.key]))}</span>` : '').join('')}
                </div>
              </div>
              <div class="inline-actions compact-actions">
                <button class="ghost-btn" data-edit-tracker-entry="${mod.id}:${entry.id}">Edit</button>
                <button class="danger-btn" data-delete-tracker-entry="${mod.id}:${entry.id}">Delete</button>
              </div>
            </div>
            <div class="compact-list">
              ${def.fields.map(f => entry[f.key] ? `<div class="compact-row"><div class="compact-row-main"><div class="compact-row-meta"><strong>${esc(f.label)}:</strong> ${esc(String(entry[f.key]))}</div></div></div>` : '').join('')}
            </div>
          </div>
        `).join('') || `<div class="muted">No entries yet.</div>`}
      </div>
    </article>`;
  }

  function renderModuleMarkup(mod){
    if (mod.moduleType === 'notes'){
      return `<article class="module"><div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions compact-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button></div></div><div class="notes-box">${esc(mod.content || '').replace(/\n/g, '<br>')}</div></article>`;
    }

    if (mod.moduleType === 'checklist'){
      return `<article class="module">
        <div class="module-head">
          <h4>${esc(mod.title)}</h4>
          <div class="inline-actions compact-actions">
            <button class="ghost-btn" data-edit-module="${mod.id}">Edit</button>
            <button class="gold-btn" data-add-check-item="${mod.id}">+ Item</button>
          </div>
        </div>
        <div class="compact-list">
          ${(mod.items || []).map(item => `<div class="compact-row">
            <div class="compact-row-main">
              <label><input type="checkbox" data-toggle-check="${mod.id}:${item.id}" ${item.done ? 'checked' : ''} /> ${esc(item.text)}</label>
            </div>
            <button class="danger-btn iconish-btn" data-delete-check-item="${mod.id}:${item.id}">×</button>
          </div>`).join('') || `<div class="muted">No items yet.</div>`}
        </div>
      </article>`;
    }

    if (mod.moduleType === 'table'){
      return `<article class="module">
        <div class="module-head">
          <h4>${esc(mod.title)}</h4>
          <div class="inline-actions compact-actions">
            <button class="ghost-btn" data-edit-module="${mod.id}">Edit</button>
            <button class="ghost-btn" data-edit-columns="${mod.id}">Columns</button>
            <button class="gold-btn" data-add-row="${mod.id}">+ Row</button>
          </div>
        </div>
        <div style="overflow:auto">
          <table><thead><tr>${(mod.columns || []).map(col => `<th>${esc(col.label)}</th>`).join('')}<th></th></tr></thead>
          <tbody>${(mod.rows || []).map(row => `<tr>${(mod.columns || []).map(col => `<td>${esc(row[col.key] || '')}</td>`).join('')}<td><button class="danger-btn iconish-btn" data-delete-row="${mod.id}:${row.id}">×</button></td></tr>`).join('') || `<tr><td colspan="${(mod.columns?.length || 0) + 1}" class="muted">No rows yet.</td></tr>`}</tbody></table>
        </div>
      </article>`;
    }

    if (mod.moduleType === 'fields'){
      return `<article class="module">
        <div class="module-head">
          <h4>${esc(mod.title)}</h4>
          <div class="inline-actions compact-actions">
            <button class="ghost-btn" data-edit-module="${mod.id}">Edit</button>
            <button class="ghost-btn" data-add-field="${mod.id}">Fields</button>
          </div>
        </div>
        <div class="fields-grid">
          ${(mod.fields || []).map(field => `<div class="card compact-card"><div class="small-note">${esc(field.label)}</div>${renderFieldInputMarkup(mod.id, field)}</div>`).join('') || `<div class="muted">No fields yet.</div>`}
        </div>
      </article>`;
    }

    if (mod.moduleType === 'recipe'){
      return `<article class="module">
        <div class="module-head">
          <div>
            <h4>${esc(mod.title)}</h4>
            <div class="muted">Compact mobile recipe layout</div>
          </div>
          <div class="inline-actions compact-actions">
            <button class="ghost-btn" data-edit-module="${mod.id}">Edit</button>
            <button class="gold-btn" data-add-recipe="${mod.id}">+ Recipe</button>
          </div>
        </div>
        <div class="list">
          ${(mod.recipes || []).map(recipe => recipeCardMarkup(mod.id, recipe)).join('') || `<div class="muted">No recipes yet.</div>`}
        </div>
      </article>`;
    }

    if (mod.moduleType === 'chain'){
      return `<article class="module">
        <div class="module-head">
          <div>
            <h4>${esc(mod.title)}</h4>
            <div class="muted">Timeline style chain view</div>
          </div>
          <div class="inline-actions compact-actions">
            <button class="ghost-btn" data-edit-module="${mod.id}">Edit</button>
            <button class="gold-btn" data-add-chain="${mod.id}">+ Chain</button>
          </div>
        </div>
        <div class="list">
          ${(mod.chains || []).map(chain => chainCardMarkup(mod.id, chain)).join('') || `<div class="muted">No chains yet.</div>`}
        </div>
      </article>`;
    }

    if (isTrackerType(mod.moduleType)) return renderTrackerModule(mod);
    return '';
  }

  function recipeCardMarkup(moduleId, recipe){
    const { total, ok } = recipeTotals(recipe);
    return `<details class="recipe-card mobile-collapse" open>
      <summary class="mobile-summary">
        <div class="mobile-summary-main">
          <div class="recipe-title">${esc(recipe.name || 'Untitled Recipe')}</div>
          <div class="recipe-meta compact-chip-row">
            ${recipe.base ? `<span class="stat-chip">Base: ${esc(recipe.base)}</span>` : ''}
            ${recipe.quantity ? `<span class="stat-chip">Qty: ${esc(recipe.quantity)}</span>` : ''}
            <span class="stat-chip ${ok ? '' : 'warn'}">Total: ${total}% ${ok ? '' : '⚠'}</span>
          </div>
        </div>
        <span class="collapse-caret">▾</span>
      </summary>
      <div class="mobile-collapse-body">
        <div class="inline-actions compact-actions compact-actions-wrap">
          <button class="ghost-btn" data-edit-recipe="${moduleId}:${recipe.id}">Edit</button>
          <button class="gold-btn" data-add-ingredient="${moduleId}:${recipe.id}">+ Ingredient</button>
          <button class="danger-btn" data-delete-recipe="${moduleId}:${recipe.id}">Delete</button>
        </div>
        ${(recipe.notes || '').trim() ? `<div class="notes-box">${esc(recipe.notes).replace(/\n/g, '<br>')}</div>` : ''}
        <div class="compact-list">
          ${(recipe.ingredients || []).map(ing => `<div class="compact-row">
            <div class="compact-row-main">
              <div class="compact-row-title">${esc(ing.name)}</div>
              <div class="compact-row-meta">${esc(String(ing.percent || 0))}%${ing.notes ? ` · ${esc(ing.notes)}` : ''}</div>
            </div>
            <button class="danger-btn iconish-btn" data-delete-ingredient="${moduleId}:${recipe.id}:${ing.id}">×</button>
          </div>`).join('') || `<div class="muted">No ingredients yet.</div>`}
        </div>
      </div>
    </details>`;
  }

  function chainCardMarkup(moduleId, chain){
    const { stepCount, finalProduct } = chainSummary(chain);
    return `<details class="recipe-card mobile-collapse" open>
      <summary class="mobile-summary">
        <div class="mobile-summary-main">
          <div class="recipe-title">${esc(chain.name || 'Untitled Chain')}</div>
          <div class="recipe-meta compact-chip-row">
            ${chain.startProduct ? `<span class="stat-chip">Start: ${esc(chain.startProduct)}</span>` : ''}
            ${finalProduct ? `<span class="stat-chip">Final: ${esc(finalProduct)}</span>` : ''}
            ${chain.sellPrice ? `<span class="stat-chip">Sell: ${esc(chain.sellPrice)}</span>` : ''}
            <span class="stat-chip">${stepCount} Steps</span>
          </div>
        </div>
        <span class="collapse-caret">▾</span>
      </summary>
      <div class="mobile-collapse-body">
        <div class="inline-actions compact-actions compact-actions-wrap">
          <button class="ghost-btn" data-edit-chain="${moduleId}:${chain.id}">Edit</button>
          <button class="gold-btn" data-add-step="${moduleId}:${chain.id}">+ Step</button>
          <button class="danger-btn" data-delete-chain="${moduleId}:${chain.id}">Delete</button>
        </div>
        ${(chain.notes || '').trim() ? `<div class="notes-box">${esc(chain.notes).replace(/\n/g, '<br>')}</div>` : ''}
        <div class="compact-list">
          ${(chain.steps || []).map((step, idx) => `<div class="compact-row">
            <div class="compact-row-main">
              <div class="compact-row-title">Step ${idx + 1}: ${esc(step.ingredient || '')}</div>
              <div class="compact-row-meta">${esc(step.result || '')}${step.notes ? ` · ${esc(step.notes)}` : ''}</div>
            </div>
            <button class="danger-btn iconish-btn" data-delete-step="${moduleId}:${chain.id}:${step.id}">×</button>
          </div>`).join('') || `<div class="muted">No steps yet.</div>`}
        </div>
      </div>
    </details>`;
  }

  return { cardMarkup, subCardMarkup, profileRowMarkup, serverRowMarkup, archiveRowMarkup, renderModuleMarkup };
})();
