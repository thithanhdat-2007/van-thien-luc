# Review and ownership workflow

Read the repository-root `AGENTS.md` and `AI_HANDOFF_GUIDE.md` before material work.

Antigravity defaults to review-only work. Inspect the current running build and report reproducible findings; do not edit code unless the user explicitly transfers implementation ownership. Never edit a file concurrently with Codex.

An ownership handoff is a strict role swap. The prior implementation owner stops editing and becomes read-only before the new owner starts. Never let one AI occupy both implementation and independent-review roles for the same change.

For visual review, cover at least one desktop and one mobile viewport, exercise the affected interaction path, and separate confirmed defects from optional polish. Do not treat screenshots, README claims, or roadmap text as proof of current behavior.

