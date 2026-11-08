# VẤN THIÊN LỤC — Development Rules

These instructions apply to every file and every AI-assisted change in this repository.

## Project boundaries

- Treat `index.html`, `css/`, and `js/` as the current application source. Treat `graphify-out/` as generated analysis output.
- Inspect the current implementation before changing behavior. Preserve unrelated user changes.
- Keep the existing static HTML5/Vite architecture unless the user explicitly approves a framework or build-system migration.
- Keep gameplay definitions and initial state in `js/data.js`; rendering and interaction code must consume those definitions instead of creating conflicting copies.
- Do not invent a gameplay requirement, formula, drop rate, progression value, asset license, or completed feature. When design intent is unclear, preserve current behavior and report the uncertainty.
- Never describe a documented roadmap item as implemented unless it is verified in the running application.

## Codex, Antigravity, and Graphify workflow

- Use Graphify first for architecture, dependency, call-path, and change-impact questions when `graphify-out/graph.json` exists. Prefer focused `graphify query`, `graphify explain`, or `graphify path` requests over broad source scans.
- Use Codex as the primary implementation agent: inspect the affected scope, make the smallest safe change, run relevant checks, and report exact files changed and remaining uncertainty.
- Use Antigravity primarily for visual inspection, responsive testing, UX review, and independent review. Unless explicitly assigned implementation ownership, it must inspect and report without editing code.
- Never let Codex and Antigravity edit the same file concurrently. Transfer ownership explicitly before another agent edits that file.
- A handoff is a role swap, not duplicated work. At any moment exactly one AI is the implementation owner; the previous owner must stop implementation before the next owner starts.
- After handing off implementation, the previous owner becomes read-only and may only review or report. It must not apply fixes unless ownership is explicitly transferred back.
- The implementation owner must not simultaneously act as the independent reviewer of its own change. Review findings return to the active implementation owner, or ownership is explicitly swapped before edits continue.
- Use only one Codex implementation session at a time: Codex Desktop or Codex terminal inside Antigravity. Any second session remains read-only until ownership is transferred.
- After material changes, run `npm run build`. For visual changes, also test the affected path at representative desktop and mobile widths.
- Keep Graphify current with `graphify update .` after material structural changes. Do not start a second full build while `graphify watch .` is active.
- Follow `AI_HANDOFF_GUIDE.md` whenever implementation ownership moves between Codex and Antigravity/Gemini.

## Implementation quality

- Prefer focused edits over rewrites. Preserve keyboard access, touch usability, responsive layout, animation performance, and reduced-motion behavior.
- Avoid leaking timers, animation frames, audio contexts, canvas loops, or event listeners when views change or restart.
- Treat save data and `localStorage` migrations as compatibility-sensitive. Preserve existing player progress when changing state shape.
- Do not add dependencies, remote services, analytics, credentials, or network calls without explicit approval.
- For audio and animation, respect browser autoplay policies and keep a usable fallback when effects are unavailable.

## Standard commands

```powershell
npm install
npm run dev
npm run build
npm run preview
graphify query "<focused question>"
graphify explain "<symbol-or-file>"
graphify path "<source>" "<target>"
graphify update .
```

