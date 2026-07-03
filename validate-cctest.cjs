/* validate-cctest.cjs — executes the real cc-test.html page script (load-time mount + in-page
 * self-test) under a headless DOM + THREE stub, then asserts the self-test reports ALL GREEN.
 * This proves the rewritten in-page runner matches the current cc.js API. */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');

/* ---- DOM stub (getElementById registry + createElement + body + RAF) ---- */
function glctx() { return { getExtension: function (n) { return n === 'WEBGL_lose_context' ? { loseContext: function () {} } : null; } }; }
function el(tag) {
  var e = {
    tagName: (tag || 'div').toUpperCase(), className: '', textContent: '', value: '', disabled: false,
    style: { cssText: '' }, children: [], parentNode: null,
    classList: { _s: {}, add: function (c) { this._s[c] = 1; }, remove: function (c) { delete this._s[c]; }, contains: function (c) { return !!this._s[c]; } },
    appendChild: function (c) { c.parentNode = e; e.children.push(c); return c; },
    removeChild: function (c) { var i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); c.parentNode = null; return c; },
    setAttribute: function () {}, getAttribute: function () { return null; }, querySelector: function () { return null; },
    addEventListener: function () {}, removeEventListener: function () {}, focus: function () {}, getContext: function () { return glctx(); }
  };
  Object.defineProperty(e, 'innerHTML', { get: function () { return e._h || ''; }, set: function (v) { e._h = v; if (v === '') e.children.length = 0; } });
  return e;
}
var byId = {};
['game', 'enginePill', 'hint', 'btnPause', 'btnTest', 'btnRestart', 'tests', 'results', 'summary', 'close'].forEach(function (id) { byId[id] = el('div'); });
var doc = { hidden: false, body: el('body'), createElement: function (t) { return el(t); }, getElementById: function (id) { return byId[id] || (byId[id] = el('div')); }, addEventListener: function () {}, removeEventListener: function () {} };
var RAF = [], RID = 0;
var win = {
  devicePixelRatio: 2, document: doc,
  addEventListener: function () {}, removeEventListener: function () {},
  requestAnimationFrame: function (cb) { RID++; RAF.push(cb); return RID; }, cancelAnimationFrame: function () {},
  setTimeout: function (f, ms) { return setTimeout(f, ms); }, clearTimeout: function (t) { return clearTimeout(t); }
};
win.window = win; win.self = win;

/* ---- THREE stub: bare color/geom (exercises the module's guards) ---- */
(function installThree() {
  var disposed = 0; function disp() { return { dispose: function () { disposed++; } }; }
  function V3() { return { x: 0, y: 0, z: 0, set: function (x, y, z) { this.x = x; this.y = y; this.z = z; return this; }, copy: function (v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } }; }
  function geom() { return disp(); }
  function mat() { var m = disp(); m.color = {}; m.emissive = {}; return m; }
  function mesh() { return { position: V3(), rotation: { x: 0, y: 0, z: 0, set: function (a, b, c) { this.x = a; this.y = b; this.z = c; } }, scale: V3(), visible: true, children: [], add: function (c) { this.children.push(c); return c; } }; }
  win.THREE = {
    REVISION: '128', DynamicDrawUsage: 1,
    WebGLRenderer: function () { return { setPixelRatio: function () {}, setClearColor: function () {}, setSize: function () {}, render: function () {}, dispose: function () { disposed++; }, getContext: function () { return glctx(); } }; },
    Scene: function () { return { fog: null, background: null, children: [], add: function (c) { this.children.push(c); return c; } }; },
    Fog: function () { return {}; }, Color: function () { return {}; },
    PerspectiveCamera: function () { return { position: V3(), aspect: 1, lookAt: function () {}, updateProjectionMatrix: function () {} }; },
    AmbientLight: mesh, DirectionalLight: mesh, PointLight: mesh, HemisphereLight: mesh,
    MeshStandardMaterial: function () { return mat(); }, MeshBasicMaterial: function () { return mat(); },
    PlaneGeometry: geom, BoxGeometry: geom, ConeGeometry: geom, CylinderGeometry: geom, TorusGeometry: geom, OctahedronGeometry: geom, SphereGeometry: geom,
    Mesh: function () { return mesh(); }, Group: function () { return mesh(); },
    Matrix4: function () { return { compose: function () { return this; }, makeScale: function () { return this; }, identity: function () { return this; } }; },
    Quaternion: function () { return { set: function () { return this; }, setFromAxisAngle: function () { return this; } }; },
    Vector3: function (x, y, z) { var v = V3(); if (x != null) v.set(x, y, z); return v; }
  };
})();

global.window = win; global.document = doc; global.self = win;
try { global.navigator = { userAgent: 'validate' }; } catch (e) {}
var NAV = (typeof navigator !== 'undefined') ? navigator : { userAgent: 'validate' };
global.requestAnimationFrame = win.requestAnimationFrame; global.cancelAnimationFrame = win.cancelAnimationFrame;

/* ---- load mock-core + cc.js (sets window.StarNix, window.MockCore, window.CC) ---- */
require('./mock-core.js'); require('./cc.js');
if (!win.MockCore || !win.CC || !win.StarNix) { console.log('✗ globals missing: MockCore/CC/StarNix'); process.exit(1); }

/* ---- extract + run the page <script> (load-time mount + self-test) ---- */
var html = fs.readFileSync(path.join(__dirname, 'cc-test.html'), 'utf8');
var scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
var inline = scripts.map(function (s) { return s.replace(/^<script>/, '').replace(/<\/script>$/, ''); }).filter(function (s) { return s.indexOf('__runCCSelfTest') >= 0; })[0];
if (!inline) { console.log('✗ could not find the inline page script'); process.exit(1); }

var ctx = vm.createContext(Object.assign({ console: console, setTimeout: setTimeout, clearTimeout: clearTimeout }, { window: win, document: doc, self: win, navigator: NAV, requestAnimationFrame: win.requestAnimationFrame, cancelAnimationFrame: win.cancelAnimationFrame }));
try { vm.runInContext(inline, ctx); } catch (e) { console.log('✗ page script threw at load: ' + (e && e.stack || e)); process.exit(1); }
if (typeof win.__runCCSelfTest !== 'function') { console.log('✗ self-test hook not exposed'); process.exit(1); }
try { win.__runCCSelfTest(); } catch (e) { console.log('✗ self-test threw: ' + (e && e.stack || e)); process.exit(1); }

var summaryText = byId.summary.textContent || '';
console.log('in-page self-test summary: "' + summaryText + '"');
if (/ALL GREEN/.test(summaryText)) { console.log('VALIDATE OK'); process.exit(0); }
console.log('✗ self-test not green'); process.exit(1);
