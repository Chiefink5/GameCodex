window.GCUtils = (() => {
  const hasCrypto = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';

  function id(){
    if (hasCrypto) {
      const bytes = new Uint32Array(1);
      crypto.getRandomValues(bytes);
      return bytes[0].toString(36).slice(0, 8).padEnd(8, '0');
    }
    return Math.random().toString(36).slice(2, 10);
  }

  function slug(value){
    return String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || id();
  }

  function cap(value){
    const text = String(value ?? '');
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match]));
  }

  function gid(value){
    return document.getElementById(value);
  }

  function clone(value){
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  return { id, slug, cap, esc, gid, clone };
})();
