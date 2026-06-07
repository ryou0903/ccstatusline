# Windows Support

`ccstatusline` works on Windows across PowerShell (5.1+ and 7+), Command Prompt, and Windows Subsystem for Linux (WSL).

If you want the main project overview, return to [README.md](../README.md).

## Installation on Windows

### Option 1: Using Bun (Recommended)

```powershell
# Install Bun for Windows
irm bun.sh/install.ps1 | iex

# Run ccstatusline
bunx -y ccstatusline@latest
```

### Option 2: Using Node.js

```powershell
# Using npm
npx -y ccstatusline@latest

# Or with Yarn
yarn dlx ccstatusline@latest

# Or with pnpm
pnpm dlx ccstatusline@latest
```

## Claude Code Integration

Configure `ccstatusline` in your Claude Code settings:

**Settings location:**
- Default: `%USERPROFILE%\.claude\settings.json`
- Custom: set `CLAUDE_CONFIG_DIR` to use a different directory

**PowerShell custom config example:**

```powershell
$env:CLAUDE_CONFIG_DIR="C:\custom\path\.claude"
```

**For Bun users:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bunx -y ccstatusline@latest",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

**For npm users:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline@latest",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

`refreshInterval` is optional and only supported by Claude Code >=2.1.97. You can configure it from ccstatusline's TUI after installation.

### Running a GitHub fork on a native Claude Code install (no Node.js)

The **native install** of Claude Code (the standalone installer / single binary) does **not** ship Node.js, so `npx -y ccstatusline@latest` cannot run. Installing a fork (for example a localization) straight from GitHub is also unreliable: `bun x github:<owner>/<repo>` currently crashes Bun on Windows (internal assertion failure during dependency resolution).

The robust approach is to **clone the fork and compile it to a self-contained `.exe` with Bun**, then point Claude Code at that binary. This needs only Bun and Git — no Node.js.

```powershell
# 1. Install Bun (skip if already installed)
irm bun.sh/install.ps1 | iex

# 2. Clone the fork
git clone --depth 1 https://github.com/<owner>/ccstatusline "$HOME\ccstatusline"

# 3. Build a standalone binary (runs the prepare build, then compiles)
Set-Location "$HOME\ccstatusline"
& "$HOME\.bun\bin\bun.exe" install
& "$HOME\.bun\bin\bun.exe" build .\src\ccstatusline.ts --compile --outfile ccstatusline.exe
```

Then register the compiled binary in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "C:/Users/<you>/ccstatusline/ccstatusline.exe",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

> ⚠️ **Use forward slashes (`/`) in the command path.** Claude Code executes the status line command through Git Bash, which treats backslashes as escape characters. A backslash path like `C:\Users\you\...` is silently mangled into `C:Usersyou...` and fails with `command not found` (exit status 127). See [Windows Troubleshooting](#windows-troubleshooting).

The compiled `.exe` reads `~/.config/ccstatusline/settings.json` at runtime, so you can change your layout/colors from the TUI (run the `.exe` with no arguments) without rebuilding. To pull upstream changes later: `git pull` in the clone, then re-run the `bun build --compile` step.

## Windows-Specific Features

### Powerline Font Support

For optimal Powerline rendering on Windows:

**Windows Terminal** (Recommended):
- Supports Powerline fonts natively
- Download from [Microsoft Store](https://aka.ms/terminal)
- Auto-detects compatible fonts

**PowerShell/Command Prompt**:

```powershell
# Install JetBrains Mono Nerd Font via winget
winget install DEVCOM.JetBrainsMonoNerdFont

# Or download manually from: https://www.nerdfonts.com/font-downloads

# Alternative: Download and install base JetBrains Mono font
# from [JetBrains](https://www.jetbrains.com/lp/mono/)
# or [GitHub](https://github.com/JetBrains/JetBrainsMono)
# or [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)
```

### Path Handling

`ccstatusline` automatically handles Windows-specific paths:
- Git repositories work with both `/` and `\` path separators
- Current Working Directory widget displays Windows-style paths correctly
- Full support for mapped network drives and UNC paths
- Handles Windows drive letters (C:, D:, etc.)

## Windows Troubleshooting

### Common Issues & Solutions

**Issue**: Status line is blank and `claude --debug` shows `bash: line 1: C:Users...: command not found` (exit status 127)

```text
Cause: Claude Code runs the status line command through Git Bash
("Using bash path: C:\Program Files\Git\bin\bash.exe" in the debug log).
Git Bash treats "\" as an escape character, so a backslash path such as
C:\Users\you\ccstatusline\ccstatusline.exe collapses to
C:Usersyouccstatuslineccstatusline.exe and cannot be found.

Solution: use forward slashes in the "command" field of ~/.claude/settings.json:
  "command": "C:/Users/you/ccstatusline/ccstatusline.exe"
The command works in PowerShell/cmd with backslashes, which is why it can
look correct when tested manually — but Claude Code itself uses bash.
```

**Issue**: Powerline symbols showing as question marks or boxes

```powershell
# Solution: Install a compatible Nerd Font
winget install DEVCOM.JetBrainsMonoNerdFont
# Then set the font in your terminal settings
```

**Issue**: Git commands not recognized

```powershell
# Check if Git is installed and in PATH
git --version

# If not found, install Git:
winget install Git.Git
# Or download from: https://git-scm.com/download/win
```

**Issue**: Permission errors during installation

```powershell
# Use non-global installation (recommended)
npx -y ccstatusline@latest

# Or run PowerShell as Administrator for global install
```

**Issue**: "Execution Policy" errors in PowerShell

```powershell
# Temporarily allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Issue**: Windows Defender blocking execution

```powershell
# If Windows Defender flags the binary:
# 1. Open Windows Security
# 2. Go to "Virus & threat protection"
# 3. Add exclusion for the ccstatusline binary location
# Or use temporary bypass (not recommended for production):
Add-MpPreference -ExclusionPath "$env:USERPROFILE\.bun\bin"
```

## Windows Subsystem for Linux (WSL)

`ccstatusline` works well in WSL environments:

```bash
# Install in WSL Ubuntu/Debian
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bunx -y ccstatusline@latest
```

**WSL benefits:**
- Native Unix-style path handling
- Better font rendering in WSL terminals
- Seamless integration with Linux development workflows

## Windows Terminal Configuration

For the best experience, configure Windows Terminal with these recommended settings:

### Terminal Settings (`settings.json`)

```json
{
  "profiles": {
    "defaults": {
      "font": {
        "face": "JetBrainsMono Nerd Font",
        "size": 12
      },
      "colorScheme": "One Half Dark"
    }
  }
}
```

## Performance on Windows

`ccstatusline` includes Windows-specific runtime behavior:
- **UTF-8 piped output fix**: In piped mode, it attempts to set code page `65001` for reliable symbol rendering
- **Path compatibility**: Git and CWD widgets handle both `/` and `\` separators
