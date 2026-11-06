import { execSync } from 'node:child_process';

// Build-time provenance for the footer deploy stamp. Uses the commit (not the
// wall clock) so the client build and the SSR prerender build — separate
// `vite build` runs — always agree and hydration never mismatches.
const git = (args: string): string | undefined => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
};

export const buildInfoDefines = (): Record<string, string> => {
  const sha = process.env.GITHUB_SHA || git('rev-parse HEAD') || '';
  const date = git('log -1 --format=%cs') || '';
  return {
    __BUILD_SHA__: JSON.stringify(sha),
    __BUILD_DATE__: JSON.stringify(date),
  };
};
