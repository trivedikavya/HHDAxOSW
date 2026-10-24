## What does this change?

A concise description of the change and why it's needed.

## Type of change

- [ ] Bug fix
- [ ] New scanner rule
- [ ] New AI model adapter
- [ ] UI/UX change
- [ ] Documentation
- [ ] Other (describe above)

## Checklist

- [ ] `npm test` passes locally (shared + server + client)
- [ ] `npm run build` succeeds
- [ ] Tests were added or updated for this change (positive, negative,
      and edge cases for a new scanner rule; a meaningful RTL test for a
      new UI component)
- [ ] No secrets, API keys, or real credentials were added anywhere
      (including tests, fixtures, and `.env.example`)
- [ ] Deterministic findings and AI suggestions remain visually and
      structurally distinct (if this change touches either)
- [ ] No fabricated test results, scan output, or "verified" claims were
      introduced
- [ ] Documentation was updated if behavior, setup, or scope changed
      (README, `docs/`, or inline comments as appropriate)

## How was this tested?

Describe what you ran and observed. "I ran `npm test` and all N tests
passed" is good; "should work" is not enough.

## Screenshots (for UI changes)

If this changes anything visible, a before/after screenshot helps
reviewers a lot.
