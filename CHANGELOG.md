# Changelog

All notable changes to this project are documented in this file, in
English, newest first.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning policy (applies to every change from now on)

- **Every change gets a version bump and a changelog entry.** No change is
  pushed without both.
- The current version lives in `package.json` (`"version"`) and is kept in
  sync in `package-lock.json`. Bump it with
  `npm version <major|minor|patch> --no-git-tag-version`.
- How to choose the bump:
  - **MAJOR** (`X.0.0`) — breaking changes (incompatible API/data/behaviour).
  - **MINOR** (`0.X.0`) — new backwards-compatible features.
  - **PATCH** (`0.0.X`) — backwards-compatible bug fixes and small changes.
- Each release gets a `## [X.Y.Z] - YYYY-MM-DD` section below, using the
  categories **Added / Changed / Deprecated / Removed / Fixed / Security**
  as needed. Work in progress is collected under `## [Unreleased]`.
- Release commits use the message `chore(release): vX.Y.Z — <summary>` and
  are pushed automatically to the working branch
  (`arena/5a6045f4-fazilatma`).

## [Unreleased]

_Nothing yet._

## [1.0.0] - 2026-11-03

First versioned release. The complete project was transferred from branch
`arena/01a020d5-fazilatma` to this branch (`arena/5a6045f4-fazilatma`) by
fast-forwarding to that branch's tip, so its full history is preserved
verbatim (310 commits, 2026-08-20 → 2026-10-29, on top of `8385722`;
run `git log` for the per-commit detail). Until now the project had no
version number, no changelog and no tags — this release establishes the
baseline.

### Added

- **Versioning baseline:** `package.json` / `package-lock.json` pinned to
  `1.0.0` and this `CHANGELOG.md` created with the policy above.
- Everything developed on `arena/01a020d5-fazilatma` (80 `feat`, 149 `fix`,
  59 `ui`, plus `seo`/`content`/`chore`/`deploy`/`data` commits), including:
  - Hybrid storefront + request marketplace ("OptiBid") on Next.js 16 /
    React 19, with an admin-controlled reverse-auction pilot shown on the
    storefront home, seller acquisition banner, cart and shop ordering.
  - Marketplace price engine for Digikala and Torob: exact/canonical
    product matching, buy-box reading, lowest-price aggregation across
    multiple source links, stale-price expiry, duplicate-listing handling,
    and canonical detail-page verification (the most recent imported work).
  - Catalog tooling: native admin product scraper, staged 10,000-product
    universal crawler, CSV import/merge/repair across sources, external
    Digikala catalog cache, switchable laptop and PC-parts catalogs.
  - Real price history: recording, selectable ranges, chart with modal
    view and tooltips, refresh from the product page.
  - Product enrichment: specs/reviews on product pages, technical-spec
    extraction from product text, product photos, price-range filter,
    shop search, Torob product feed API (`/api/torob/products`).
  - Payments via Zarinpal, social auth callbacks, support chat,
    admin-managed eNAMAD badge, admin homepage/storefront sliders and
    category management, SEO helpers.
  - Cloudflare deployment pipeline: OpenNext worker artifact build
    (`scripts/worker-artifact.mjs`) with the ready-to-deploy `.open-next/`
    worker output tracked in the repo for fast deploys (see `.gitignore`).

### Changed

- Development continues on branch `arena/5a6045f4-fazilatma`; all future
  changes are committed and pushed there automatically, each with a
  version bump and a changelog entry per the policy above.
