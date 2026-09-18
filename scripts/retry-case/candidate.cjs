// Repaired synthetic batch sender.
async function deliver(items, ledger, send) {
  for (const item of items) {
    const id = item.id;
    if (Object.prototype.hasOwnProperty.call(ledger, id)) {
      const entry = ledger[id];
      if (
        entry &&
        entry.status === 'accepted' &&
        typeof entry.receipt === 'string' &&
        entry.receipt.length > 0
      ) {
        continue;
      }

      ledger[id] = { status: 'unknown' };
      return { status: 'incomplete' };
    }

    let response;
    try {
      response = await send(item);
    } catch (error) {
      ledger[id] = { status: 'unknown' };
      return { status: 'incomplete' };
    }

    if (
      response &&
      response.status === 'accepted' &&
      typeof response.receipt === 'string' &&
      response.receipt.length > 0
    ) {
      ledger[id] = { status: 'accepted', receipt: response.receipt };
      continue;
    }

    if (response && response.status === 'rejected') {
      return { status: 'incomplete' };
    }

    ledger[id] = { status: 'unknown' };
    return { status: 'incomplete' };
  }

  return { status: 'complete' };
}

module.exports = { deliver };
