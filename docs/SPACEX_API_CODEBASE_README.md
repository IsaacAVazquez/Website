# SpaceX API Codebase README

> [!NOTE]
> External reference only. This file summarizes the upstream `r-spacex/SpaceX-API` project and is not a current source of truth for this website's implementation. Use `AGENTS.md`, `CLAUDE.md`, `README.md`, `API.md`, `ARCHITECTURE.md`, and `docs/README.md` for current site documentation.

Guide to the `r-spacex/SpaceX-API` project, based on its public docs and repository structure reviewed on April 1, 2026.

This project is an open-source, community-maintained REST API for SpaceX-related data. It is not an official SpaceX product. Its value is not just that it exposes JSON endpoints, but that it organizes a broad set of related spaceflight data into one queryable, versioned, cached, and automation-backed service.

## What This Codebase Is

At a high level, the repository is a data platform with three layers:

1. A public REST API for launches, vehicles, infrastructure, satellites, and company data.
2. A normalized backend data model that links those resources together.
3. A worker system that refreshes data, backfills relationships, and keeps derived fields current.

In practical terms, it is a backend that can power:

- launch trackers
- mission timeline apps
- SpaceX dashboards
- mobile apps
- Discord or Telegram bots
- educational tools
- analytics products
- GraphQL gateways or language-specific wrappers

The public docs already list many community wrappers and apps across web, mobile, CLI, bots, and no-code ecosystems, which is a strong signal that the codebase is useful as a platform, not just a demo API.

## Why It Matters

The strength of the project is its data model and consistency:

- launches link to rockets, crew, capsules, ships, payloads, launchpads, and landing pads
- `/query` endpoints give consumers a flexible filtering and pagination system
- background jobs keep related records in sync
- Redis caching keeps public reads fast
- route-level versioning lets the maintainers evolve one surface without breaking the whole API at once

That combination makes it far more reusable than a static JSON dump.

## Core Stack

From the repo and package manifest:

- Node.js service using ES modules
- Koa for the HTTP app and routing
- MongoDB via Mongoose for persistence
- Redis via `ioredis` for response caching
- cron-based worker jobs for refreshes and relationship updates
- Docker support for container deployment
- Jest and ESLint for testing and code quality

The package metadata currently identifies the project as version `4.0.0`, while the public API itself uses per-route version folders such as `v4` and `v5`.

## Repo Layout

```text
app.js
server.js
routes/
models/
jobs/
middleware/
lib/
docs/
tests/
Dockerfile
start.sh
```

What each area does:

- `app.js`: bootstraps Koa, loads env vars, connects MongoDB, registers middleware, and mounts routes.
- `server.js`: starts the HTTP server and handles graceful shutdown.
- `routes/`: public and admin API endpoints, organized by resource and version.
- `models/`: Mongoose models for each resource.
- `jobs/`: cron-driven refresh and maintenance tasks.
- `middleware/`: auth, authorization, cache, logging, response-time, and error handling.
- `lib/`: shared constants, healthcheck helpers, and utilities.
- `docs/`: public API docs, schemas, query guide, wrappers, and apps.
- `tests/`: automated test coverage.

## Runtime Architecture

The service runtime is straightforward:

1. `app.js` loads environment variables and opens the MongoDB connection.
2. Koa middleware enables security headers, body parsing, CORS, ETag support, conditional requests, logging, and response timing.
3. `routes/index.js` dynamically registers every versioned route module.
4. `server.js` binds the app to the default port `6673` unless `PORT` is set.
5. If `SPACEX_WORKER=true`, `start.sh` runs `jobs/worker.js` instead of the web server.

This split makes the project usable as:

- an API server
- a data-refresh worker
- a Dockerized service in production

## API Design

### Base URL

The public docs define the base URL as:

```text
https://api.spacexdata.com
```

### Versioning

Each route is versioned independently.

- Most documented resources are on `v4`
- Launches are documented on both `v4` and `v5`
- `latest` is an alias to the newest route version

Example:

```text
/v5/launches/latest
/latest/launches/latest
```

Using `latest` is convenient, but the docs explicitly warn that it may expose you to breaking changes.

### Authentication

Read routes are public. Destructive routes require an API key in the `spacex-key` header.

The codebase also enforces role-based authorization on top of authentication. That means authenticated users still need the correct role to perform actions like:

- `launch:create`
- `launch:update`
- `launch:delete`
- `cache:clear`
- `user:list`

### Caching

The API docs state that all `GET` requests and `POST` requests to `/query` routes are cached. The repo implementation uses Redis and only enables that cache layer in production.

Documented cache windows include:

- launches: 20 seconds
- capsules, cores, launchpads, landpads, crew, ships, payloads: 5 minutes
- dragons, rockets: 24 hours

The service also exposes cache and timing headers such as:

- `spacex-api-cache`
- `spacex-api-response-time`

### Date Handling

Launch dates need careful interpretation. The docs call out these fields:

- `date_utc`
- `date_unix`
- `date_local`
- `date_precision`
- `tbd`
- `net`

This matters because some launch dates are partial. A date may point to the first day of a month or year while `date_precision` explains the real granularity.

## Main Resource Families

The documented public resources are:

| Resource | Version | What it represents |
| --- | --- | --- |
| Capsules | `v4` | Serialized Dragon capsules and their reuse history |
| Company | `v4` | SpaceX company profile, headquarters, leadership, summary |
| Cores | `v4` | First-stage booster core records |
| Crew | `v4` | Crew member records tied to missions |
| Dragons | `v4` | Dragon vehicle versions and characteristics |
| History | `v4` | Historical SpaceX events |
| Landpads | `v4` | Landing pads and drone ship landing surfaces |
| Launches | `v4`, `v5` | Mission-level records, links, timing, failures, payload relationships |
| Launchpads | `v4` | Launch site infrastructure |
| Payloads | `v4` | Payload metadata, customers, orbit details |
| Roadster | `v4` | Elon Musk's Tesla Roadster orbital record |
| Rockets | `v4` | Rocket family specs, staging, engines, dimensions, costs |
| Ships | `v4` | SpaceX support and recovery fleet data |
| Starlink | `v4` | Satellite records plus orbit data and computed position info |

Two special cases stand out:

- `company` is effectively a singleton resource.
- `roadster` is a singleton record rather than a traditional collection.

## Endpoint Patterns

Most collection-style resources follow the same pattern:

```text
GET    /v4/<resource>
GET    /v4/<resource>/:id
POST   /v4/<resource>/query
POST   /v4/<resource>        # authenticated create
PATCH  /v4/<resource>/:id    # authenticated update
DELETE /v4/<resource>/:id    # authenticated delete
```

Launches add convenience endpoints:

```text
GET /v5/launches/past
GET /v5/launches/upcoming
GET /v5/launches/latest
GET /v5/launches/next
```

Singleton-style surfaces differ slightly:

- `GET /v4/company`
- `PATCH /v4/company/:id`
- `GET /v4/roadster`
- `POST /v4/roadster/query`

There are also internal or administrative surfaces in the codebase:

- `/v4/admin/cache`
- `/v4/admin/health`
- `/v4/users/*`

Those are important for operations, even though the public docs focus primarily on the space-data endpoints.

## Query System

One of the most powerful parts of the codebase is the shared `/query` pattern.

All `/query` endpoints accept a body shaped like this:

```json
{
  "query": {},
  "options": {}
}
```

According to the docs:

- `query` accepts MongoDB-style `find()` filters
- `options` accepts pagination, sorting, field selection, and population controls

Common options include:

- `select`
- `sort`
- `offset`
- `page`
- `limit`
- `pagination`
- `populate`

This turns the API into a consumer-friendly data explorer. Instead of downloading everything and filtering client-side, a client can ask focused questions directly against the API.

Example use cases:

- launches between two dates
- all upcoming launches sorted by flight number
- text search against a collection
- payloads populated inside launches
- nested populate chains for multi-hop relationships

## Data Relationships

The launch model is the center of the graph.

From the docs and schemas, a launch can reference:

- rocket
- crew
- ships
- capsules
- payloads
- launchpad
- cores
- landpads through core landing metadata

The docs also explain that these relationships can be populated in `/query` requests so IDs can be replaced with full related documents.

That is a major strength of the codebase because it supports:

- detail pages
- drill-down dashboards
- mission timelines
- reusable data widgets

without forcing consumers to manually orchestrate every join.

## Schema Highlights

### Launches

Launch records are rich and product-ready. They include:

- identifiers and naming
- UTC, Unix, and local date formats
- launch outcome and failure details
- fairing reuse and recovery state
- crew, payload, rocket, and vehicle relationships
- media links such as patch images, webcast links, articles, and Wikipedia

This makes launches the best starting point for most apps.

### Rockets

Rocket records cover:

- active status
- stage count
- boosters
- cost per launch
- success rate
- dimensions and mass
- payload weights
- first-stage and second-stage specs
- engine configuration
- landing legs
- images, Wikipedia, and description

That schema is strong enough for comparison tools, technical explainers, and hardware reference UIs.

### Capsules

Capsule records emphasize lifecycle and reuse:

- serial
- status
- Dragon generation
- reuse counts
- water and land landings
- last update
- linked launches

This is useful for reuse visualizations and mission-history tooling.

### Company

Company data is lightweight but useful for summary views:

- founding and employee counts
- launch site counts
- leadership
- headquarters
- valuation
- external links
- summary text

### Starlink

Starlink is one of the most interesting resources in the repo because it blends mission data with orbital data.

The docs note that Starlink includes raw Space Track orbit information updated hourly, and the worker code computes live-ish derived data such as:

- longitude
- latitude
- height
- velocity
- launch linkage
- Starlink version tagging

That makes the repo useful for satellite visualizations, constellation maps, and orbit-tracking products.

## Background Jobs and Freshness

This is not a passive API. The worker actively maintains the dataset.

From `jobs/worker.js`, scheduled jobs include:

- launches: every 10 minutes
- landpads: every 10 minutes
- launchpads: every 10 minutes
- capsules: every 10 minutes
- cores: every 10 minutes
- roadster: every 10 minutes
- upcoming launches: every 10 minutes
- webcast: every 5 minutes
- payloads: hourly at `:25`
- starlink: hourly at `:35`
- launch-library sync: hourly at `:45`

The worker does more than fetch data. For example:

- it backfills reverse launch relationships into capsules, cores, crew, landpads, launchpads, payloads, and ships
- it recalculates rocket success rate percentages
- it maps Starlink satellites to launches and computes orbital position data

That means the codebase already contains useful logic for data normalization and enrichment, not just API exposure.

## Operational Notes

Important runtime values inferred from the repo include:

- `SPACEX_MONGO`: MongoDB connection string
- `SPACEX_REDIS`: Redis connection string
- `PORT`: API port override
- `SPACEX_WORKER`: toggles worker mode
- `SPACEX_API`: internal API base URL used by jobs
- `SPACEX_KEY`: privileged API key used by jobs for authenticated updates
- `SPACEX_TRACK_LOGIN` and `SPACEX_TRACK_PASSWORD`: credentials for Space-Track integration

Container behavior is also simple:

- the Docker image uses Node 18 Alpine
- it exposes port `6673`
- `start.sh` decides whether the container runs the server or the worker

## What You Can Build With It

This codebase has real platform potential because it already solves the hard backend pieces.

### Product ideas

- launch countdown and notification apps
- mission archive websites
- rocket comparison tools
- capsule and booster reuse dashboards
- payload and customer explorers
- Starlink orbit maps
- classroom or museum kiosks
- voice assistants and chatbots
- CLI utilities for launch info

### Developer-platform ideas

- GraphQL wrappers
- SDKs for additional languages
- analytics datasets
- alerting pipelines for upcoming launches
- data exports for BI tools
- internal dashboards for moderators or editors

### Content and media ideas

- automatic mission pages
- social graphics or widgets
- launch history timelines
- “what launched this week” summaries
- interactive maps for launchpads and landpads

The existing wrappers and apps documented by the project show that this potential is already validated in the wild.

## Strengths

- broad coverage of SpaceX entities in one place
- consistent REST structure
- flexible query system
- linked data model
- automated freshness jobs
- production-oriented caching
- ecosystem proof through community clients and apps

## Limitations and Cautions

- it is community-maintained and unofficial
- `latest` can introduce breaking changes
- the query system is powerful, but it assumes familiarity with Mongo-style filters
- partial launch dates need `date_precision` to be interpreted correctly
- write and admin paths depend on API keys and role-based permissions
- freshness depends on external data sources and scheduled jobs

## Bottom Line

`r-spacex/SpaceX-API` is best understood as a reusable space-data backend, not just a public endpoint list. It combines a practical REST surface, a linked document model, a query abstraction, background enrichment jobs, and operational features like Redis caching and role-based auth.

If you want to build anything around SpaceX launches, vehicles, satellites, or related mission data, this codebase already provides a strong foundation. Its biggest potential is as the data layer for products that need both breadth of coverage and enough structure to answer non-trivial questions.

## Source Material

- [Upstream repo README](https://github.com/r-spacex/SpaceX-API/blob/master/README.md)
- [API docs index](https://github.com/r-spacex/SpaceX-API/blob/master/docs/README.md)
- [Query and pagination guide](https://github.com/r-spacex/SpaceX-API/blob/master/docs/queries.md)
- [Known API clients](https://github.com/r-spacex/SpaceX-API/blob/master/docs/clients.md)
- [Known apps](https://github.com/r-spacex/SpaceX-API/blob/master/docs/apps.md)
