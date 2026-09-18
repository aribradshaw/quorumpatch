// Original synthetic batch sender. No client implementation or data.
async function deliver(items, ledger, send) {
  const accepted = [];
  for (const item of items) {
    const response = await send(item);
    if (response.status !== 'accepted') return { status: 'incomplete' };
    accepted.push([item.id, response.receipt]);
  }
  for (const [id, receipt] of accepted) ledger[id] = { status: 'accepted', receipt };
  return { status: 'complete' };
}
module.exports = { deliver };
