
window.GCModules = (() => {
  const TRACKER_DEFS = {
    progression: {
      label: 'Progression Tracking',
      fields: [
        { key: 'subject', label: 'Subject', type: 'text' },
        { key: 'xp', label: 'XP', type: 'number' },
        { key: 'level', label: 'Level', type: 'number' },
        { key: 'milestone', label: 'Milestone / Unlock', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    resource: {
      label: 'Resource Tracking',
      fields: [
        { key: 'resource', label: 'Resource', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'unit', label: 'Unit', type: 'text' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    economy: {
      label: 'Economy / Profit Tracking',
      fields: [
        { key: 'item', label: 'Item', type: 'text' },
        { key: 'cost', label: 'Cost', type: 'number' },
        { key: 'revenue', label: 'Revenue', type: 'number' },
        { key: 'roi', label: 'ROI %', type: 'number' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    performance: {
      label: 'Performance Tracking',
      fields: [
        { key: 'activity', label: 'Activity', type: 'text' },
        { key: 'kills', label: 'Kills', type: 'number' },
        { key: 'accuracy', label: 'Accuracy %', type: 'number' },
        { key: 'outcome', label: 'Outcome', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    session: {
      label: 'Activity / Session Tracking',
      fields: [
        { key: 'session', label: 'Session', type: 'text' },
        { key: 'duration', label: 'Duration', type: 'text' },
        { key: 'runs', label: 'Runs', type: 'number' },
        { key: 'result', label: 'Result', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    objective: {
      label: 'Objective / Quest Tracking',
      fields: [
        { key: 'objective', label: 'Objective', type: 'text' },
        { key: 'chain', label: 'Chain', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'reward', label: 'Reward', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    achievement: {
      label: 'Achievement / Milestone Tracking',
      fields: [
        { key: 'achievement', label: 'Achievement', type: 'text' },
        { key: 'percent', label: 'Completion %', type: 'number' },
        { key: 'badge', label: 'Badge / Tier', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    behavior: {
      label: 'Behavior Tracking',
      fields: [
        { key: 'pattern', label: 'Pattern', type: 'text' },
        { key: 'decision', label: 'Decision', type: 'text' },
        { key: 'playstyle', label: 'Playstyle', type: 'text' },
        { key: 'result', label: 'Result', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    craft: {
      label: 'Recipe / Craft Tracking',
      fields: [
        { key: 'recipe', label: 'Recipe', type: 'text' },
        { key: 'inputs', label: 'Inputs', type: 'text' },
        { key: 'outputs', label: 'Outputs', type: 'text' },
        { key: 'successRate', label: 'Success %', type: 'number' },
        { key: 'profit', label: 'Profit', type: 'number' }
      ]
    },
    route: {
      label: 'Route / Path Tracking',
      fields: [
        { key: 'route', label: 'Route', type: 'text' },
        { key: 'efficiency', label: 'Efficiency', type: 'text' },
        { key: 'time', label: 'Time / Run', type: 'text' },
        { key: 'yield', label: 'Yield', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    timebased: {
      label: 'Time-Based Tracking',
      fields: [
        { key: 'event', label: 'Event', type: 'text' },
        { key: 'cooldown', label: 'Cooldown', type: 'text' },
        { key: 'reset', label: 'Reset', type: 'text' },
        { key: 'duration', label: 'Duration', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    build: {
      label: 'Build / Loadout Tracking',
      fields: [
        { key: 'build', label: 'Build', type: 'text' },
        { key: 'gear', label: 'Gear / Config', type: 'text' },
        { key: 'performance', label: 'Performance', type: 'text' },
        { key: 'role', label: 'Role', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    efficiency: {
      label: 'Efficiency Tracking',
      fields: [
        { key: 'activity', label: 'Activity', type: 'text' },
        { key: 'xpPerHour', label: 'XP / hr', type: 'number' },
        { key: 'moneyPerHour', label: 'Money / hr', type: 'number' },
        { key: 'outputRate', label: 'Output Rate', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    structure: {
      label: 'Structure / Base Tracking',
      fields: [
        { key: 'structure', label: 'Structure', type: 'text' },
        { key: 'stage', label: 'Stage', type: 'text' },
        { key: 'cost', label: 'Cost', type: 'number' },
        { key: 'output', label: 'Output', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    social: {
      label: 'Social / Interaction Tracking',
      fields: [
        { key: 'actor', label: 'Actor', type: 'text' },
        { key: 'interaction', label: 'Interaction', type: 'text' },
        { key: 'reputation', label: 'Reputation', type: 'text' },
        { key: 'contribution', label: 'Contribution', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    rng: {
      label: 'RNG / Odds Tracking',
      fields: [
        { key: 'event', label: 'Event', type: 'text' },
        { key: 'chance', label: 'Chance %', type: 'number' },
        { key: 'result', label: 'Result', type: 'text' },
        { key: 'streak', label: 'Streak', type: 'number' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    risk: {
      label: 'Risk Tracking',
      fields: [
        { key: 'scenario', label: 'Scenario', type: 'text' },
        { key: 'chance', label: 'Failure %', type: 'number' },
        { key: 'loss', label: 'Loss', type: 'text' },
        { key: 'mitigation', label: 'Mitigation', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    loop: {
      label: 'Loop Tracking',
      fields: [
        { key: 'loop', label: 'Loop', type: 'text' },
        { key: 'bottleneck', label: 'Bottleneck', type: 'text' },
        { key: 'throughput', label: 'Throughput', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    eventlog: {
      label: 'Event Logging',
      fields: [
        { key: 'timestamp', label: 'Timestamp', type: 'text' },
        { key: 'event', label: 'Event', type: 'text' },
        { key: 'actor', label: 'Actor', type: 'text' },
        { key: 'outcome', label: 'Outcome', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    },
    meta: {
      label: 'Meta Tracking',
      fields: [
        { key: 'trend', label: 'Trend', type: 'text' },
        { key: 'strategy', label: 'Strategy', type: 'text' },
        { key: 'performance', label: 'Performance', type: 'text' },
        { key: 'confidence', label: 'Confidence', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' }
      ]
    }
  };

  function recipeTotals(recipe){
    const total = (recipe.ingredients || []).reduce((sum, ing) => sum + (Number(ing.percent) || 0), 0);
    return { total, ok: total === 100 };
  }

  function chainSummary(chain){
    const steps = chain.steps || [];
    const finalProduct = chain.finalProduct || (steps.length ? steps[steps.length - 1].result : chain.startProduct || '');
    return { stepCount: steps.length, finalProduct };
  }

  function isTrackerType(type){ return Object.prototype.hasOwnProperty.call(TRACKER_DEFS, type); }

  function createTrackerModule(type, title, idFn){
    return {
      id: idFn(),
      moduleType: type,
      title: title || TRACKER_DEFS[type].label,
      entries: [],
      view: { filter: '', sort: 'recent' }
    };
  }

  function ensureTrackerModule(mod){
    if (!mod.entries) mod.entries = [];
    if (!mod.view) mod.view = { filter: '', sort: 'recent' };
  }

  function trackerSummary(mod){
    const entries = mod.entries || [];
    const def = TRACKER_DEFS[mod.moduleType];
    const summary = { count: entries.length, chips: [] };
    if (!def) return summary;
    const numericFields = def.fields.filter(f => f.type === 'number').map(f => f.key);
    numericFields.slice(0, 2).forEach(key => {
      const total = entries.reduce((sum, e) => sum + (Number(e[key]) || 0), 0);
      if (total) summary.chips.push({ label: key, value: total });
    });
    return summary;
  }

  function trackerVisibleEntries(mod){
    const filter = (mod.view?.filter || '').trim().toLowerCase();
    const sort = mod.view?.sort || 'recent';
    const entries = [...(mod.entries || [])];
    const firstFieldKey = TRACKER_DEFS[mod.moduleType]?.fields?.[0]?.key;

    const visible = filter
      ? entries.filter((entry) => Object.values(entry).some((value) => String(value ?? '').toLowerCase().includes(filter)))
      : entries;

    if (sort === 'a-z' && firstFieldKey) {
      visible.sort((a, b) => String(a[firstFieldKey] || '').localeCompare(String(b[firstFieldKey] || '')));
    }

    return visible;
  }

  return { TRACKER_DEFS, recipeTotals, chainSummary, isTrackerType, createTrackerModule, ensureTrackerModule, trackerSummary, trackerVisibleEntries };
})();
