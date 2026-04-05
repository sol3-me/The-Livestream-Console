# GitHub Actions CI/CD – Self-Hosted Runner Deployment Guide

> **Scope:** Any repository in the `sol3uk` GitHub organisation that needs to build a Docker image in CI, push it to GitHub Container Registry (GHCR), and run it on the self-hosted host machine.

---

## 1. Infrastructure overview

```
GitHub push ──► GitHub Actions (self-hosted runner container)
                    │
                    ├─ docker build  (inside runner)
                    ├─ docker push   ──► ghcr.io/sol3uk/<image>
                    └─ docker run    ──► running container on host
```

The self-hosted runner is the `myoung34/github-runner` container.  
It shares the host Docker socket, so images built/run inside the runner are **actually running on the host**.

**Host mount for secrets/env files:**

| Host path | Path inside runner container |
|---|---|
| `/mnt/user/appdata/github_runner/persistent_files` | `/runner/persistent_files` |

---

## 2. Prerequisites

### 2.1 Self-hosted runner

The runner must already be registered and healthy. Verify with:

```bash
# On the host machine
docker ps --filter name=github-runner
```

The runner needs the labels `self-hosted`, `Linux`, `X64`. Check the runner is listed as **Idle** in:  
`https://github.com/organizations/sol3uk/settings/actions/runners`

### 2.2 Repository settings

In the repository → **Settings → Actions → General**:

- **Workflow permissions:** set to *"Read and write permissions"*  
  (allows the built-in `GITHUB_TOKEN` to push to GHCR without adding extra secrets)
- **Allow GitHub Actions to create and approve pull requests:** optional

### 2.3 GHCR package visibility

After the first successful push, make the package public (or ensure team members have `read` access):  
`https://github.com/orgs/sol3uk/packages`

---

## 3. Dockerfile requirements

Your `Dockerfile` must produce a working image that:

- Exposes **exactly one port** (record this as `CONTAINER_PORT`)
- Starts the application in the `CMD` / `ENTRYPOINT` without needing interactive input
- Does **not** bake secrets into the image — all secrets are injected at runtime via `--env-file`

A minimal multi-stage pattern (adapt language/toolchain as needed):

```dockerfile
# syntax=docker/dockerfile:1

FROM <runtime-image> AS builder
WORKDIR /app
COPY . .
RUN <build command>

FROM <runtime-image> AS runner
WORKDIR /app
COPY --from=builder /app/<build-output> .
EXPOSE <CONTAINER_PORT>
CMD ["<start command>"]
```

---

## 4. Workflow file template

Create `.github/workflows/deploy.yml` in your repository.  
Replace every `<PLACEHOLDER>` with your repo-specific value before committing.

```yaml
name: Build & Deploy <APP_DISPLAY_NAME>

on:
  push:
    branches: [master]
  workflow_dispatch:

concurrency:
  group: <APP_SLUG>-deploy   # e.g. my-app-deploy  — must be unique per repo
  cancel-in-progress: true

jobs:
  deploy:
    # Prevents forks or stale copies of this workflow from firing on the runner.
    if: |
      github.repository == 'sol3uk/<REPO_NAME>' &&
      github.ref == 'refs/heads/master'
    runs-on: [self-hosted, Linux, X64]
    permissions:
      contents: read
      packages: write   # required to push to GHCR

    env:
      IMAGE:          ghcr.io/sol3uk/<IMAGE_NAME>    # e.g. ghcr.io/sol3uk/my-app
      CONTAINER_NAME: <CONTAINER_NAME>               # e.g. my-app
      HOST_PORT:      "<HOST_PORT>"                  # e.g. "8091" — must be free on host
      CONTAINER_PORT: "<CONTAINER_PORT>"             # e.g. "3000" — matches EXPOSE in Dockerfile
      # Path as seen inside the runner container.
      # Host path /mnt/user/appdata/github_runner/persistent_files is mounted
      # at /runner/persistent_files inside myoung34/github-runner.
      ENV_FILE: /runner/persistent_files/<APP_SLUG>/.env.local

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Preserve current :latest as :previous (rollback image)
        run: |
          if docker pull ${{ env.IMAGE }}:latest 2>/dev/null; then
            docker tag  ${{ env.IMAGE }}:latest ${{ env.IMAGE }}:previous
            docker push ${{ env.IMAGE }}:previous
          fi

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
          driver: docker   # loads built image into local daemon immediately

      - name: Build image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          load: true
          tags: ${{ env.IMAGE }}:latest

      - name: Push :latest to GHCR
        run: docker push ${{ env.IMAGE }}:latest

      - name: Verify env file exists on host
        run: |
          if [ ! -f "${{ env.ENV_FILE }}" ]; then
            echo "ERROR: ${{ env.ENV_FILE }} not found on runner host."
            echo "Create it before deploying:"
            echo "  mkdir -p /runner/persistent_files/<APP_SLUG>"
            echo "  nano /runner/persistent_files/<APP_SLUG>/.env.local"
            exit 1
          fi

      - name: Restart container
        run: |
          docker rm -f "${{ env.CONTAINER_NAME }}" 2>/dev/null || true
          docker run -d \
            --name "${{ env.CONTAINER_NAME }}" \
            --restart unless-stopped \
            -p "${{ env.HOST_PORT }}:${{ env.CONTAINER_PORT }}" \
            --env-file "${{ env.ENV_FILE }}" \
            "${{ env.IMAGE }}:latest"

      - name: Clean up dangling images
        run: docker image prune -f
```

### Placeholder reference

| Placeholder | Description | Example |
|---|---|---|
| `<APP_DISPLAY_NAME>` | Human-readable name shown in the Actions tab | `My App` |
| `<REPO_NAME>` | Exact GitHub repository name | `My-App` |
| `<APP_SLUG>` | Short lowercase slug, used for concurrency group & env file folder | `my-app` |
| `<IMAGE_NAME>` | GHCR image name (usually lowercase repo slug) | `my-app` |
| `<CONTAINER_NAME>` | Name Docker assigns to the running container | `my-app` |
| `<HOST_PORT>` | Port exposed on the **host** machine | `8091` |
| `<CONTAINER_PORT>` | Port the app listens on **inside** the container (matches `EXPOSE`) | `3000` |

---

## 5. Pre-deployment host setup

Before the first deployment, create the env file on the host machine:

```bash
# SSH into the host, then:
mkdir -p /mnt/user/appdata/github_runner/persistent_files/<APP_SLUG>
nano /mnt/user/appdata/github_runner/persistent_files/<APP_SLUG>/.env.local
```

Populate `.env.local` with the secrets your application needs at runtime.  
**Do not commit this file to the repository.**

Example `.env.local` structure (adapt to your app):

```dotenv
# Application secrets — never commit this file
SECRET_KEY=your-secret-here
DATABASE_URL=postgres://host:5432/db
SOME_API_KEY=...
```

> **Tip:** Keep an `.env.example` file in the repo with all required key names but no values, so other developers know what to populate.

---

## 6. Host port allocation

Keep a record of which host port each container uses to avoid conflicts.  
All running containers can be inspected with:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Pick a free port for `HOST_PORT`. The existing apps in the org use:

| App | Host port |
|---|---|
| `livestream-console` | 8090 |
| *(your new app)* | 8091+ |

---

## 7. How the deployment flow works end-to-end

1. **Push to `master`** triggers the workflow (or trigger manually via *Run workflow*)
2. The runner **checks out** the code
3. The runner **authenticates to GHCR** using the auto-generated `GITHUB_TOKEN`
4. The existing `:latest` image is **retagged `:previous`** in GHCR (enables one-step rollback)
5. Docker **builds** the new image locally in the runner daemon
6. The new image is **pushed** to `ghcr.io/sol3uk/<IMAGE_NAME>:latest`
7. The workflow **verifies** the `.env.local` file exists on the host — exits with a clear error if not
8. The old container is **stopped and removed**; the new container is **started** with `docker run`
9. **Dangling images** are pruned to keep the host disk clean

Because the runner shares the host Docker socket, the container started in step 8 is a real process on the host, accessible at `http://<host-ip>:<HOST_PORT>`.

---

## 8. Rollback

If a deployment breaks the application, roll back to the previous image without a code change:

```bash
# SSH into the host machine
docker rm -f <CONTAINER_NAME>
docker pull ghcr.io/sol3uk/<IMAGE_NAME>:previous
docker run -d \
  --name <CONTAINER_NAME> \
  --restart unless-stopped \
  -p <HOST_PORT>:<CONTAINER_PORT> \
  --env-file /mnt/user/appdata/github_runner/persistent_files/<APP_SLUG>/.env.local \
  ghcr.io/sol3uk/<IMAGE_NAME>:previous
```

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Workflow never triggers | Runner is offline / unhealthy | Check `docker ps` for the runner container; restart it if stopped |
| `GITHUB_TOKEN` permission denied on GHCR push | Workflow permissions not set to read/write | Settings → Actions → General → Workflow permissions |
| `ERROR: .env.local not found` | Env file not yet created on host | Follow section 5 |
| Port already in use | Another container is using `HOST_PORT` | Pick a different `HOST_PORT` (see section 6) |
| Container exits immediately | App crashes on startup; bad env var | Run `docker logs <CONTAINER_NAME>` on the host |
| Old code still running after deploy | Concurrency group cancel-in-progress fired | Re-run the workflow manually |
| Image not visible in GHCR | Package is private and not linked to repo | Go to the package settings and link it to the repo |

---

## 10. Checklist for adding a new repo

- [ ] `Dockerfile` exists and builds successfully locally
- [ ] Port the app listens on is noted as `CONTAINER_PORT`
- [ ] `.env.example` committed to repo with all required key names
- [ ] `.env.local` added to `.gitignore` and `.dockerignore`
- [ ] Workflow file created at `.github/workflows/deploy.yml` with all placeholders filled
- [ ] Repository **Workflow permissions** set to *Read and write*
- [ ] `.env.local` created on host at `/mnt/user/appdata/github_runner/persistent_files/<APP_SLUG>/.env.local`
- [ ] `HOST_PORT` chosen and confirmed free on host
- [ ] First deployment triggered (push to `master` or manual dispatch)
- [ ] Container confirmed running: `docker ps --filter name=<CONTAINER_NAME>`
- [ ] Application accessible at `http://<host-ip>:<HOST_PORT>`

---

*This guide is based on the pattern established in `sol3uk/The-Livestream-Console`. The runner infrastructure, GHCR registry, and persistent-files mount path are shared across all repos in the org.*
