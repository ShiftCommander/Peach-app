# Release v52.1.0

- Restore PWA install and update flow (merged from `codex/pwa-install-update`).
- Added installability, installed-app detection, explicit service-worker update activation, and Android launch action.
- Tests: all backend and PWA-related tests pass locally.

See commit history for details.

## v52.1.3

- Consolidated the chromatic wheel onto one rotation source shared by the wheel, its notes, textures and lens view.
- Removed duplicate JavaScript and CSS smoothing paths that could make the lens lag behind the main wheel.
- Rollback reference if CSS rotation smoothing needs to be compared again: `transition: transform 138ms cubic-bezier(0.22, 0.76, 0.26, 1), opacity 160ms ease, filter 160ms ease;`.
