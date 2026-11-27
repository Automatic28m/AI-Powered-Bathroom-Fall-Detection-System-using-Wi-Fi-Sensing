# Git Flow

How we use Git and GitHub. Keep it simple: **one integration branch (`develop`), short feature branches, PRs for everything.**

## 1. Repo layout (one repo for everything)

```
/
├─ firmware/     ESP32 Tx/Rx (ESP-IDF, C)          ศักดา
├─ gateway/      Pi Zero 2 W serial → UDP (Python)  ศักดา
├─ ai/           AI service + training (Python)     พัลลภ
├─ web/          Next.js app (JavaScript)           พลกฤต
├─ infra/        docker-compose, cloudflared, WSL2  พัลลภ
├─ docs/         PRD, Design, Contract, etc.        all
└─ README.md
```

## 2. Branches

We use **GitHub Flow on `develop`**, with `main` for milestone releases:

- **`develop`**: the default branch. Every feature branch starts here and merges back here. Protected: no direct pushes, only merged PRs.
- **`main`**: always works, demo-ready. Updated only at milestones by a PR from `develop` into `main` (see §6).
- **Short-lived branches** off `develop`, merged back with a PR. Delete them after merging.

Branch name: `<type>/<area>-<short-description>`

| Type | When |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documents only |
| `chore/` | Setup, config, dependencies |
| `exp/` | AI experiment (may never be merged) |

**Areas:** `firmware`, `gateway`, `ai`, `web`, `db`, `infra`, `docs`

Examples:
- `feat/web-accounts-page`
- `fix/gateway-serial-reconnect`
- `exp/ai-lora-qwen35-2b`
- `docs/report-chapter2`

## 3. Commits

Format: [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<area>): <what changed, present tense, lowercase>

<optional body: why>
```

| Type | Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documents |
| `refactor` | Code change with no behavior change |
| `test` | Tests |
| `chore` | Build, config, dependencies |

Examples:
```
feat(web): add bathroom baseline upload
fix(ai): skip window when packet loss > 20%
docs(design): add UDP packet format
chore(infra): pin vllm version in compose
```

- Small commits that each do one thing.
- Write in English.

## 4. Pull requests

1. Push your branch, open a PR into `develop`.
2. Fill in the template ([`.github/pull_request_template.md`](../.github/pull_request_template.md)): **what** changed, **why**, **how to test**, and the linked PRD IDs (e.g. `WA-9`).
3. **At least 1 approval** from another member before merging.
4. **Squash and merge.** The PR title becomes the commit, so use the commit format for it.
5. Delete the branch.

**Who reviews:**

| Change touches | Reviewer |
|---|---|
| `web/prisma/` (DB schema) | **พัลลภ + พลกฤต, both required** |
| UDP packet format (`gateway/` ↔ `ai/`) | **ศักดา + พัลลภ, both required** |
| `firmware/`, `gateway/` | anyone (prefer พัลลภ) |
| `ai/`, `infra/` | anyone (prefer ศักดา) |
| `web/` | anyone (prefer พัลลภ) |
| `docs/` | anyone |

- Review within **2 days**. If it's urgent, ping in Discord.
- Keep PRs small, around 400 changed lines or fewer if possible.

## 5. Never commit

| What | Where it goes instead |
|---|---|
| `.env`, passwords, SMTP / auth / tunnel tokens | `.env` locally. Commit `.env.example` with fake values. |
| CSI recordings, datasets | Server `/data/recordings/` + a shared drive backup |
| Model weights, LoRA adapters | Server `/data/models/` |
| Heatmap images, baselines | Server `/data/` |
| `node_modules/`, `__pycache__/`, `.venv/`, `build/`, `.next/` | ignored (see `.gitignore`) |

Personal or editor-specific files go in your own `.git/info/exclude`, not in the shared `.gitignore`.

If you commit a secret by mistake: **change the secret right away**, then tell the team. Deleting the commit isn't enough.

## 6. Tags (milestones)

At each milestone, merge `develop` into `main` with a PR, then tag `main` so we can always get back to a working demo:

| Tag | When |
|---|---|
| `v0.1-csi-flowing` | M1 |
| `v0.5-progress` | Progress exam |
| `v0.9-e2e` | M7 end-to-end |
| `v1.0-final` | Final defense |

```bash
git tag -a v0.5-progress -m "Progress exam demo"
git push origin v0.5-progress
```

## 7. Setup (each member, once)

```bash
git config user.name  "<your name>"
git config user.email "<your GitHub email>"
```

| Member | GitHub email |
|---|---|
| พัลลภ บุญเหลือ | phanlop.auto@gmail.com |
| ศักดา เบ้าคำ | sakda130646@gmail.com |
| พลกฤต สมทรง | phonlakrit012@gmail.com |

## 8. Daily routine

```bash
git switch develop && git pull           # start from latest
git switch -c feat/web-houses-page       # new branch
# ...work, commit often...
git fetch origin && git rebase origin/develop   # stay up to date
git push -u origin feat/web-houses-page  # then open a PR
```
