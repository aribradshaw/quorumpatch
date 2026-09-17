// Anonymized case-study summaries, not transferable proof receipts.
export const pilot = {
  "schemaVersion": 1,
  "kind": "anonymized-author-reported-case-studies",
  "project": "QuorumPatch",
  "provider": "Solari",
  "independentAttestation": false,
  "autonomousRepairGeneration": false,
  "independentTestAuthors": false,
  "productionWrites": false,
  "sourceDisclosure": "Private implementation, dates, identifiers, amounts and receipt fingerprints withheld. This summary is not a cryptographic receipt.",
  "cases": [
    {
      "id": "covered",
      "title": "Already covered. No acquisition price.",
      "category": "Subscription-aware UI",
      "problem": "A covered item displayed an acquisition price.",
      "fix": "Hide the price block for covered items, preserving ordinary item pricing.",
      "mutation": "Remove the coverage guard; the unwanted price returns.",
      "checks": [
        "Covered zero-price items",
        "Covered alternate prices",
        "Ordinary item pricing",
        "Ordinary cadence labels"
      ],
      "holdouts": 4,
      "sandboxes": 4,
      "cleanupConfirmed": true,
      "boundary": "Exact UI expression with a synthetic element factory. Not a DOM or coverage-service test.",
      "next": "Author-reported anonymized result, not independent certification. Client source and receipts are not distributed."
    },
    {
      "id": "attribution",
      "title": "Keep the source of the sale.",
      "category": "Attribution",
      "problem": "A separately captured landing page was dropped during normalization.",
      "fix": "Preserve it alongside original query attributes without replacing an existing value.",
      "mutation": "Restore the old field assignment; the landing page is lost.",
      "checks": [
        "Existing attribution precedence",
        "Query encoding",
        "Long values",
        "Missing values",
        "Identity mismatch",
        "Idempotent materialization"
      ],
      "holdouts": 6,
      "sandboxes": 4,
      "cleanupConfirmed": true,
      "boundary": "Pinned transformation modules and invented lead data. No external delivery test.",
      "next": "Author-reported anonymized result, not independent certification. Client source and receipts are not distributed."
    },
    {
      "id": "eventprice",
      "title": "Report the amount actually paid.",
      "category": "Event integrity",
      "problem": "An event used a configured price instead of the charged quote.",
      "fix": "Use the paid amount and separately itemized add-on.",
      "mutation": "Restore the old price calculation; the event no longer reconciles.",
      "checks": [
        "Itemized totals",
        "Product identity",
        "Fractional amounts",
        "Transaction identity",
        "Attribution fields",
        "Invalid input and repeat-event gates"
      ],
      "holdouts": 6,
      "sandboxes": 4,
      "cleanupConfirmed": true,
      "boundary": "Pinned event-construction modules with synthetic inputs. No payment or event transmission.",
      "next": "Author-reported anonymized result, not independent certification. Client source and receipts are not distributed."
    },
    {
      "id": "checkout",
      "title": "The right package. The right price.",
      "category": "Catalog mapping",
      "problem": "A package resolved to the wrong catalog entry.",
      "fix": "Correct the mapping and reject inconsistent quote data.",
      "mutation": "Restore the wrong mapping; the package assertion fails.",
      "checks": [
        "Display and quote agreement",
        "Missing and conflicting values",
        "Invalid amount guards",
        "Existing price reuse",
        "Fee allocation"
      ],
      "holdouts": 14,
      "sandboxes": 4,
      "cleanupConfirmed": true,
      "boundary": "Pinned quote logic with synthetic service adapters. No live checkout or customer outcomes.",
      "next": "Author-reported anonymized result, not independent certification. Client source and receipts are not distributed."
    },
    {
      "id": "renewal",
      "title": "Paid coverage comes first.",
      "category": "Renewal timing",
      "problem": "Renewal could occur before prepaid coverage ended.",
      "fix": "Connect finalization to the coverage-date correction.",
      "mutation": "Remove the connection; early renewal returns.",
      "checks": [
        "Calendar boundaries",
        "Repeated processing",
        "Manual adjustments",
        "Identity mismatch",
        "Readback failure"
      ],
      "holdouts": 7,
      "sandboxes": 4,
      "cleanupConfirmed": true,
      "boundary": "Pinned billing logic using synthetic transport. Not a live subscription test.",
      "next": "Author-reported anonymized result, not independent certification. Client source and receipts are not distributed."
    },
    {
      "id": "inbox",
      "title": "Recent work, not historical noise.",
      "category": "Queue filtering",
      "problem": "Historical records crowded recent items out of a queue.",
      "fix": "Apply the intended source and date filter before counting and pagination.",
      "mutation": "Remove the lower date cutoff; the recent-item assertion fails.",
      "checks": [
        "Date boundaries",
        "Source exclusions",
        "Stable pagination",
        "Minimal projection",
        "Invalid filters and service failures"
      ],
      "holdouts": 10,
      "sandboxes": 4,
      "cleanupConfirmed": true,
      "boundary": "Locally authored candidate with synthetic query transport. UI acceptance remains separate.",
      "next": "Author-reported anonymized result, not independent certification. Client source and receipts are not distributed."
    }
  ]
} as const;

