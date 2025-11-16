# Fuxi EA Local Setup (macOS Tahoe 26.0.1)

These instructions assume the developer is on a MacBook Pro running macOS "Tahoe" 26.0.1 and is completely new to the Fuxi EA codebase and zsh configuration. The developer already has a GitHub account but must only work on the `dev` branch.

## 1. Prerequisites
1. Open **Terminal** (⌘+Space → “Terminal”).
2. Install Apple Xcode command line tools:
   ```bash
   xcode-select --install
   ```
3. Install Homebrew (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
4. Install Node 20 LTS for Next.js 16:
   ```bash
   brew install node@20
   echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
   source ~/.zprofile
   ```
5. Confirm the right versions are active:
   ```bash
   node -v   # expect v20.x
   npm -v
   ```

## 2. Clone the repository on the `dev` branch
1. Create a projects folder and clone only the `dev` branch:
   ```bash
   mkdir -p ~/Projects
   cd ~/Projects
   git clone --branch dev git@github.com:<your-org>/fuxi_ea.git
   cd fuxi_ea
   ```
   Replace `<your-org>` with your GitHub organization or username. Do not clone `main` or switch to it.
2. Confirm you're on `dev`:
   ```bash
   git status -sb
   git branch
   ```

## 3. Install dependencies
Inside the repo root run:
```bash
npm install
```

## 4. Run the project
Start the development server:
```bash
npm run dev
```
Visit `http://localhost:3000` to ensure the app loads.

## 5. Workflow reminders
- Always work on the `dev` branch only. Pull latest changes with `git pull origin dev` before starting each session.
- Do not push directly to `main`; open PRs against `dev` or as instructed.
- If you need a clean slate, run `npm run clean`.

## 6. Automated helper script
Once the files below are in place, run `./docs/setup/setup-local.sh` and follow the prompts to finish this setup automatically.
