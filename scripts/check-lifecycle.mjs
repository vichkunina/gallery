import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, globals, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => imports[name], ...globals });
  return exports;
}

const requests = [];
class MockImage {
  complete = false;
  onload = null;
  onerror = null;
  src = '';
  decode = async () => {};
  constructor() { requests.push(this); }
}
const { loadOriginalImage } = load('src/utils/loadOriginalImage.ts', { Image: MockImage });
let ready = 0, errors = 0;
loadOriginalImage('/original.png', () => ready++, () => errors++);
requests.at(-1).onerror();
assert.equal(errors, 1);
assert.equal(ready, 0);
loadOriginalImage('/original.png', () => ready++, () => errors++);
await requests.at(-1).onload();
assert.equal(ready, 1, 'Retry can complete');
let resolveDecode;
const cancel = loadOriginalImage('/next.png', () => ready++, () => errors++);
const image = requests.at(-1);
image.decode = () => new Promise(resolve => { resolveDecode = resolve; });
const decoding = image.onload();
cancel();
resolveDecode();
await decoding;
assert.equal(ready, 1, 'Cancelled decode must not update the next artwork');
assert.equal(image.onerror, null);
assert.equal(image.src, '');
loadOriginalImage('/decode-fallback.png', () => ready++, () => errors++);
requests.at(-1).decode = async () => { throw new Error('Decode unavailable'); };
await requests.at(-1).onload();
assert.equal(ready, 2, 'A loaded image still displays when explicit decode fails');

// Run the actual scroll hook lifecycle with controllable animation frames.
let nextEffects = [], effects = [], refIndex = 0, sequence = 0;
const refs = [], frames = new Map(), scrollCalls = [];
const bodyStyle = { overflow: '', position: '', top: '', width: '' };
const htmlStyle = { overflow: '', scrollBehavior: 'smooth' };
const history = { scrollRestoration: 'auto' };
const react = {
  useRef(initial) { return refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }); },
  useEffect(setup, deps) { nextEffects.push({ setup, deps }); },
};
const window = { scrollY: 725, scrollTo: (value) => scrollCalls.push(value.top) };
const { useLockBodyScroll } = load('src/hooks/useLockBodyScroll.ts', {
  window, document: { body: { style: bodyStyle }, documentElement: { style: htmlStyle } }, history,
  requestAnimationFrame: (callback) => { frames.set(++sequence, callback); return sequence; },
  cancelAnimationFrame: (id) => frames.delete(id),
}, { react });
function render(locked) {
  nextEffects = []; refIndex = 0;
  useLockBodyScroll(locked);
  effects = nextEffects.map((effect, i) => {
    const old = effects[i];
    if (old && effect.deps.every((value, j) => value === old.deps[j])) return old;
    old?.cleanup?.();
    return { ...effect, cleanup: effect.setup() };
  });
}
render(true);
assert.equal(bodyStyle.position, 'fixed');
render(false);
const stale = [...frames.values()][0];
assert.equal(frames.size, 1);
window.scrollY = 810;
render(true);
assert.equal(frames.size, 0, 'Reopening cancels the old unlock');
const callsBefore = scrollCalls.length;
stale();
assert.equal(scrollCalls.length, callsBefore, 'Even a queued stale callback is inert');
assert.equal(history.scrollRestoration, 'manual');
assert.equal(htmlStyle.overflow, 'hidden');
assert.equal(bodyStyle.top, '-810px');
render(false);
while (frames.size) {
  const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn());
}
assert.equal(htmlStyle.scrollBehavior, 'smooth');
assert.equal(history.scrollRestoration, 'auto');
render(true);
for (const effect of effects) effect.cleanup?.();
assert.equal(frames.size, 0, 'Unmount leaves no delayed scroll callbacks');
assert.equal(bodyStyle.position, '');
assert.equal(htmlStyle.scrollBehavior, 'smooth');
assert.equal(history.scrollRestoration, 'auto');
console.log('Passed: original-image failure/retry/cancel/decode and scroll reopen/unmount races.');
