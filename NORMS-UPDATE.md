# Halfjaarlijkse norm-update — Intake-Rapportage-Tool

Deze gids is voor de volgende beheerder (of AI-assistent) die de financiële
normen moet bijwerken als de bedragen wijzigen. Normen veranderen in Nederland
tweedemaal per jaar: **per 1 januari** en **per 1 juli**.

---

## 1. Waar zitten de normen?

Alle normen staan op ÉÉN plek:

```
src/constants.ts  →  const NORM_PERIODES: NormPeriode[]
```

Dit is de enige bron van waarheid. Nergens anders in de code staan
hardgecodeerde bedragen voor bijstand, vermogen, NIBUD of beslagvrije voet.
De tool kiest automatisch de periode die op de huidige datum van kracht is.

---

## 2. Waar haal je de nieuwe bedragen vandaan?

De bedragen komen uit officiële overheidsbronnen. Controleer vóór elke update:

| Norm | Bron |
|------|------|
| Bijstandsnormen (netto, excl. vakantietoeslag) | **Staatscourant** via overheid.nl — zoek op "wijziging bijstandsnormen [jaar]". Of de website van het Ministerie van Sociale Zaken (SZW). |
| Vrijstellingsgrenzen vermogen (Participatiewet) | Gemeente-beleidsregels (gemeente Meppel) — vaak gekoppeld aan de landelijke bijstandsgrenzen. |
| Vrijstelling overwaarde eigen woning | Gemeente-beleidsregels (Participatiewet, art. 34). |
| NIBUD besteedbaar budget | NIBUD.nl — "besteedbaar budget" per huishoudtype. |
| Beslagvrije voet (wettelijk maximum) | uwbeslagvrijevoet.nl (overheid) en de wet- en regelgeving rond beslagvrije voet. |

Let op: de bedragen in `NORM_PERIODES` zijn **netto per maand, exclusief
vakantietoeslag** voor de bijstandsnormen. De vakantietoeslag (5%) telt de tool
zelf niet mee in de maandbedragen.

---

## 3. Hoe pas je het aan? (stap voor stap)

Je voegt ÉÉN nieuw object toe aan `NORM_PERIODES`. Je wijzigt verder niets.

```ts
const NORM_PERIODES: NormPeriode[] = [
  // ... bestaande periodes ...

  {
    vanaf: '2027-01-01',          // ingangsdatum (YYYY-MM-DD)
    model: '2027-1',              // unieke model-code: "JAAR-1" (1e helft) of "JAAR-2" (2e helft)
    label: '1e helft 2027 (per 1 jan 2027)',
    bijstand: {
      alleenstaand: 0,            // <- invullen uit Staatscourant
      alleenstaande_ouder: 0,
      samenwonend: 0,
      pensioen_alleen: 0,
      pensioen_paar: 0,
      pensioen_gemengd: 0,
    },
    vermogen: {
      alleenstaand: 0,
      alleenstaande_ouder: 16000, // meestal gelijk aan samenwonend
      samenwonend: 16000,
      pensioen_alleen: 0,
      pensioen_paar: 16000,
      pensioen_gemengd: 16000,
    },
    vrijstellingOverwaarde: 67500, // controleer gemeente-beleid
    nibud: {
      // besteedbaar budget per type — uit NIBUD
    },
    bvvMax: {
      // wettelijk maximum beslagvrije voet — uit uwbeslagvrijevoet.nl
    },
  },
]
```

Belangrijk:
- De `vanaf`-datum bepaalt wanneer de nieuwe set actief wordt. Zodra de
  systeemdatum `>= vanaf` is, kiest de tool die periode automatisch.
- Geen overlap nodig: de nieuwe periode vervangt de oude zodra `vanaf` bereikt is.
- De `model`-code (bv. "2027-1") identificeert eenduidig welke normenset actief
  is. Die code verschijnt in de TopBar, het rapport en de download-bestandsnaam,
  zodat je altijd ziet welke normen zijn gebruikt.

---

## 4. Controleren na de wijziging

1. `npm run build` — moet zonder fouten lukken.
2. `npm test` — alle tests groen.
3. Open de tool (lokaal: `npm run dev`) en check de TopBar: de model-code bij de
   huidige datum moet kloppen.
4. Voor een toekomstige periode: gebruik de **Model Preview** (knop rechtsboven
   in de tool, component `ModelPreviewSwitch.tsx`). Kies de nieuwe model-code om
   te zien hoe tabellen/rapport eruitzien vóór de ingangsdatum. `clearNormPreview()`
   zet de live datum weer terug.
5. Deploy: push naar `juli-2026` (productie) of `dev` (test). De GitHub Actions
   workflow in `.github/workflows/deploy.yml` bouwt en publiceert automatisch
   naar GitHub Pages.

---

## 5. Veelgemaakte fouten

- Bedragen als **strings** invullen i.p.v. getallen → TypeScript geeft een fout,
  maar gebruik altijd `number`.
- De `vanaf`-datum in verkeerd formaat → moet `YYYY-MM-DD` zijn.
- Een bestaande periode wijzigen i.p.v. een nieuwe toevoegen → doe dit NIET;
  voeg altijd een nieuwe periode toe zodat historische rapporten hun eigen
  normen behouden.
- De vakantietoeslag (5%) meerekenen in de bijstandsbedragen → de tool werkt met
  netto maandbedragen exclusief vakantietoeslag.

---

## 6. Overzicht bestanden

| Bestand | Inhoud |
|---------|--------|
| `src/constants.ts` | `NORM_PERIODES` (alle normen) + `getNormPeriode()`, `NORMPERIODE`, `MODEL` |
| `src/types.ts` | `NormPeriode` interface (velden die je invult) |
| `src/components/ModelPreviewSwitch.tsx` | UI om toekomstige normen te previewen |
| `.github/workflows/deploy.yml` | Deploy naar GitHub Pages bij push naar `juli-2026`/`dev` |
