from common import build
A = [
 # Pool enclosure: the whole 600 x 1150 rectangle is the pool. The kids pool is
 # a walled box in its top-left corner at +20.25, so R-POOL is the L-shaped rest.
 ("R-KPOOL","AMEN",(362,138,458,322),20),
 ("R-POOL","AMEN",[(460,135),(600,135),(600,567),(360,567),(360,325),(460,325)],26,(505,455)),
 # Deck: the lounger column east of the pool PLUS the four loungers below it.
 ("R-DECK","AMEN",[(616,166),(724,166),(724,690),(370,690),(370,600),(616,600)],20,(670,380)),
 # Circulation strip serving the toilets, changing room and shower.
 ("R-COR","CIRC",(765,140,826,559),18),
 ("R-WC1","AMEN",(842,138,938,218),18),
 ("R-WC2","AMEN",(842,222,938,286),18),
 ("R-CHG","AMEN",(842,290,938,350),18),
 ("R-WC3","AMEN",(842,354,938,420),18),
 ("R-WC4","AMEN",(842,424,938,496),18),
 ("R-SHWR","AMEN",(828,500,908,548),16),
 ("R-PPLANT","PLANT",(940,128,1038,334),20),
 # Gym wraps the pump room: beside it at the top, full width below it, down to the store.
 ("R-GYM","AMEN",[(1038,143),(1200,143),(1200,850),(991,850),(991,334),(1038,334)],30,(1100,600)),
 ("R-FLIFT","CIRC",(690,612,752,664),16),
 ("STR1@R","CIRC",(824,572,950,792),18),
 ("R-ELEC","PLANT",(632,742,742,802),18),
 ("STR2@R","CIRC",(632,818,756,1032),18),
 ("LIFT2@R","CIRC",(852,856,952,932),15),
 ("LIFT1@R","CIRC",(852,936,952,1032),15),
 ("R-STORE","STORE",(956,856,1068,1042),20),
 ("R-WATCH","AMEN",(838,1036,1068,1142),20),
 # Condenser banks standing on the open roof slab - positions from AC-05.
 ("R-COND-A","PLANT",(273,749,493,930),22),
 ("R-COND-B","PLANT",(273,1246,438,1493),22),
 ("R-COND-C","PLANT",(685,1274,964,1381),22),
 ("R-COND-D","PLANT",(1133,981,1312,1470),22),
 ("R-PERG","AMEN",(452,1386,1092,1592),28),
]
build("roof150-08.png","ROOF-areas.png",A,
 "ROOF PLAN  -  AREA REFERENCES",
 "Crystal Four - FZ  ·  Plot 6453226, Wadi Al Safa 3  ·  Dwg A-105 + AC-05  ·  Roof / amenity level",
 ["DOORS: every door is snagged with the area it SERVES - a swing arc drawn outside a boundary still belongs to that area.",
  "POOL: the whole 600 x 1150 rectangle is the pool. KIDS POOL (+20.25) is walled off in its top-left corner; R-POOL is the rest at +19.45.",
  "R-COND-A to D are the four APARTMENT CONDENSER BANKS standing on the open roof slab, taken from AC-05 - they are not drawn on the architectural sheet.",
  "Counted off AC-05: A = 12 units  ·  B = 14  ·  C = 10  ·  D = 26  ·  TOTAL 62. All UNTAGGED - nothing says which unit serves which apartment (Q6).",
  "QUERY: 32 apartments at two units each needs 64. The drawing shows 62. Confirm the count on site and whether any apartment shares a unit.",
  "Four more condensing units CU-R1 to CU-R4 serve the gym, electrical room, pool plant and watchman room. They are tagged.",
  "Uncoloured roof slab between the marked areas is snagged as R-WP - waterproofing, screed, falls, parapet, drainage outlets, and every plinth and penetration.",
  "QUERY: AC-05 labels the pool 'FUTURE SWIMMING POOL' while A-105 shows it built with levels. Confirm before inspecting R-POOL / R-KPOOL / R-PPLANT.",
  "QUERY: A-105 and AC-05 SWAP the stair numbers. These refs follow A-105 (architectural): STR1 is the upper-right stair.",
  "Lift machine room sits one level above this plan (Dwg A-106) and is snagged as LM-LMR (shared by both lifts).",
  "Area boundaries are indicative, for navigation on site - verify against the as-built drawings."],
 ["CIRC","PLANT","AMEN","STORE"], pad_b=620)
