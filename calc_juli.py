#!/usr/bin/env python3
"""Bereken juli 2026 normen voor Intake-Rapportage-Tool"""

# Geldzaken.nl juli 2026 (excl. vakantiegeld):
alleen_geldzaken = 1348.49
samen_geldzaken = 1926.40

# Tool januari 2026 (excl. vakantiegeld):
alleen_jan = 1331.42
samen_jan = 1902.09
pens_alleen_jan = 1430.29
pens_paar_jan = 2041.11

# Rijksoverheid (incl. vakantiegeld):
alleen_incl_jan = 1401.50
samen_incl_jan = 2002.13
pens_alleen_incl_jan = 1564.69
pens_paar_incl_jan = 2144.16

alleen_incl_jul = 1419.46
samen_incl_jul = 2027.79
pens_alleen_incl_jul = 1587.34
pens_paar_incl_jul = 2176.10

print("=== VERIFICATIE JANUARI ===")
for label, tool, rijk in [
    ("alleenstaande", alleen_jan, alleen_incl_jan),
    ("samenwonend", samen_jan, samen_incl_jan),
    ("pens_alleen", pens_alleen_jan, pens_alleen_incl_jan),
    ("pens_paar", pens_paar_jan, pens_paar_incl_jan),
]:
    print(f"  {label}: tool={tool}, rijk={rijk}, ratio={tool/rijk:.6f}")

alleen_jul = alleen_geldzaken
samen_jul = samen_geldzaken
pens_alleen_jul = round(pens_alleen_incl_jul * (pens_alleen_jan / pens_alleen_incl_jan), 2)
pens_paar_jul = round(pens_paar_incl_jul * (pens_paar_jan / pens_paar_incl_jan), 2)
pens_gemengd_jul = samen_jul

print()
print("=== JULI 2026 NORMEN (excl. vakantiegeld) ===")
print(f"  alleenstaand:        {alleen_jul}")
print(f"  alleenstaande_ouder: {alleen_jul}")
print(f"  samenwonend:         {samen_jul}")
print(f"  pensioen_alleen:     {pens_alleen_jul}")
print(f"  pensioen_paar:       {pens_paar_jul}")
print(f"  pensioen_gemengd:    {pens_gemengd_jul}")
print()

print("=== INKOMENSGRENZEN JULI 2026 ===")
for label, norm in [("alleenstaande", alleen_jul), ("samenwonend", samen_jul)]:
    iit = round(norm * 1.05, 2)
    fdma = round(norm * 1.10, 2)
    bb = round(norm * 1.20, 2)
    print(f"  {label}:")
    print(f"    105% (IIT):  €{iit}")
    print(f"    110% (FDMA): €{fdma}")
    print(f"    120% (BB):   €{bb}")
