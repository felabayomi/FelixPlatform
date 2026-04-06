# Felix Platform Catalog Backups

This folder stores generated catalog backup snapshots from:

```bash
npm --prefix backend run backup:catalog
```

## Nightly automation

A GitHub Actions workflow is available at:

```txt
.github/workflows/catalog-backup.yml
```

It runs nightly and on manual trigger.

## Required GitHub secret

Add this repository secret before relying on the nightly workflow:

- `DATABASE_URL` — the live Felix Platform Postgres connection string

GitHub path:

```txt
Repo Settings → Secrets and variables → Actions → New repository secret
```

## What gets backed up

- `categories`
- `products`
- `product_categories`
- `product_images`

## Recommended usage

- run a manual backup before major catalog imports or edits
- keep the GitHub Actions artifact retention active
- use Neon restore + these JSON snapshots together for recovery
