window.GAME_CODEX_TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Blank',
    categoryFit: 'Universal',
    modules: [
      { type: 'notes', title: 'General Notes', icon: '📜' },
      { type: 'checklist', title: 'Checklist', icon: '✔' },
      { type: 'notes', title: 'Tips & Tricks', icon: '🧠' },
      { type: 'locations', title: 'Locations', icon: '📍' }
    ],
    starterEntries: {
      'Checklist': ['Set a goal for this run', 'Track one useful milestone'],
      'Tips & Tricks': [{ title: 'Starter Tip', content: 'Drop useful tricks here as you learn them.' }]
    }
  },
  sandbox: {
    id: 'sandbox',
    name: 'Sandbox / Creative',
    categoryFit: 'Minecraft, Hytale, build-heavy games',
    modules: [
      { type: 'notes', title: 'Build Ideas', icon: '🏰' },
      { type: 'checklist', title: 'Project Checklist', icon: '✔' },
      { type: 'resource', title: 'Resource Tracker', icon: '📦' },
      { type: 'locations', title: 'Coordinates / Locations', icon: '📍' },
      { type: 'notes', title: 'General Notes', icon: '📜' }
    ],
    starterEntries: {
      'Project Checklist': ['Secure starter base', 'Mark important locations', 'Plan next major build'],
      'Resource Tracker': ['Wood', 'Stone', 'Iron'],
      'General Notes': [{ title: 'World Plan', content: 'Use this section to map long-term ideas.' }]
    }
  },
  automation: {
    id: 'automation',
    name: 'Automation / Factory',
    categoryFit: 'Satisfactory, Shapez 2, Factorio-type games',
    modules: [
      { type: 'checklist', title: 'Factory Goals', icon: '✔' },
      { type: 'resource', title: 'Resource Tracker', icon: '📦' },
      { type: 'production', title: 'Production Tracker', icon: '⚙' },
      { type: 'notes', title: 'Bottlenecks / Problems', icon: '⚠' },
      { type: 'locations', title: 'Locations', icon: '📍' },
      { type: 'notes', title: 'Tips & Tricks', icon: '🧠' }
    ],
    starterEntries: {
      'Factory Goals': ['Automate starter materials', 'Identify next bottleneck', 'Unlock next tier', 'Expand power grid'],
      'Resource Tracker': ['Iron Plates', 'Wire', 'Screws'],
      'Production Tracker': ['Iron Plates / min', 'Screws / min'],
      'Tips & Tricks': [{ title: 'Layout Rule', content: 'Keep notes on ratios, power usage, and layout fixes.' }]
    }
  },
  openWorldRpg: {
    id: 'openWorldRpg',
    name: 'Open World RPG',
    categoryFit: 'Cyberpunk, Starfield, RDR2-style runs',
    modules: [
      { type: 'checklist', title: 'Main Goals', icon: '✔' },
      { type: 'notes', title: 'Builds / Loadouts', icon: '🗡' },
      { type: 'notes', title: 'Important NPCs', icon: '👤' },
      { type: 'locations', title: 'Locations', icon: '📍' },
      { type: 'notes', title: 'Secrets / Discoveries', icon: '🔎' },
      { type: 'notes', title: 'General Notes', icon: '📜' }
    ],
    starterEntries: {
      'Main Goals': ['Define build direction', 'Track important quests', 'List important upgrades'],
      'Secrets / Discoveries': [{ title: 'Missables', content: 'Track anything easy to miss here.' }]
    }
  }
};
