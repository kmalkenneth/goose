---
title: CLI Providers
---

# CLI Providers

The legacy Claude Code and Codex CLI providers have been removed from goose.

Goose still supports other CLI-based providers where available, such as Gemini CLI and Cursor Agent. For Claude and Codex integrations, use their ACP providers instead:

- [ACP Providers](./acp-providers.md)
- `claude-acp`
- `codex-acp`

If you previously configured the removed CLI providers, delete any `CLAUDE_CODE_*` or `CODEX_*` settings that targeted those legacy providers.
