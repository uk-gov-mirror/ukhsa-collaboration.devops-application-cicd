# React container fixture (pnpm)

A small React application rendered to HTML at build time and hydrated in the browser. The production Dockerfile bundles the client with esbuild and serves it with nginx. Build from the repository root so Docker context and npm package directory differ.

Run `pnpm install --frozen-lockfile --prod=false`, `pnpm run lint`, `pnpm test`, and `pnpm run build` in this directory. Tests render the React component and write LCOV coverage. The Docker smoke test verifies the served page includes `FIXTURE_MESSAGE_SUFFIX=runtime-check` and that the client bundle is available.

See the [workflow documentation](../../docs/container-image-build-javascript-aws-ecs.md) for container commands.
