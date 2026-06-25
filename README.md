# skills-repo

Manage agent skills repositories with metadata-driven install targets.

## Usage

In a skills repository:

```sh
skills-repo sync
```

Common commands:

```sh
skills-repo check
skills-repo install
skills-repo agents --explain
skills-repo list
skills-repo prune-internal
```

## Expected layout

Installable skills live under `skills/`:

```text
skills/<skill-name>/SKILL.md
```

Repo-local helper skills live under `.agents/skills/` and should set `metadata.internal: true`.

## Target metadata

Universal skills:

```yaml
metadata:
  targets:
    - universal
```

Claude-only skills:

```yaml
metadata:
  targets:
    - claude-code
```
