// eventBus.js — tiny synchronous pub/sub. The bridge between quiz logic and the
// backdrop/audio (CLAUDE.md §5). The event contract is documented in
// docs/WWTBANE_CINEMATIC_SPEC.md §10. Pure; usable in Node and the browser.

export function createBus() {
  const listeners = new Map(); // type -> Set<fn>
  return {
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type)?.delete(fn);
    },
    emit(type, data) {
      const set = listeners.get(type);
      if (set) for (const fn of [...set]) { try { fn(data, type); } catch (e) { console.error('bus listener error', type, e); } }
      const star = listeners.get('*');
      if (star) for (const fn of [...star]) { try { fn(data, type); } catch (e) { console.error(e); } }
    },
    clear() { listeners.clear(); },
  };
}
