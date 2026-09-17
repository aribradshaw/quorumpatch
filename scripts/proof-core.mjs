import { createHash } from 'node:crypto';
export const sha256 = (value) =>
  createHash('sha256').update(value).digest('hex');
export function verifyHash(content, expected) {
  if (sha256(content) !== expected) throw new Error('artifact_mismatch');
}
export function assess(result, checks, expectation) {
  if (
    !result ||
    !Number.isInteger(result.exitCode) ||
    ![0, 1].includes(result.exitCode)
  )
    return { verdict: 'blocked', reason: 'execution_failed' };
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    return { verdict: 'blocked', reason: 'malformed_report' };
  }
  if (
    report?.protocol !== 1 ||
    !Array.isArray(report.checks) ||
    report.checks.length !== checks.length
  )
    return { verdict: 'blocked', reason: 'invalid_report' };
  for (let i = 0; i < checks.length; i++) {
    const row = report.checks[i];
    if (
      !row ||
      row.id !== checks[i].id ||
      JSON.stringify(row.expected) !== JSON.stringify(checks[i].expected) ||
      typeof row.pass !== 'boolean' ||
      !Object.hasOwn(row, 'actual') ||
      row.pass !== (JSON.stringify(row.actual) === JSON.stringify(row.expected))
    )
      return { verdict: 'blocked', reason: 'invalid_report' };
  }
  const failures = report.checks.filter((row) => !row.pass).length;
  if (result.exitCode !== (failures ? 1 : 0))
    return { verdict: 'blocked', reason: 'exit_report_mismatch' };
  return {
    verdict: (expectation === 'fail' ? failures > 0 : failures === 0)
      ? 'confirmed'
      : 'unexpected',
    outcome: failures ? 'fail' : 'pass',
    checks: report.checks,
  };
}
export async function runStage({
  execute,
  cleanup,
  checks,
  expectation,
  timeoutMs = 30000,
  cleanupTimeoutMs = 15000,
}) {
  const started = Date.now();
  let timer;
  let record;
  try {
    const result = await Promise.race([
      execute(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    record = assess(result, checks, expectation);
  } catch (error) {
    record = {
      verdict: 'blocked',
      reason: ['timeout', 'artifact_mismatch'].includes(error.message)
        ? error.message
        : 'execution_failed',
    };
  } finally {
    clearTimeout(timer);
  }
  let cleanupTimer;
  try {
    await Promise.race([
      cleanup(),
      new Promise((_, reject) => {
        cleanupTimer = setTimeout(
          () => reject(new Error('cleanup_timeout')),
          cleanupTimeoutMs,
        );
      }),
    ]);
    record.cleanupConfirmed = true;
  } catch {
    record.cleanupConfirmed = false;
    record.verdict = 'blocked';
    record.reason = 'cleanup_failed';
  } finally {
    clearTimeout(cleanupTimer);
  }
  return { ...record, durationMs: Date.now() - started };
}
