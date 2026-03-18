window.GCUI = (() => {
  const { esc, cap } = window.GCUtils;
  const { recipeTotals, chainSummary } = window.GCModules;

  function cardMarkup(game, app){
    return `<article class="card">
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
    return `<div class="item-shell">
      <div class="item-left"><div class="item-title">${esc(profile.name)}</div><div class="muted">${esc(profile.type)} · ${cap(profile.status)}</div></div>
      <button class="gold-btn" data-open-profile="${profile.id}">Open</button>
    </div>`;
  }

  function serverRowMarkup(server){
    return `<div class="item-shell">
      <div class="item-left"><div class="item-title">${esc(server.name)}</div><div class="muted">${esc(server.template)} · ${cap(server.status)}</div></div>
      <button class="gold-btn" data-open-server="${server.id}">Open</button>
    </div>`;
  }

  function archiveRowMarkup(title, sub, type, id){
    return `<div class="item-shell">
      <div class="item-left"><div class="item-title">${esc(title)}</div><div class="muted">${esc(sub)}</div></div>
      <button class="gold-btn" data-restore-item="${type}:${id}">Restore</button>
    </div>`;
  }

  function renderModuleMarkup(mod){
    if (mod.moduleType === 'notes'){
      return `<article class="module">
        <div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button></div></div>
        <div class="notes-box">${esc(mod.content || '').replace(/\n/g, '<br>')}</div>
      </article>`;
    }

    if (mod.moduleType === 'checklist'){
      return `<article class="module">
        <div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button><button class="gold-btn" data-add-check-item="${mod.id}">+ Item</button></div></div>
        <div class="list">
          ${(mod.items || []).map(item => `<div class="item-shell">
            <div class="item-left"><label><input type="checkbox" data-toggle-check="${mod.id}:${item.id}" ${item.done ? 'checked' : ''} /> ${esc(item.text)}</label></div>
            <button class="danger-btn" data-delete-check-item="${mod.id}:${item.id}">×</button>
          </div>`).join('') || `<div class="muted">No items yet.</div>`}
        </div>
      </article>`;
    }

    if (mod.moduleType === 'table'){
      return `<article class="module">
        <div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button><button class="ghost-btn" data-edit-columns="${mod.id}">Columns</button><button class="gold-btn" data-add-row="${mod.id}">+ Row</button></div></div>
        <div style="overflow:auto">
          <table><thead><tr>${(mod.columns || []).map(col => `<th>${esc(col.label)}</th>`).join('')}<th></th></tr></thead>
          <tbody>${(mod.rows || []).map(row => `<tr>${(mod.columns || []).map(col => `<td>${esc(row[col.key] || '')}</td>`).join('')}<td><button class="danger-btn" data-delete-row="${mod.id}:${row.id}">×</button></td></tr>`).join('') || `<tr><td colspan="${(mod.columns?.length || 0) + 1}" class="muted">No rows yet.</td></tr>`}</tbody></table>
        </div>
      </article>`;
    }

    if (mod.moduleType === 'fields'){
      return `<article class="module">
        <div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button><button class="ghost-btn" data-add-field="${mod.id}">Fields</button></div></div>
        <div class="fields-grid">
          ${(mod.fields || []).map(field => `<div class="card"><div class="small-note">${esc(field.label)}</div>${renderFieldInput(mod.id, field)}</div>`).join('') || `<div class="muted">No fields yet.</div>`}
        </div>
      </article>`;
    }

    if (mod.moduleType === 'recipe'){
      return `<article class="module">
        <div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button><button class="gold-btn" data-add-recipe="${mod.id}">+ New Recipe</button></div></div>
        <div class="list">
          ${(mod.recipes || []).map(recipe => recipeCardMarkup(mod.id, recipe)).join('') || `<div class="muted">No recipes yet.</div>`}
        </div>
      </article>`;
    }

    if (mod.moduleType === 'chain'){
      return `<article class="module">
        <div class="module-head"><h4>${esc(mod.title)}</h4><div class="inline-actions"><button class="ghost-btn" data-edit-module="${mod.id}">Edit</button><button class="gold-btn" data-add-chain="${mod.id}">+ New Chain</button></div></div>
        <div class="list">
          ${(mod.chains || []).map(chain => chainCardMarkup(mod.id, chain)).join('') || `<div class="muted">No chains yet.</div>`}
        </div>
      </article>`;
    }

    return '';
  }

  function renderFieldInput(moduleId, field){
    if (field.type === 'toggle') return `<label><input type="checkbox" data-field-input="${moduleId}:${field.key}:toggle" ${field.value ? 'checked' : ''} /> ${field.value ? 'Yes' : 'No'}</label>`;
    if (field.type === 'select') return `<select data-field-input="${moduleId}:${field.key}:select">${(field.options || []).map(opt => `<option ${field.value === opt ? 'selected' : ''}>${esc(opt)}</option>`).join('')}</select>`;
    return `<input type="${field.type === 'number' ? 'number' : 'text'}" value="${esc(field.value ?? '')}" data-field-input="${moduleId}:${field.key}:${field.type}" />`;
  }

  function recipeCardMarkup(moduleId, recipe){
    const { total, ok } = recipeTotals(recipe);
    return `<div class="recipe-card">
      <div class="recipe-head">
        <div>
          <div class="recipe-title">${esc(recipe.name || 'Untitled Recipe')}</div>
          <div class="recipe-meta">
            ${recipe.base ? `<span class="stat-chip">Base: ${esc(recipe.base)}</span>` : ''}
            ${recipe.quantity ? `<span class="stat-chip">Qty: ${esc(recipe.quantity)}</span>` : ''}
            <span class="stat-chip ${ok ? '' : 'warn'}">Total: ${total}% ${ok ? '' : '⚠'}</span>
          </div>
        </div>
        <div class="recipe-actions">
          <button class="ghost-btn" data-edit-recipe="${moduleId}:${recipe.id}">Edit Recipe</button>
          <button class="gold-btn" data-add-ingredient="${moduleId}:${recipe.id}">+ Ingredient</button>
          <button class="danger-btn" data-delete-recipe="${moduleId}:${recipe.id}">Delete</button>
        </div>
      </div>
      <div class="recipe-body">
        ${(recipe.ingredients || []).map(ing => `<div class="ingredient-row">
          <div><strong>${esc(ing.name)}</strong></div>
          <div>${esc(String(ing.percent ?? ''))}%</div>
          <div>${esc(ing.notes || '')}</div>
          <button class="danger-btn" data-delete-ingredient="${moduleId}:${recipe.id}:${ing.id}">×</button>
        </div>`).join('') || `<div class="muted">No ingredients yet.</div>`}
        ${recipe.notes ? `<div class="notes-box">${esc(recipe.notes).replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    </div>`;
  }

  function chainCardMarkup(moduleId, chain){
    const { stepCount, finalProduct } = chainSummary(chain);
    return `<div class="recipe-card">
      <div class="recipe-head">
        <div>
          <div class="recipe-title">${esc(chain.name || 'Untitled Chain')}</div>
          <div class="recipe-meta">
            ${chain.startProduct ? `<span class="stat-chip">Start: ${esc(chain.startProduct)}</span>` : ''}
            ${finalProduct ? `<span class="stat-chip">Final: ${esc(finalProduct)}</span>` : ''}
            ${chain.sellPrice ? `<span class="stat-chip">Sell: ${esc(chain.sellPrice)}</span>` : ''}
            <span class="stat-chip">${stepCount} Steps</span>
          </div>
        </div>
        <div class="recipe-actions">
          <button class="ghost-btn" data-edit-chain="${moduleId}:${chain.id}">Edit Chain</button>
          <button class="gold-btn" data-add-step="${moduleId}:${chain.id}">+ Step</button>
          <button class="danger-btn" data-delete-chain="${moduleId}:${chain.id}">Delete</button>
        </div>
      </div>
      <div class="recipe-body">
        ${(chain.steps || []).map((step, idx) => `<div class="step-card">
          <div class="step-head">
            <div class="step-title">Step ${idx + 1}</div>
            <button class="danger-btn" data-delete-step="${moduleId}:${chain.id}:${step.id}">×</button>
          </div>
          <div class="tag-row">
            <span class="stat-chip">Ingredient: ${esc(step.ingredient || '')}</span>
            <span class="stat-chip">Result: ${esc(step.result || '')}</span>
          </div>
          ${step.notes ? `<div class="notes-box">${esc(step.notes).replace(/\n/g, '<br>')}</div>` : ''}
        </div>`).join('') || `<div class="muted">No steps yet.</div>`}
        ${chain.notes ? `<div class="notes-box">${esc(chain.notes).replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    </div>`;
  }

  return { cardMarkup, subCardMarkup, profileRowMarkup, serverRowMarkup, archiveRowMarkup, renderModuleMarkup };
})();