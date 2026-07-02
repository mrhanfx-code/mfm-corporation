# Graph Report - mfm-corporation  (2026-07-02)

## Corpus Check
- 278 files · ~1,647,066 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 35 nodes · 33 edges · 5 communities (4 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aaeadba9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 8 edges
2. `config` - 1 edges
3. `private` - 1 edges
4. `dev` - 1 edges
5. `build` - 1 edges
6. `lint` - 1 edges
7. `preview` - 1 edges
8. `deploy` - 1 edges
9. `cf-typegen` - 1 edges
10. `bcryptjs` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (5 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, @opennextjs/cloudflare, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/node (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (9): dependencies, bcryptjs, clsx, next, next-auth, react, react-dom, server-only (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (8): scripts, build, cf-typegen, deploy, dev, lint, preview, start

### Community 3 - "Community 3"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **30 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.510) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.392) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._