import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeReplay } from '../scripts/replay-sanitize.mjs';
const dom = {
  type: 2,
  timestamp: 1,
  data: { node: { type: 2, tagName: 'main', childNodes: [] } },
};
test('replay sanitizer removes endpoint URLs and executable scripts', () => {
  const input = [
    dom,
    {
      type: 4,
      timestamp: 2,
      data: { href: 'https://private.invalid/path?pt_token=secret' },
    },
    {
      type: 2,
      timestamp: 3,
      data: {
        node: {
          tagName: 'script',
          id: 5,
          attributes: { src: 'https://private.invalid' },
          childNodes: [{ textContent: 'secret script' }],
        },
      },
    },
    { type: 6, timestamp: 4, data: { privatePlugin: 'removed' } },
  ];
  const output = sanitizeReplay(input);
  assert.equal(output.length, 3);
  assert.equal(output[1].data.href, '/retry-lab');
  assert.equal(output[2].data.node.tagName, 'noscript');
  assert.deepEqual(output[2].data.node.childNodes, []);
});
test('replay sanitizer fails closed on secret fields and invalid captures', () => {
  for (const value of [
    [],
    [{ type: 4, timestamp: 0, data: {} }],
    [dom, { type: 3, timestamp: 2, data: { token: 'secret' } }],
    [dom, { type: 3, timestamp: 2, data: { text: 'slr_live_dummy' } }],
  ]) {
    assert.throws(() => sanitizeReplay(value));
  }
});
