# Marked-up plan sheets

These scripts draw the colour-coded area overlays onto the architectural
drawings. The output is what the supervisor carries on paper and what the
app shows when a level is opened, so **the refs drawn here and the refs in
`src/building/registry.ts` must always match**.

## Running them

```
pip install pillow
cd tools/plans
python3 gnd.py     # -> GROUND-areas.png
python3 mark3.py   # -> L2-L4-TYPICAL-apartments.png and L1-FIRST-apartments.png
python3 roof.py    # -> ROOF-areas.png
python3 ugplan.py  # -> UG-areas.png
```

Then re-encode for the app (max width 1600, WebP q82):

```
python3 - <<'PY'
from PIL import Image
M = {'UG-areas.png':'UG.webp','GROUND-areas.png':'G.webp','L1-FIRST-apartments.png':'L1.webp',
     'L2-L4-TYPICAL-apartments.png':'TYP.webp','ROOF-areas.png':'R.webp'}
for src,dst in M.items():
    im = Image.open(src).convert('RGB'); w,h = im.size
    if w > 1600: im = im.resize((1600, round(h*1600/w)), Image.LANCZOS)
    im.save(f'../../public/plans/{dst}','WEBP',quality=82,method=6)
PY
```

## Where the base images came from

`base/` holds the rendered drawing sheets the overlays are drawn onto,
produced from the architectural PDF with poppler:

| File | Sheet | Notes |
| --- | --- | --- |
| `gnd150-05.png` | A-102 ground | |
| `plan150-07.png` | A-104 typical | The master. All core coordinates are measured against this one. |
| `plan150L1-06.png` | A-103 first floor | Sits ~6 script units LOWER than the typical sheet — see below. |
| `roof150-08.png` | A-105 roof | |
| `ugplan-wide.png` | A-101 underground | |

Rendered with `pdftoppm -r 150 -png -x .. -y .. -W .. -H ..` against the
architectural PDF. The crop offsets were found by eye and then corrected by
correlating column and row profiles between sheets, because the same plan is
drawn at different positions on different sheets.

## Coordinate system

Coordinates in the scripts are **script units**. `common.py` uses them as
pixels directly; `mark3.py` multiplies by `S = 1.15` first. A box is either
`(x1, y1, x2, y2)` or a list of `(x, y)` points for an L-shape, with an
optional final tuple giving an explicit label anchor — needed on L-shapes,
where the centre of the bounding box often falls outside the area.

## KNOWN PROBLEM — core boxes on the typical sheet are out

Measured 22 Sep against `plan150-07.png` and **not yet corrected**. Every box
in the core column sits too high and is too short, and the error grows down
the sheet (27, then 35, then 55), so it is cumulative rather than a constant
offset:

| Ref | Currently drawn | Measured actual |
| --- | --- | --- |
| STR1 | 780, 640, 900, 900 | 767, 651, 911, 932 |
| ELEC | 529, 900, 651, 955 | 530, 904, 661, 975 |
| STR2 | 525, 930, 660, 1163 | 522, 977, 672, 1261 |
| WM | 800, 905, 872, 975 | 794, 932, 909, 1022 |
| LIFT2 | 800, 988, 895, 1078 | 793, 1023, 909, 1135 |
| LIFT1 | 800, 1084, 895, 1180 | 793, 1139, 909, 1243 |
| TEL | 800, 1198, 872, 1272 | 796, 1245, 911, 1350 |

STR2 is the worst — the real stair enclosure runs down past the D05 door,
about 98 units below where it is currently drawn.

Still to measure the same way: TV, GARB, CH, FF, SHAFT and the lift landings.

**Second half of the problem:** `mark3.py` draws both the typical sheet and
the first floor sheet from one set of coordinates, but the two base renders
are offset from each other by about 6 units in y. Correcting the numbers
against the typical sheet alone will leave L1 slightly out. L1 needs its own
offset, or its base image needs re-rendering to align.
