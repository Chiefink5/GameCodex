window.GCUtils = (() => {
  const id = () => Math.random().toString(36).slice(2, 10);
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || id();
  const cap = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const gid = (x) => document.getElementById(x);
  return { id, slug, cap, esc, gid };
})();