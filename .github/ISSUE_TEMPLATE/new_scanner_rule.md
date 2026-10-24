---
name: New scanner rule proposal
about: Propose a new deterministic check for the scanner
title: "[Rule] "
labels: scanner-rule
---

See [docs/adding-a-rule.md](../../docs/adding-a-rule.md) for the full
authoring guide before implementing.

## Rule ID (proposed)

e.g. `PACKAGE_LOCK_MISSING`

## What does it check?

Describe exactly what repository content is inspected and what condition
triggers a finding.

## Why does this matter to a new contributor or maintainer?

## Evidence

What real, verifiable evidence will the finding include? (No fabricated
scores or claims.)

## Severity and category

Proposed severity (`critical` / `high` / `medium` / `low` / `info`) and
category (`documentation` / `testing` / `configuration` /
`security-hygiene` / `consistency` / `project-metadata`), with reasoning.

## False-positive risk

Are there legitimate repository layouts where this check would wrongly
fire? How does the rule avoid that?

## Project types this applies to

All projects, or gated to a specific `projectType` (e.g.
`node-javascript`)?
