# FeedbackFlow — Ubiquitous Language

Glossary of domain terms. Terms here are canonical — code, UI copy, and docs should use them consistently.

## Widget

- **Widget** — the embeddable feedback capture unit a customer installs on their site via a script snippet. Identified by a widget key.
- **Launcher** — the floating button in a corner of the host page that opens the feedback modal. (Code sometimes calls this the "trigger button.") Every way the Launcher hides and shows — Minimize, Display Mode, hover-peek, Entrance Reveal — is owned by the widget's `LauncherVisibility` module.
- **Widget Config** — the per-widget appearance and behavior settings owned by the dashboard (position, colors, button text, logo, display mode). The dashboard is the single source of truth; installed widgets fetch it at load. Script-tag `data-*` attributes are only a fallback while the fetch is pending or failed.
- **Position** — which corner of the host page the launcher occupies: `bottom-right`, `bottom-left`, `top-right`, `top-left`.
- **Display Mode** — how the launcher presents itself when idle. One of:
  - **Auto-Hide** — the launcher rests mostly off-screen and slides into view when the visitor's cursor nears its corner (hover-peek). On the visitor's first page view of a session it plays an **Entrance Reveal**: fully visible for a moment, then slides away — so visitors learn feedback exists.
  - **Always-Visible** — the launcher is fully visible in its corner at all times. The default when the owner hasn't chosen.
- **Minimize** — a visitor-initiated action that hides the launcher entirely for that visitor on that browser. Distinct from Display Mode, which is set by the site owner.
- **Agent Install Prompt** — a copy-pasteable, agent-agnostic prompt that instructs an AI coding agent (Cursor, Claude Code, etc.) to install the Widget on the customer's site. Embeds the project's real widget key and API URL — never placeholders — and ends at verifying the Launcher renders; it does not submit feedback on the user's behalf.
