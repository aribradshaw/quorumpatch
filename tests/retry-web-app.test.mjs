import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { createApp } = require('../scripts/retry-case/web-app.cjs');
for (const [version, expected] of [['original', ['A','B','A','B']], ['candidate', ['A','B','B']]]) {
  test('HTTP retry flow: ' + version, async () => {
    const { server } = createApp(fileURLToPath(new URL('../scripts/retry-case/' + version + '.cjs', import.meta.url)));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    try {
      assert.equal((await fetch(base)).status, 200);
      const first = await (await fetch(base + '/deliver', { method: 'POST' })).json();
      assert.equal(first.status, 'B failed. Retry the batch.');
      const second = await (await fetch(base + '/deliver', { method: 'POST' })).json();
      assert.equal(second.status, 'Complete');
      assert.deepEqual(second.attempts, expected);
      assert.deepEqual(second.receipts, ['A', 'B']);
      assert.equal((await fetch(base + '/deliver')).status, 404);
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
}
