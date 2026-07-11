---
name: github
description: Use GitHub MCP tools to inspect repositories, triage issues and pull requests, and check CI status with read-before-write discipline.
---

# Driving GitHub through MCP

Use the available GitHub MCP tools as the source of truth. Tool names and scopes
can vary, so read the tool schema before calling it.

## Workflow

1. Inspect repository, issue, pull request, or workflow state before proposing a
   change.
2. Prefer narrow queries: target a repo, branch, PR number, issue number, or
   workflow run instead of broad searches.
3. When triaging issues or PRs, summarize labels, status, author intent, latest
   comments, checks, and blockers.
4. For CI, read the failing job and log section before recommending a fix.
5. Do not mutate GitHub state unless the user explicitly asks you to comment,
   label, close, merge, rerun, or create something.

Report links, ids, and current state so the user can verify the action.
