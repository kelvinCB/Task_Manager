# Security policy

## Dependency baseline

Run the dependency gate with:

```bash
npm run security:audit
```

The gate audits both the frontend and backend lockfiles. It fails when npm
reports any finding other than the explicitly reviewed React Router advisory
below.

## Reviewed advisory exception

`GHSA-qwww-vcr4-c8h2` affects React Router's React Server Components mode and
server action processing. Kolium is a client-rendered Vite application using
`BrowserRouter`; it does not enable RSC mode, create a React Router request
handler, or process React Router server actions.

The advisory is allowlisted by exact ID in
`scripts/audit-dependencies.mjs`. The exception must be removed as soon as a
patched React Router release is available. Any additional React Router advisory
still fails the dependency gate.

## Browser credentials

Only a Supabase publishable key or legacy `anon` key may be assigned to
`VITE_SUPABASE_KEY`. Never expose a Supabase secret or `service_role` key
through a `VITE_` environment variable.
