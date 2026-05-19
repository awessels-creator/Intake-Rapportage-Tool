# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Complete migration to **React 18** with **Vite** and **TypeScript**.
- Styling overhaul using **Tailwind CSS**.
- Implemented modular intake pages:
  - `Page0Client`: Client information and initial selection.
  - `Page1Persoonlijk`: Personal details.
  - `Page2Crisis`: Crisis assessment.
  - `Page3Vermogen`: Assets and property details.
  - `Page4Inkomen`: Income sources and calculations.
  - `Page5Toeslagen`: Allowances and benefits.
  - `Page6Lasten`: Fixed costs and expenses.
  - `Page7Schulden`: Debts and liabilities.
  - `Page8Regelcheck`: Regulatory compliance checks.
  - `Page9Advies`: Final advice generation.
- Shared UI components: `Alert`, `Card`, `EuroInput`, `NavRow`, `RadioGroup`, `ToggleWidget`, `ProgressBar`, `TopBar`.
- Robust state management using React Context.
- PDF/JSON download functionality for intake results.
- Comprehensive test suite using **Vitest** and **React Testing Library**.
- ESLint and TypeScript configurations for code quality.

### Changed
- Replaced monolithic `index.html` with a modern component-based architecture.
- Updated `.gitignore` for Node.js and Vite environments.

## [2026-05-12]

### Added
- Dutch README with project details and disclaimer.
- Initial project structure: Intake-tool and License.
- Planning phase for Vite/React migration.
