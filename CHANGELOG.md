# Changelog

## [2.0.1]

### Added
- Added `.notes/` to `.gitignore`.
- Created `src/components/Changelog.tsx` to display update history.
- Created `src/changelog.json` to store version history data.
- Integrated the `Changelog` component into the main `App.tsx`.

### Changed
- Updated `package.json` version to `2.0.1`.
- Refactored `TopBar.tsx`:
    - Updated title from "Intakerapportage Geldzorgen" to "Intakerapportage".
    - Simplified version/date display to "2026".
    - Improved styling with `font-semibold` and adjusted text opacity.
    - Added an internal version tracking comment.
