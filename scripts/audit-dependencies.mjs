import { spawnSync } from 'node:child_process';

const ALLOWED_FRONTEND_ADVISORIES = new Set([
  // Kolium is a Vite SPA and does not use React Router's RSC mode, server
  // actions, or create a React Router request handler.
  'GHSA-qwww-vcr4-c8h2',
]);

const runAudit = (args) => {
  const npmCli = process.env.npm_execpath;

  if (!npmCli) {
    throw new Error('Run this dependency gate through npm run security:audit.');
  }

  const result = spawnSync(
    process.execPath,
    [npmCli, 'audit', '--json', ...args],
    {
    encoding: 'utf8',
    },
  );

  if (!result.stdout) {
    throw new Error(result.stderr || 'npm audit did not return JSON output.');
  }

  return JSON.parse(result.stdout);
};

const advisoryId = (url) => url?.split('/').pop();

const isAllowedFrontendFinding = (name, finding, vulnerabilities) => {
  if (name === 'react-router') {
    return finding.via.every(
      (entry) =>
        typeof entry !== 'string' &&
        ALLOWED_FRONTEND_ADVISORIES.has(advisoryId(entry.url)),
    );
  }

  if (name === 'react-router-dom') {
    return (
      finding.via.length === 1 &&
      finding.via[0] === 'react-router' &&
      isAllowedFrontendFinding(
        'react-router',
        vulnerabilities['react-router'],
        vulnerabilities,
      )
    );
  }

  return false;
};

const frontend = runAudit([]);
const backend = runAudit(['--prefix', 'backend']);

const frontendUnexpected = Object.entries(frontend.vulnerabilities).filter(
  ([name, finding]) =>
    !isAllowedFrontendFinding(name, finding, frontend.vulnerabilities),
);
const backendFindings = Object.entries(backend.vulnerabilities);

if (frontendUnexpected.length || backendFindings.length) {
  const names = [
    ...frontendUnexpected.map(([name]) => `frontend:${name}`),
    ...backendFindings.map(([name]) => `backend:${name}`),
  ];

  console.error(`Dependency audit failed: ${names.join(', ')}`);
  process.exit(1);
}

console.log('Dependency audit passed.');
console.log('Backend: 0 known vulnerabilities.');
console.log(
  'Frontend: only GHSA-qwww-vcr4-c8h2 is allowlisted because Kolium does not use React Router RSC mode.',
);
