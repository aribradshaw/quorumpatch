// Pinned public source. Patches below are QuorumPatch candidates, not upstream fixes.
export function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2)
    throw new Error('Patch preimage mismatch');
  return source.replace(before, after);
}
export const cases = [
  {
    id: 'bytes',
    name: 'bytes',
    title: 'Keep the precision. Drop the extra zeros.',
    repo: 'visionmedia/bytes.js',
    commit: '9ddc13b6c66e0cb293616fba246e05db4b6cef4d',
    path: 'index.js',
    issue: 69,
    sha256: '893fcbbbe962dc00e40dc2e4b20e76e92d874dd257345003c6575d940e91a37f',
    problem:
      'Formatting 1075 bytes with three decimal places leaves an unwanted trailing zero.',
    fix: 'Trim trailing fractional zeros while preserving internal zeros and fixed-decimal mode.',
    trap: 'Converting every formatted value to a number fixes the report, but strips explicitly requested fixed decimals.',
    before: '1.050KB',
    after: '1.05KB',
    patch: (source) =>
      replaceOnce(
        source,
        String.raw`/(?:\.0*|(\.[^0]+)0+)$/`,
        String.raw`/(?:\.0*|(\.\d*?[1-9])0+)$/`,
      ),
    bad: (source) =>
      replaceOnce(
        source,
        "if (!fixedDecimals) {\n    str = str.replace(formatDecimalsRegExp, '$1');\n  }",
        'str = String(Number(str));',
      ),
    repro: [
      {
        id: 'reported-format',
        expr: 'subject(1075, {decimalPlaces:3})',
        expected: '1.05KB',
      },
    ],
    checks: [
      {
        id: 'fixed-decimals',
        expr: 'subject(1075, {decimalPlaces:3,fixedDecimals:true})',
        expected: '1.050KB',
      },
      {
        id: 'internal-zero',
        expr: 'subject(1025, {decimalPlaces:6})',
        expected: '1.000977KB',
      },
      {
        id: 'ordinary-fraction',
        expr: 'subject(1536, {decimalPlaces:3})',
        expected: '1.5KB',
      },
      {
        id: 'integer',
        expr: 'subject(1024, {decimalPlaces:3})',
        expected: '1KB',
      },
      {
        id: 'negative',
        expr: 'subject(-1075, {decimalPlaces:3})',
        expected: '-1.05KB',
      },
      {
        id: 'separator',
        expr: 'subject(1075, {decimalPlaces:3,unitSeparator:" "})',
        expected: '1.05 KB',
      },
      {
        id: 'zero-precision',
        expr: 'subject(1075, {decimalPlaces:0})',
        expected: '1KB',
      },
      { id: 'parse-regression', expr: 'subject("1.5KB")', expected: 1536 },
    ],
  },
  {
    id: 'pluralize',
    name: 'pluralize',
    title: 'A table name should stay a table name.',
    repo: 'plurals/pluralize',
    commit: '1c42761e49f7a78b756841528d99dfbbca8d903c',
    path: 'pluralize.js',
    issue: 215,
    sha256: '23e100b090cd7e49579a34cd6e83e1bae0f03c81566db603d4ff84de50bdca0d',
    problem:
      'Singularizing TimeSeries produces TimeSery, breaking the intended model name.',
    fix: 'Respect an uncountable final camel-case token without losing its original case.',
    trap: 'A Series-only exception passes the report but still damages other uncountable camel-case endings.',
    before: 'TimeSery',
    after: 'TimeSeries',
    patch: (source) =>
      replaceOnce(
        replaceOnce(
          source,
          'if (!token.length || uncountables.hasOwnProperty(token)) {',
          'var suffix = word.match(/[A-Z][a-z]*$/);\n    if (!token.length || uncountables.hasOwnProperty(token) ||\n        (suffix && uncountables.hasOwnProperty(suffix[0].toLowerCase()))) {',
        ),
        'return sanitizeWord(token, token, rules) === token;',
        'return sanitizeWord(token, word, rules).toLowerCase() === token;',
      ),
    bad: (source) =>
      replaceOnce(
        source,
        'if (!token.length || uncountables.hasOwnProperty(token)) {',
        'if (/Series$/.test(word) || !token.length || uncountables.hasOwnProperty(token)) {',
      ),
    repro: [
      {
        id: 'reported-name',
        expr: 'subject.singular("TimeSeries")',
        expected: 'TimeSeries',
      },
    ],
    checks: [
      {
        id: 'other-uncountable',
        expr: 'subject.singular("LatestNews")',
        expected: 'LatestNews',
      },
      {
        id: 'plural-uncountable',
        expr: 'subject.plural("OfficeEquipment")',
        expected: 'OfficeEquipment',
      },
      {
        id: 'singular-predicate',
        expr: 'subject.isSingular("TimeSeries")',
        expected: true,
      },
      {
        id: 'plural-predicate',
        expr: 'subject.isPlural("TimeSeries")',
        expected: true,
      },
      {
        id: 'plain-series',
        expr: 'subject.singular("Series")',
        expected: 'Series',
      },
      {
        id: 'ordinary-camel',
        expr: 'subject.singular("UserAccounts")',
        expected: 'UserAccount',
      },
      {
        id: 'regular-word',
        expr: 'subject.plural("city")',
        expected: 'cities',
      },
      { id: 'empty-string', expr: 'subject.singular("")', expected: '' },
    ],
  },
  {
    id: 'ms',
    name: 'ms',
    title: 'Parse the duration you just formatted.',
    repo: 'vercel/ms',
    commit: '4ff48cec099f0514c3e9bbca18706c9c21122bfb',
    path: 'src/index.ts',
    issue: 284,
    sha256: 'e1a602896c1433dcebc88cb0e075733c51ea036533296d4df513e417cf9d387e',
    problem:
      'Very large durations format with an exponent, which the parser does not recognize.',
    fix: 'Accept an optional signed exponent in the numeric part, preserving unit validation.',
    trap: 'Accepting only positive exponents fixes a large duration but rejects small exponential values.',
    before: 'NaN',
    after: 'Finite duration',
    patch: (source) =>
      replaceOnce(
        source,
        String.raw`(?<value>-?\d*\.?\d+)`,
        String.raw`(?<value>-?\d*\.?\d+(?:e[+-]?\d+)?)`,
      ),
    bad: (source) =>
      replaceOnce(
        source,
        String.raw`(?<value>-?\d*\.?\d+)`,
        String.raw`(?<value>-?\d*\.?\d+(?:e\+\d+)?)`,
      ),
    repro: [
      {
        id: 'reported-roundtrip',
        expr: 'Number.isFinite(subject.parse(subject.format(Number.MAX_VALUE)))',
        expected: true,
      },
    ],
    checks: [
      { id: 'negative-exponent', expr: 'subject.parse("1e-3s")', expected: 1 },
      {
        id: 'unsigned-exponent',
        expr: 'subject.parse("1e3ms")',
        expected: 1000,
      },
      {
        id: 'uppercase-exponent',
        expr: 'subject.parse("2E+3ms")',
        expected: 2000,
      },
      { id: 'negative-value', expr: 'subject.parse("-1e-3s")', expected: -1 },
      {
        id: 'ordinary-units',
        expr: 'subject.parse("2 hours")',
        expected: 7200000,
      },
      {
        id: 'bad-exponent',
        expr: 'Number.isNaN(subject.parse("1e+s"))',
        expected: true,
      },
      {
        id: 'bad-unit',
        expr: 'Number.isNaN(subject.parse("1e3cats"))',
        expected: true,
      },
      {
        id: 'roundtrip-tolerance',
        expr: 'Math.abs(subject.parse(subject.format(1e35))/1e35-1) < 1e-12',
        expected: true,
      },
    ],
  },
];
