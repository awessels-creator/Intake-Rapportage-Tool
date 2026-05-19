# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Intake tool for debt counselling consultants at Gemeente Meppel (*Geldzorgen Schuldhulpverlening*). Consultants fill in a 10-page wizard and download a `.doc` report. All data stays in the browser — no backend, no storage.

## Commands

```bash
npm run dev          # start Vite dev server (localhost)
npm run dev:host     # expose on local network
npm run build        # tsc + vite build → dist/
npm run lint         # ESLint
npm run preview      # preview the dist/ build
```

There are no tests.

## Architecture

**Stack:** React 19 + TypeScript + Tailwind CSS v4 + Vite 8. React Compiler (`babel-plugin-react-compiler`) is enabled.

**State:** A single `FormState` object (defined in `src/types.ts`) holds all form data. It lives in `FormProvider` (`src/context.tsx`) and is accessed everywhere via `useForm()`. The only derived state is `advItems` on page 9, rebuilt from scratch by `buildSystemAdvItems()` each time the user navigates to that page (`goTo(9)` in context).

**Pages:** Ten page components under `src/components/pages/` (Page0–Page9). `App.tsx` renders whichever page `state.currentPage` points to. Navigation is done by calling `goTo(n)` from `NavRow`.

**Constants (`src/constants.ts`):** Financial norms (bijstand, vermogensgrenzen, BVV-maxima, NIBUD), the fixed expenses table (`LASTEN_DEF`), debt type metadata (`SCHULD_INFO`), and toeslag names. These are calibrated to **January 2026** — update here when yearly norms change.

**Utils (`src/utils.ts`):** Pure calculation helpers: `getTotaalInkomen`, `getTotaalLasten`, `getMndBedrag` (period normalisation), `getPct` (income vs. norm %), `buildSystemAdvItems` (rule-based advice generation), `mkInitial` (blank form state).

**Report generation (`src/download.ts`):** `downloadWord()` takes a `FormState` snapshot and renders a self-contained HTML string styled to look like a Word document, then triggers a `.doc` download via a Blob URL. All report formatting logic lives here.

**Shared components (`src/components/shared/`):** `EuroInput`, `RadioGroup`, `ToggleWidget`, `Alert`, `Card`, `NavRow` — reusable primitives used across pages.

## Dutch domain terms

All field names and UI text are in Dutch. Key abbreviations: BSN = citizen service number, IIT = Individuele Inkomenstoeslag, FDMA = Fonds Deelname Maatschappelijke Activiteiten, GBLT = water board tax, BVV = beslagvrije voet (protected income floor), KOT = kinderopvangtoeslag, WKB = kindgebonden budget.
