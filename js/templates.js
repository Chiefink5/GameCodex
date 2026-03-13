window.GAME_CODEX_DEFAULT_TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Blank',
    description: 'Lean starter for weird one-off games.',
    system: true,
    modules: [
      { type: 'notes', title: 'General Notes', icon: '📜' },
      { type: 'checklist', title: 'Checklist', icon: '✔' },
      { type: 'locations', title: 'Locations', icon: '📍' }
    ]
  },
  sandbox: {
    id: 'sandbox',
    name: 'Sandbox / Creative',
    description: 'Good for Minecraft, Hytale, build-heavy stuff.',
    system: true,
    modules: [
      { type: 'checklist', title: 'Project Checklist', icon: '✔' },
      { type: 'resource', title: 'Resource Tracker', icon: '📦' },
      { type: 'locations', title: 'Coordinates / Locations', icon: '📍' },
      { type: 'notes', title: 'Build Ideas', icon: '🏗️' },
      { type: 'notes', title: 'General Notes', icon: '📜' }
    ]
  },
  automation: {
    id: 'automation',
    name: 'Automation / Factory',
    description: 'For Satisfactory and factory-brain games.',
    system: true,
    modules: [
      { type: 'checklist', title: 'Factory Goals', icon: '✔' },
      { type: 'resource', title: 'Resource Tracker', icon: '📦' },
      { type: 'production', title: 'Production Tracker', icon: '⚙️' },
      { type: 'notes', title: 'Bottlenecks / Problems', icon: '⚠️' },
      { type: 'locations', title: 'Locations', icon: '📍' },
      { type: 'notes', title: 'Tips & Tricks', icon: '🧠' }
    ]
  },
  openWorldRpg: {
    id: 'openWorldRpg',
    name: 'Open World RPG',
    description: 'For Cyberpunk, Starfield, RDR2-style note setups.',
    system: true,
    modules: [
      { type: 'checklist', title: 'Main Goals', icon: '✔' },
      { type: 'notes', title: 'Builds / Loadouts', icon: '🗡️' },
      { type: 'notes', title: 'Important NPCs', icon: '👤' },
      { type: 'locations', title: 'Locations', icon: '📍' },
      { type: 'notes', title: 'Secrets / Discoveries', icon: '🔎' },
      { type: 'notes', title: 'General Notes', icon: '📜' }
    ]
  },
  lifeSim: {
    id: 'lifeSim',
    name: 'Life Sim / Business',
    description: 'For business loops and item/profit tracking.',
    system: true,
    modules: [
      { type: 'checklist', title: 'Business Goals', icon: '✔' },
      { type: 'resource', title: 'Inventory / Resources', icon: '📦' },
      { type: 'notes', title: 'Profit Notes', icon: '💰' },
      { type: 'notes', title: 'Routine Tweaks', icon: '🧠' }
    ]
  },
  survival: {
    id: 'survival',
    name: 'Survival / Exploration',
    description: 'For route planning, shelters, and threat notes.',
    system: true,
    modules: [
      { type: 'checklist', title: 'Survival Priorities', icon: '✔' },
      { type: 'resource', title: 'Materials', icon: '📦' },
      { type: 'locations', title: 'Base / Resource Locations', icon: '📍' },
      { type: 'notes', title: 'Threats / Tips', icon: '🔥' }
    ]
  }
};
