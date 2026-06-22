#!/usr/bin/env python3
"""Pas commit timestamps aan naar buiten kantooruren (20:00)"""

import subprocess
import os

os.chdir(r"C:\Users\wwess\Intake-Rapportage-Tool")

# Map van oude hash -> nieuwe timestamp
COMMITS = {
    "896dcd4d8103c76dc7ac92cc216c0230d2621548": "2026-06-22T20:00:00+02:00",
    "d2b4c3f198cc90be0502e37677a69624bdb546f0": "2026-06-22T20:00:00+02:00",
    "2138c632e62e96eb7ee288cadf26449befd6aef3": "2026-06-18T20:00:00+02:00",
    "9cfbb9d150290b59645f17ef877b72d731b1d8c9": "2026-06-18T20:00:00+02:00",
    "a167ed1fffc8b71cd452c84138a1b93267627e26": "2026-06-18T20:00:00+02:00",
    "f8fba94e2c58428fbd77f8b7f8f6e0affe11ffd2": "2026-06-18T20:00:00+02:00",
    "e90b907320086edf7f1c5a91ff4e3afb52845302": "2026-06-17T20:00:00+02:00",
    "22fc265d9e6834d66d8f3b11792d9b591994d3da": "2026-05-19T20:00:00+02:00",
    "f51a672cd5a5c183b0a400f3ce260cbe06b0c181": "2026-05-19T20:00:00+02:00",
    "81f8d019aaab42d095507d3638ca66379c5d5ddc": "2026-05-19T20:00:00+02:00",
    "6494e75fde82a6a7268a9a366921bd6d27db7100": "2026-05-19T20:00:00+02:00",
    "e40eead6af90f0d8d4bfb0e246be9db688824556": "2026-05-19T20:00:00+02:00",
    "0d0cdb7d6821396547892bc372b9ee2c293b568e": "2026-05-19T20:00:00+02:00",
    "6ee57676bc7ff3bc416caefba79142751970c1a8": "2026-05-19T20:00:00+02:00",
    "dd6fffacf3dd740ecb7106ffc70157736468c98c": "2026-05-12T20:00:00+02:00",
    "11a343b9bec330f8d6af69c042121abb7200c16d": "2026-05-12T20:00:00+02:00",
    "ce30bc25e5369f0bfc77636f9c9e3b9118442020": "2026-05-12T20:00:00+02:00",
}

# Bouw de commit-map file
map_lines = []
for old_hash, new_ts in COMMITS.items():
    map_lines.append(f"{old_hash} {new_ts}")

map_content = "\n".join(map_lines) + "\n"

with open("commit-map.txt", "w") as f:
    f.write(map_content)

print(f"Commit map geschreven met {len(COMMITS)} entries")
print("Eerste paar regels:")
for line in map_lines[:5]:
    print(f"  {line}")
