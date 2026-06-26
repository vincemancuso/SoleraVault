# SoleraVault

SoleraVault is a modern whiskey journal and analytics dashboard for at-home infinity bottles.

**Track. Blend. Drink. Share.**

An infinity bottle is a bottle where you continually add varying amounts of spirits and periodically remove pours. SoleraVault treats the bottle as perfectly mixed: every removal proportionally reduces every current component. The full transaction ledger is the source of truth, and the app replays that ledger to calculate the current blend.

![SoleraVault logo](public/brand/soleravault-logo.png)

## Vibecoded notice

This MVP was fully vibecoded with AI assistance. Treat it as an early product prototype: review the code, security model, data model, and generated spirit metadata before using it for anything beyond local experimentation.

## MVP features

- Single default user, ready for future auth.
- Multiple bottles per user.
- Create, edit, archive, and delete bottles.
- Manual spirit database with proof, category, mash bill estimates, and flavor profile fields.
- "My Bar" view for liquors you own and use in blends.
- Add spirits to a bottle and remove pours in oz or ml.
- Edit bar bottles or delete transactions, then replay affected ledgers.
- Derived current bottle state: volume, ABV, proof, contributors, category mix, mash bill estimate, flavor profile, and snapshots.
- Dashboard visualizations: custom SVG bottle composition, Recharts radar/bar/history charts, and proof summary.
- Seed data for common whiskeys.
- Unit tests for the core blend math.
- Optional OpenAI-assisted spirit lookup service. Manual entry works without OpenAI.

## Using the app

Once the dev server is running, open `http://localhost:3000` or the local URL printed by Next.js.

1. Create or open a bottle from the home page.
2. Go to **My Bar** and add bottles you own. Enter the name manually, or set `OPENAI_API_KEY` and click **Complete with AI** after typing a bottle name to generate editable draft metadata.
3. Review AI-filled fields before saving. Proof, ABV, category, mash bill, and flavor estimates affect bottle analytics.
4. Open an infinity bottle and click **Add spirit** to add measured amounts from My Bar.
5. Click **Remove pour** whenever you drink, share, or sample from the infinity bottle.
6. Use the dashboard to review current proof, volume, component shares, category mix, estimated flavor, estimated mash bill, and history over time.
7. Edit or delete transactions from the bottle history if you entered a pour incorrectly. SoleraVault replays the ledger after every change.
8. Edit bottles in My Bar when you learn better metadata. If that spirit has already been used in a bottle, affected bottle analytics are replayed.
9. Remove bottles from My Bar only if they have not been used in an infinity bottle ledger.

## How the blend math works

All internal liquid volumes are stored in milliliters. ABV is stored as a percentage such as `50.5`, and proof is `ABV * 2`.

For an `ADD` transaction, SoleraVault adds the transaction volume to that spirit component and stores ethanol as:

```txt
ethanolMl = amountMl * abvPercent / 100
```

For a `REMOVE` transaction, the app assumes the bottle is perfectly mixed:

```txt
removalFraction = amountRemovedMl / currentTotalVolumeMl
remainingVolumeMl *= 1 - removalFraction
remainingEthanolMl *= 1 - removalFraction
```

Transactions are the source of truth. Whenever a transaction changes, derived `BottleComponent` and `BottleSnapshot` rows are cleared and regenerated in chronological order.

Mash bill and flavor profile are estimates. Grain percentages and flavor dimensions are weighted by each component's current remaining volume. Unknown mash bill fields are ignored where needed, and confidence/notes are preserved so the UI can show the estimate honestly.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to a PostgreSQL database URL. `OPENAI_API_KEY` is optional.

For the easiest local setup, use the project-local Postgres helper in step 3. It generates a local password and updates `.env` for you.

If you prefer Docker Compose, set a local-only password in `.env` first:

```env
SOLERAVAULT_POSTGRES_PASSWORD="your-local-dev-password"
DATABASE_URL="postgresql://postgres:your-local-dev-password@localhost:5432/soleravault?schema=public"
OPENAI_API_KEY=""
```

3. Start PostgreSQL.

If Docker is installed, use:

```bash
npm run db:start
```

This uses Docker Compose and exposes Postgres on `localhost:5432`.

If Docker is not installed, use the project-local Homebrew/Postgres helper instead:

```bash
npm run db:local
```

That starts an isolated local Postgres data directory at `.postgres-data`, exposes it on `localhost:55432`, creates the `soleravault` database, generates an ignored local password, and updates `.env` automatically.

4. Create the database tables:

```bash
npm run prisma:migrate
```

5. Seed common spirits:

```bash
npm run prisma:seed
```

6. Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

7. Run tests:

```bash
npm test
```

### Database troubleshooting

If you see `Can't reach database server at localhost:5432`, the app is running but PostgreSQL is not reachable. Start it with:

```bash
npm run db:start
```

If you see `password authentication failed for user "postgres"`, you are reaching a different local Postgres server whose password does not match `.env`. The easiest fix is:

```bash
npm run db:local
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Then make sure `.env` uses the generated `localhost:55432` URL.

Then run migrations and seed data:

```bash
npm run prisma:migrate
npm run prisma:seed
```

If port `5432` is already in use, either stop the other Postgres service or change the left side of the Docker Compose port mapping, then update `DATABASE_URL` to match.

## Optional OpenAI lookup

If `OPENAI_API_KEY` is unset, SoleraVault hides or disables AI assistance and continues with manual spirit creation.

If `OPENAI_API_KEY` is set, the lookup service in `src/lib/openaiSpiritLookup.ts` can request structured draft metadata for a user-entered spirit name. AI-created metadata should be treated as a draft, not authoritative truth. Users should review and edit proof, category, mash bill, flavor profile, confidence, and warnings before saving. AI-suggested records should use `dataSource = "openai_suggested"`, `userVerified = false`, and a confidence score from the response.

The prompt explicitly asks the model not to invent exact mash bills. If proof varies by batch or the bottle is ambiguous, the response should include warnings and lower confidence.

## Product data sources

SoleraVault uses source data conservatively:

- **Manual entry** is the default source for My Bar.
- **OpenAI completion** is optional and draft-only. The user must review and edit generated metadata before saving.
- **[Kaggle](https://www.kaggle.com/datasets)** whiskey datasets may help with future enrichment, but licenses and provenance must be reviewed before bundling data into the app.
- **[TTB distilled spirits data](https://www.ttb.gov/statistics)** is useful for official aggregate industry context, but it is not a bottle-level lookup source.
- **Distiller and similar sites** can be useful research references only. Do not scrape or bundle their data unless they provide a permitted API or license.

## Public repo and secrets

Do not commit real secrets or personal data. Keep local credentials in `.env`, which is ignored by Git.

This repository intentionally includes only `.env.example` with placeholder/local-development values. Before pushing changes, check:

```bash
git status --short
rg -n "sk-|OPENAI_API_KEY=.*[A-Za-z0-9]|password|secret|token" . -g '!node_modules' -g '!.next' -g '!.postgres-data' -g '!package-lock.json'
```

Local Postgres credentials are for development only and should stay in ignored local files. Replace them for any shared, hosted, or production deployment.

## Tech stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- Recharts
- Tailwind CSS
- Vitest

Core domain modules live in:

- `src/lib/blendMath.ts`
- `src/lib/units.ts`
- `src/lib/flavorModel.ts`
- `src/lib/openaiSpiritLookup.ts`
- `src/lib/brand.ts`
