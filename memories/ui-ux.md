# UI / UX Standards

> Look, feel and interaction rules. Keep it concrete.

## Design language
- (colors, type, spacing, theme)

## Components / patterns
- (reusable patterns, what to avoid)
- Install guidance is one button, not a steps list. The manifest carries
  `interface.docsUrl` and the desktop renders "How to install", which opens the
  vendor's own page in the system browser. Never author setup prose for a
  third-party server here — not in the manifest, not in a plugin README, not in
  a `userVars` description (that says where a value comes from, never what to
  type to produce it).

## Accessibility & states
- (loading, empty, error, focus, contrast)
