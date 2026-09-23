# Container Image Build - JavaScript/Node.js/AWS ECS

`.github/workflows/container-image-build-javascript-aws-ecs.yml` runs JavaScript checks, builds a container, optionally pushes to ECR, and optionally deploys to ECS. It calls the same `build-test-container.yml` and `deploy-aws-ecs.yml` as the Python entrypoint, selecting `runtime: javascript`.

## Quick start

The caller needs a Dockerfile, `package.json`, a committed lockfile for the selected package manager, and lint/test scripts. Pin the workflow to a release or commit containing this entrypoint (replace `YOUR_PINNED_REF`).

```yaml
name: CI
on: [pull_request, push]

permissions:
  contents: read
  actions: read
  pull-requests: write
  id-token: write

jobs:
  frontend:
    uses: ukhsa-collaboration/devops-application-cicd/.github/workflows/container-image-build-javascript-aws-ecs.yml@YOUR_PINNED_REF
    with:
      app_name: frontend
      service_identifier: my-service
      node_version: "22"
      unit_test_command: npm run test -- --run
```

The test command above suits a Vitest test script. Use a command appropriate to your project that exits after one run. The default is `<package_manager> test` (`npm test` unless configured otherwise); lint and tests receive `CI=true`. Enabled checks fail on missing scripts. The workflow supports npm, pnpm, and modern Yarn, including TypeScript projects whose package scripts provide the checks.

## JavaScript inputs

| Input | Default | Behavior |
| --- | --- | --- |
| `package_manager` | `npm` | Explicitly select `npm`, `pnpm`, or `yarn`. |
| `package_manager_version` | `""` | Exact version; otherwise read from `package.json`'s `packageManager` field. |
| `node_version` | `""` | Node version override. Uses Node 22 if neither version input is supplied. |
| `node_version_file` | `""` | Repository-relative version file, such as `.nvmrc`. An explicit `node_version` takes precedence. |
| `javascript_working_directory` | `.` | Directory containing `package.json` and the selected lockfile; installation, lint, unit and integration tests run here. |
| `lint_javascript` | `true` | Enable JavaScript linting. |
| `javascript_lint_command` | `""` | Empty resolves to `<package_manager> run lint`; a custom command is executed unchanged. |
| `run_unit_tests` | `true` | Enable unit tests. |
| `unit_test_command` | `""` | Empty resolves to `<package_manager> test`; custom commands must exit after one run. |
| `run_integration_tests` | `false` | Enable integration tests before the container build. |
| `integration_test_command` | `""` | Integration-test command. Supply when enabling integration tests. |
| `coverage_artifact_path` | `coverage/` | Repository-relative coverage paths, newline-delimited. Coverage is uploaded after unit tests, including failures, when files exist. |
| `integration_artifact_path` | `test-results/` | Repository-relative integration-test artifacts. |

Dependencies use a frozen installation: `npm ci --include=dev`, `pnpm install --frozen-lockfile --prod=false`, or `yarn install --immutable`. A missing or inconsistent lockfile fails the job. Download caches are separated by OS, architecture, package manager and version, Node version, and lockfile hash. When lint, unit tests, and integration tests are all disabled, host Node setup and dependency installation are skipped. The Dockerfile still installs anything it needs for the image build.

For a nested application, keep package paths separate from the Docker context:

```yaml
    with:
      app_name: frontend
      service_identifier: my-service
      javascript_working_directory: apps/frontend
      node_version_file: apps/frontend/.nvmrc
      docker_context: .
      dockerfile: apps/frontend/Dockerfile
      coverage_artifact_path: apps/frontend/coverage/
      integration_artifact_path: apps/frontend/test-results/
```

Artifact and version-file paths are always relative to the repository root, not `javascript_working_directory`. For workspaces, select the directory owning the lockfile and use workspace-aware lint/test commands. Private package registry authentication is not configured by this workflow.

## Selecting pnpm or Yarn

npm remains the default. If npm has no version pin, the workflow uses the version bundled with the selected Node release. For pnpm and Yarn, provide an exact version in either `package_manager_version` or the package manifest:

```json
{
  "packageManager": "pnpm@10.34.5"
}
```

Then select it in the caller:

```yaml
      package_manager: pnpm
      # package_manager_version: "10.34.5"  # Optional when package.json pins it
```

For Yarn, select `package_manager: yarn`, pin a modern Yarn version (the regression fixture uses `yarn@4.18.0`), commit `yarn.lock`, and include:

```yaml
# .yarnrc.yml
nodeLinker: node-modules
```

Yarn Classic and Plug'n'Play are not supported. The workflow installs pinned CLI packages into a temporary runner directory, without relying on Corepack being bundled with Node. It validates the active CLI version, including any repository Yarn override.

Selection is explicit: lockfiles do not override `package_manager`. The selected manager must match the manifest's `packageManager` field, and conflicting version pins fail. Versions must be exact, not `latest` or ranges. The selected lockfile must live in `javascript_working_directory` (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`). Commit any manager configuration, including pnpm dependency build-script approvals required by your application.

Custom lint, unit, integration, and deployment-test commands are executed unchanged; update any npm-specific commands when selecting a different manager. Artifact names include the application name for JavaScript builds so multiple applications can upload coverage in the same run. Use distinct application names for concurrent builds.

## Container build and deployment

The application's Dockerfile owns package-manager setup and the production build, including the appropriate build script. Use a multistage Dockerfile for a static React application or the runtime image appropriate to a Node/SSR application. Match the Dockerfile's Node version to the version used by CI. Exclude `node_modules`, coverage, and local build output with `.dockerignore`.

Shared inputs include Docker context/file, build arguments, Hadolint, layer caching, registry configuration, release tags, and container smoke testing. Outputs remain `image_uri`, `image_digest`, and `immutable_image`. No Python setup, Ruff, or pip installation runs in the JavaScript build path.

Publishing uses the existing ECR authentication flow. Add these inputs to push and optionally deploy:

```yaml
      registry_account_id: "123456789012"
      aws_registry_role_name: github-ecr
      push_image: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
      release_tag: ${{ github.sha }}
      aws_deploy_role_name: github-deploy
      deploy_environments: >-
        [{"name":"dev","aws_account_id":"210987654321","smoke_test_url":"https://dev.example.com/health"}]
```

See the [shared ECS configuration](container-image-build-python-aws-ecs.md#deployment-matrix-schema) for environment fields, role resolution, and rollback behavior. Deployment requires `push_image`, a nonempty `release_tag`, and deployment environments. The deployment job sets up Node and performs a fresh installation with the selected package manager and version when environment integration tests or post-deploy tests are configured. These test commands run in `javascript_working_directory` with `CI=true` and the existing deployment environment variables. Deployment shell scripts continue to run from the repository root.

The existing publish order is preserved: build/push, then container smoke testing. A smoke-test failure blocks deployment, but a pushed image already exists in ECR. For a long-running web server, supply a smoke command that starts the container in the background, polls HTTP, and removes the container on exit; the default foreground `docker run` command will not terminate on its own.

## Regression coverage

`_test-container-image-build-javascript-aws-ecs.yml` exercises npm, pnpm, and Yarn React fixtures with checks enabled and disabled. Each uses a nested package with the repository root as Docker context, uploads coverage and integration build output, and checks that nginx serves the rendered React page, custom build argument, and JavaScript bundle. Python regression workflows continue to cover the existing default runtime.

Package-manager configuration tests run with `python -m unittest discover -s tests -v` after installing `tests/requirements.txt`. They cover version resolution, conflicting inputs, missing lockfiles, unsupported Yarn modes, installation commands, and skipped setup when checks are disabled.

Local npm fixture checks:

```bash
cd fixtures/javascript_container_app
npm ci --include=dev
npm run lint
npm test
npm run build
```

Container smoke test, from the repository root with Docker running:

```bash
docker build -f fixtures/javascript_container_app/Dockerfile \
  --build-arg FIXTURE_MESSAGE_SUFFIX=runtime-check -t react-fixture .
IMAGE_UNDER_TEST=react-fixture bash fixtures/javascript_container_app/smoke-test.sh
```
