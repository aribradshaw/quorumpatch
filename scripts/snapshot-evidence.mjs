export function snapshotComplete(receipt, withBrowser) {
  const expected = [
    'prepare',
    'snapshot',
    'original-fork',
    ...(withBrowser ? ['browser-original'] : []),
    'contaminate-first-fork',
    'incomplete-fork',
    'fresh-fork-separation',
    'candidate',
    ...(withBrowser ? ['browser-candidate'] : []),
    'rewind',
    ...(withBrowser ? ['browser-rewind'] : []),
  ];
  if (
    receipt.error ||
    JSON.stringify(receipt.stages.map((s) => s.name)) !==
      JSON.stringify(expected)
  )
    return false;
  if (receipt.stages.some((s) => s.pass !== true)) return false;
  const stage = (name) => receipt.stages.find((s) => s.name === name);
  if (
    !stage('snapshot').providerReadback ||
    !stage('rewind').contaminationRemoved
  )
    return false;
  const separation = stage('fresh-fork-separation');
  if (separation.marker !== false || separation.providerKeyPresent !== false)
    return false;
  for (const [name, outcome] of [
    ['original-fork', 'fail'],
    ['incomplete-fork', 'fail'],
    ['candidate', 'pass'],
    ['rewind', 'fail'],
  ]) {
    const assessment = stage(name).assessment;
    if (assessment?.verdict !== 'confirmed' || assessment.outcome !== outcome)
      return false;
  }
  const incomplete = stage('incomplete-fork').assessment.checks;
  if (
    !incomplete?.some((c) => c.id === 'partial-retry' && c.pass === true) ||
    !incomplete.some(
      (c) => c.id === 'unknown-is-not-retried' && c.pass === false,
    )
  )
    return false;
  if (
    receipt.cleanup.length !== 5 ||
    receipt.cleanup.some((c) => c.confirmed !== true) ||
    receipt.cleanup.filter((c) => c.resource === 'sandbox').length !== 4 ||
    receipt.cleanup.filter((c) => c.resource === 'snapshot').length !== 1
  )
    return false;
  if (withBrowser) {
    if (
      !receipt.browserReleased ||
      !receipt.browserRecording?.downloaded ||
      !(receipt.browserRecording.bytes > 0)
    )
      return false;
    for (const [name, expectedOrder] of [
      ['browser-original', 'A → B → A → B'],
      ['browser-candidate', 'A → B → B'],
      ['browser-rewind', 'A → B → A → B'],
    ]) {
      const s = stage(name);
      if (
        s.browserAssertionsPassed !== true ||
        s.observedSendOrder !== expectedOrder ||
        s.expectedSendOrder !== expectedOrder
      )
        return false;
    }
  }
  return true;
}
