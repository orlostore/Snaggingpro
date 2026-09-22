from common import build
A = [
 ("UG-TANK", "PLANT", (125, 90, 585, 472), 24),
 ("UG-ACDT", "PLANT", (415, 475, 572, 572), 15),
 ("UG-PUMP", "PLANT", (125, 578, 500, 822), 24),
 ("UG-SUMP", "PLANT", (424, 758, 510, 820), 13),
 ("UG-STR1", "CIRC",  (500, 660, 668, 990), 18),
]
build("ugplan-wide.png", "UG-areas.png", A,
 "UNDERGROUND FLOOR PLAN",
 "Crystal Four - FZ  ·  Plot 6453226  ·  Dwg A-101  ·  Level -1.30",
 ["UG-TANK = U/G water tank, 89 m3 - 47,800 imp gal (10,300 domestic + 37,500 fire), two access manholes.",
  "UG-ACDT = AC DRAIN TANK, 4 m3, own manhole - collects condensate from the whole building.",
  "UG-PUMP = pump room, 645 x 400, transfer pump set duty + standby. Door ST1.",
  "UG-SUMP = sand trap AND sump pit, two adjacent chambers at the stair end of the pump room.",
  "ACCESS IS BY STAIR-1, not Stair-2. The stair comes down into the pump room.",
  "Architectural gives -1.30 here; the water supply set WS-01 says -1.50 (query Q2).",
  "Area boundaries are indicative, for navigation on site - verify against the as-built drawings."],
 ["PLANT", "CIRC"], pad_b=470)
