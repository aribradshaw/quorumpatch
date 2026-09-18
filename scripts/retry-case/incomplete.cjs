// Deliberately incomplete control, not the separate repair agent's candidate.
async function deliver(items, ledger, send) {
  for (const item of items) {
    if (ledger[item.id]?.status === 'accepted') continue;
    let response;
    try { response = await send(item); }
    catch { return { status: 'incomplete' }; }
    if (response?.status !== 'accepted') return { status: 'incomplete' };
    ledger[item.id] = response;
  }
  return { status: 'complete' };
}
module.exports = { deliver };
