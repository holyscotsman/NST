/* =============================================================================
 * mock-core.js  —  spec-faithful stand-in for the StarNix shared core (doc 01).
 *
 * This is NOT a deliverable of the ARM chat. It implements the documented ctx
 * shape so arm.js can be developed and verified before the real mock-core.js /
 * starnix-core.js are dropped in. When the real core arrives, arm.js attaches to
 * the same window.StarNix.registerGame() and consumes the same ctx — no change.
 *
 * Provides: makeRng, a small valid question bank, QuestionProvider, MasteryStore,
 * audio (no-op + call log), theme tokens, telemetry sink, persistence (in-memory).
 * Exposes window.StarNix (the "shell") and window.MockCore (builders + makeCtx).
 * ========================================================================== */
(function (glob) {
  "use strict";

  /* ----- Seeded RNG (mulberry32) — doc 01 §6 -------------------------------- */
  function makeRng(seed) {
    let a = (typeof seed === "string" ? hashStr(seed) : (seed >>> 0)) || 1;
    function next() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function int(maxExclusive) { return Math.floor(next() * maxExclusive); }
    function pick(arr) { return arr[int(arr.length)]; }
    function shuffle(arr) {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = int(i + 1); const t = a2[i]; a2[i] = a2[j]; a2[j] = t;
      }
      return a2;
    }
    function fork(salt) { return makeRng((a >>> 0) ^ hashStr(String(salt))); }
    return { next, int, pick, shuffle, fork };
  }
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ----- Question bank — doc 01 §2 ------------------------------------------ */
  // Compact valid fixture: 5 domains x 8 questions. Enough that a 24-distinct
  // run never starves the exclusion logic. Content is placeholder but every
  // record is schema-valid (3-5 options, in-range correctIndex, non-empty
  // stem/explanation, unique ids, unique stems).
  function makeBank() {
    const domains = ["storage", "networking", "security", "vms", "architecture"];
    const perDomain = 8;
    const questions = [];
    const blurb = {
      storage: ["OpLog", "Extent Store", "Curator", "Cassandra", "erasure coding", "deduplication", "compression", "data locality"],
      networking: ["VLAN", "virtual switch", "uplink bond", "IPAM", "microsegmentation", "load balancing", "MTU", "subnet"],
      security: ["RBAC", "STIG hardening", "key management", "data-at-rest encryption", "audit log", "certificate", "cluster lockdown", "two-factor"],
      vms: ["live migration", "VM snapshot", "memory overcommit", "vCPU", "guest tools", "affinity rule", "clone", "flash mode"],
      architecture: ["RF2 vs RF3", "block awareness", "rack awareness", "controller VM", "metadata ring", "fault domain", "scale-out", "witness"],
    };
    for (let d = 0; d < domains.length; d++) {
      const dom = domains[d];
      for (let i = 0; i < perDomain; i++) {
        const topic = blurb[dom][i % blurb[dom].length];
        const diff = ((i % 3) + 1);
        const correctIndex = i % 4;
        const options = [0, 1, 2, 3].map((k) =>
          k === correctIndex
            ? "Correct: " + topic + " behaviour"
            : "Distractor " + (k + 1) + " for " + topic);
        questions.push({
          id: "mci-" + dom + "-" + String(i + 1).padStart(4, "0"),
          cert: "NCP-MCI",
          domain: dom,
          difficulty: diff,
          stem: "[" + dom + " #" + (i + 1) + "] Which statement about " + topic + " is correct?",
          options,
          correctIndex,
          explanation: "Because " + topic + " behaves as described; the distractors misstate it. (Mock explanation.)",
          briefing: "Cmdr. note on " + topic + ": remember how " + topic + " works in a Nutanix cluster.",
          tags: [dom, topic.replace(/\s+/g, "-")],
          source: "mock",
        });
      }
    }
    return { id: "NCP-MCI", name: "NCP-MCI (mock)", domains, questions };
  }

  /* ----- QuestionProvider — doc 01 §3 -------------------------------------- */
  function makeProvider(bank, telemetry) {
    const byIdMap = new Map(bank.questions.map((q) => [q.id, q]));
    function pool(filter) {
      filter = filter || {};
      return bank.questions.filter((q) =>
        (filter.domain == null || q.domain === filter.domain) &&
        (filter.difficulty == null || q.difficulty === filter.difficulty) &&
        (filter.cert == null || q.cert === filter.cert));
    }
    function next(opts) {
      opts = opts || {};
      const rng = opts.rng || makeRng(1);
      const band = opts.difficultyBand;
      const exclude = new Set(opts.excludeIds || []);
      let cand = pool({ domain: opts.domain });
      if (band) cand = cand.filter((q) => q.difficulty >= band[0] && q.difficulty <= band[1]);
      let avail = cand.filter((q) => !exclude.has(q.id));
      let reason = "new";
      if (avail.length === 0) {
        // graceful fallback: relax band, then exclusions, then whole bank
        avail = cand.length ? cand : pool({ domain: opts.domain });
        if (avail.length === 0) avail = bank.questions.slice();
        reason = "reinforce";
      }
      const question = rng.pick(avail);
      return { question, reason };
    }
    function byId(id) { return byIdMap.get(id); }
    return { next, byId, pool };
  }

  /* ----- MasteryStore — doc 01 §4 ------------------------------------------ */
  function makeMastery(persistence) {
    const map = (persistence && persistence._profile && persistence._profile.mastery) || {};
    const THRESH = 3;
    function record(id, correct, ctx) {
      let m = map[id];
      if (!m) m = map[id] = { id, seen: 0, correct: 0, incorrect: 0, streak: 0, bucket: 0, lastSeen: 0 };
      m.seen++;
      m.lastSeen = Date.now();
      if (correct) {
        m.correct++; m.streak++; m.bucket = Math.min(5, m.bucket + 1);
        if (m.firstCorrectAt == null) m.firstCorrectAt = m.lastSeen;
      } else {
        m.incorrect++; m.streak = 0; m.bucket = Math.max(0, m.bucket - 1);
      }
    }
    function get(id) { return map[id]; }
    function summary() {
      let totalSeen = 0, uc = 0, ui = 0, mastered = 0;
      for (const k in map) {
        const m = map[k]; totalSeen += m.seen;
        if (m.correct > 0) uc++; if (m.incorrect > 0) ui++;
        if (m.bucket >= THRESH) mastered++;
      }
      return { totalSeen, uniqueCorrect: uc, uniqueIncorrect: ui, masteredCount: mastered };
    }
    return { record, get, summary, _map: map };
  }

  /* ----- Audio — doc 01 §7 (no-op + call log for tests) -------------------- */
  function makeAudio() {
    const log = [];
    return {
      ensure() { log.push(["ensure"]); },
      setMusic(on) { log.push(["setMusic", on]); },
      setSfx(on) { log.push(["setSfx", on]); },
      sfx(name) { log.push(["sfx", name]); },
      playTrack(id) { log.push(["playTrack", id]); },
      _log: log,
    };
  }

  /* ----- Theme tokens — doc 01 §8 / 07 ------------------------------------- */
  function makeTheme() {
    return {
      colors: {
        iris: "#7855FA", iris300: "#AC9BFD", iris600: "#6D40E6",
        aqua: "#1FDDE9", mantis: "#92DD23", peach: "#FF6B5B", gold: "#FFC857",
        charcoal: "#131313", space: "#07070e", white: "#F2F2F7",
      },
      font: "Montserrat",
    };
  }

  /* ----- Telemetry — doc 01 §10 -------------------------------------------- */
  function makeTelemetry() {
    const events = [];
    return { emit(e) { events.push(e); }, _events: events };
  }

  /* ----- Persistence — doc 01 §5 (in-memory) ------------------------------- */
  function makePersistence() {
    const profile = {
      userId: "mock-device", bests: {},
      totals: { questionsSeen: 0, correct: 0, incorrect: 0, points: 0, runs: 0 },
      mastery: {}, settings: { music: true, sfx: true, reducedMotion: false, extraTime: false },
      updatedAt: Date.now(),
    };
    const api = {
      _profile: profile,
      load() { return Promise.resolve(profile); },
      save(p) { Object.assign(profile, p); profile.updatedAt = Date.now(); return Promise.resolve(); },
      submitScore(game, score, meta) {
        const cur = profile.bests[game];
        if (cur == null || (typeof score === "number" && score > cur)) profile.bests[game] = score;
        return Promise.resolve();
      },
    };
    return api;
  }

  /* ----- Assemble a CoreContext ------------------------------------------- */
  function makeCtx(opts) {
    opts = opts || {};
    const bank = opts.bank || makeBank();
    const telemetry = opts.telemetry || makeTelemetry();
    const persistence = opts.persistence || makePersistence();
    const ctx = {
      questions: opts.questions || makeProvider(bank, telemetry),
      mastery: opts.mastery || makeMastery(persistence),
      persistence,
      rng: opts.rng || makeRng(opts.seed != null ? opts.seed : 12345),
      audio: opts.audio || makeAudio(),
      theme: opts.theme || makeTheme(),
      telemetry,
      settings: opts.settings || persistence._profile.settings,
      test: !!opts.test,
      exit: opts.exit || function () {},
    };
    return ctx;
  }

  /* ----- The "shell" surface arm.js registers against --------------------- */
  const StarNix = {
    _games: {},
    registerGame(m) { this._games[m.id] = m; return m; },
    getGame(id) { return this._games[id]; },
    // convenience used by the standalone test harness
    bootGame(id, root, ctxOpts) {
      const g = this._games[id];
      if (!g) throw new Error("game not registered: " + id);
      const ctx = makeCtx(ctxOpts);
      g.mount(root, ctx);
      return ctx;
    },
  };

  const MockCore = {
    makeRng, makeBank, makeProvider, makeMastery, makeAudio, makeTheme,
    makeTelemetry, makePersistence, makeCtx, hashStr,
  };

  glob.StarNix = StarNix;
  glob.MockCore = MockCore;
})(typeof window !== "undefined" ? window : globalThis);
