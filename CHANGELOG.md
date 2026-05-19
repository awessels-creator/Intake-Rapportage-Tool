# Changelog

## [2.0.14]

### Changed
- Uitgevinkte adviezen op tabblad 10 worden nu bewaard bij navigatie — de `goTo(9)` merge-logica bewaard `on`-status bij rebuild van systeemadviezen.
- Custom actiepunten hebben nu een bewerkbare titelrij in plaats van de vaste "Eigen actiepunt" tekst; de initiële titel is leeg met een placeholder.

## [2.0.13]

### Added
- Rapport sectie 11 "Samenvatting Financiële Situatie" toegevoegd met inkomen, lasten, besteedbaar (rood/groen) en schulden.
- Rapport sectie 12 "Aanvraag Type Dienstverlening" als aparte tabel met alleen aangevinkte diensten.
- Secties hernummerd: oud 11 (Adviezen) → 13, oud 12 (Conclusie) → 14.

### Changed
- Aanvraag voor dienstverlening verwijderd uit sectie 3 (Aanvraag & Crisis); leeft nu exclusief in sectie 12.

## [2.0.12]

### Added
- Weekinkomen-invoer op tabblad 5 (Inkomen): per inkomstenbron selecteerbaar of invoer per maand of per week.
- Checkbox "incl. 8% vakantiegeld" bij weekinkomen — berekening naar maandbedrag excl. vakantiegeld is automatisch.
- Live berekend maandbedrag getoond naast het weekbedrag.

### Changed
- `InkomenItem` uitgebreid met `invoerPer`, `inclVak`, `weekBedrag`.

## [2.0.11]

### Changed
- `getTotaalInkomen()` telt nu toeslagen op bij het inkomen (excl. kinderbijslag, die per kwartaal betaald wordt).
- Besteedbaar inkomen op tabblad 7 en in het rapport is nu correct inclusief huurtoeslag, zorgtoeslag, WKB, KOT en overige inkomsten.

## [2.0.10]

### Added
- "Overige inkomsten" toeslag toegevoegd aan tabblad 6, met vrij in te vullen naam/omschrijving.

### Removed
- "Bijzondere bijstand" en "AIO" verwijderd uit de toeslagenlijst.

### Changed
- Beslag-checkbox bij kinderbijslag verwijderd (kwartaalbedrag, buiten beschouwing voor beslag).
- `toeslagenNaam` veld toegevoegd aan `FormState` voor de naam bij Overige inkomsten.

## [2.0.9]

### Added
- "Wanbetalersregeling (CAK)" toggle op tabblad 4 (Vermogen), naast de aanvullende zorgverzekering.
- Waarschuwing getoond als wanbetalersregeling actief is.
- Toelichting op vermogen verschijnt nu ook in het rapport (sectie 6).

### Changed
- Label "Zorgverzekering (aanvullend)" gesplitst in twee aparte velden: "Aanvullende zorgverzekering" en "Wanbetalersregeling (CAK)".
- Label "Toelichting vermogen" gewijzigd naar "Toelichting op vermogen en verzekeringen".
- `tw_wanbet` toegevoegd aan `FormState`.

## [2.0.8]

### Added
- Toelichting-textarea "Toelichting bankrekening(en)" onderaan de bankkaart op tabblad 3.
- Toelichting verschijnt in het rapport (sectie 4).

### Removed
- "Bank"-kolom verwijderd uit de bankrekeningen-tabel.
- Inline "Afspraken / opmerking"-kolom per rekening verwijderd.

### Changed
- `bank` veld verwijderd uit `BankItem`; `bank_toelichting: string` toegevoegd aan `FormState`.

## [2.0.7]

### Changed
- "Reden aanmelding / hulpvraag" is verplaatst naar een eigen Card "Reden aanmelding", los van "Crisis & Urgentie".
- Aanvraag voor dienstverlening in rapport (sectie 3) is nu vetgedrukt weergegeven.

## [2.0.6]

### Changed
- Rapport sectie 1 (Cliëntgegevens) toont nu een leesbare 2-kolomstabel (label | waarde) in plaats van een 4-kolomsraster.
- Persoonsgegevens en contactgegevens zijn visueel gescheiden door een lege rij.
- Cliëntnummer is toegevoegd als eerste rij.

## [2.0.5]

### Changed
- Rapport CSS: `h2 margin-top` verkleind van 15px naar 8px; `p margin` beperkt tot 2px; `line-height` verlaagd.
- Minder lege ruimte tussen secties in het gedownloade Word-rapport.

## [2.0.4]

### Changed
- Bijstandsnormen gecorrigeerd naar excl. vakantietoeslag (jan 2026): alleenstaand €1.331,42, samenwonend €1.902,09, etc.
- Referentietabel op tabblad 5 en de auto-ingevuld hint tonen nu de excl.-waarden.
- `NORM_PERIODES` structuur toegevoegd voor toekomstige halfjaarlijkse normwijzigingen — de tool selecteert automatisch de geldige normen op basis van de huidige datum.

## [2.0.3]

### Changed
- Label "Levensonderhoud (NIBUD-richtlijn)" gewijzigd naar "Kosten levensonderhoud/huishoudgeld" in de lastentabel (tabblad 7 en rapport).
- NIBUD-richtlijn is nog steeds zichtbaar via het placeholder-tekstveld in de opmerkingskolom.

## [2.0.2]

### Added
- Added "Totaal inkomen (incl. toeslagen)" row on tabblad 7 (Vaste Lasten), displayed above the total expenses row.
- Added a visual divider line between "Totaal vaste lasten" and "Besteedbaar inkomen" to clarify the three-step calculation layout.
- Added the income row to the Word report download, so the lasten table now shows inkomen → lasten → besteedbaar.

### Changed
- "Totaal vaste lasten / maand" row now sits below the inkomen row, maintaining the logical order: inkomen − lasten = besteedbaar.

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
