from PIL import Image, ImageDraw, ImageFont
S = 1.15
def sc(p): return [(round(x*S), round(y*S)) for x, y in p]

# west-upper / east-upper / west-lower / east-lower now step out to enclose
# the guest WC + W/M strip AND the entrance door. Mirror axis x=715.
UNITS = [
 ("01","North-West",[(45,55),(705,55),(705,565),(505,565),(505,400),(45,400)],(229,57,53),(300,225)),
 ("02","North-East",[(725,55),(1385,55),(1385,400),(925,400),(925,565),(725,565)],(30,136,229),(1130,225)),
 ("03","East-Upper",[(925,400),(1385,400),(1385,960),(913,960),(913,655),(815,655),(815,575),(925,575)],(67,160,71),(1170,620)),
 ("04","East-Lower",[(913,960),(1385,960),(1385,1510),(925,1510),(925,1420),(840,1420),(840,1335),(913,1335)],(251,140,0),(1170,1180)),
 ("05","South-East",[(725,1420),(925,1420),(925,1510),(1385,1510),(1385,1880),(725,1880)],(142,36,170),(1060,1700)),
 ("06","South-West",[(45,1510),(505,1510),(505,1420),(705,1420),(705,1880),(45,1880)],(0,151,167),(370,1700)),
 ("07","West-Lower",[(45,960),(505,960),(505,1150),(525,1150),(525,1335),(590,1335),(590,1420),(505,1420),(505,1510),(45,1510)],(194,24,91),(240,1180)),
 ("08","West-Upper",[(45,400),(505,400),(505,570),(600,570),(600,790),(520,790),(520,960),(45,960)],(109,76,65),(240,620)),
]
CORE = (84,110,122)

def _poly(b):
    return isinstance(b, (list, tuple)) and len(b) and isinstance(b[0], (list, tuple))

def _cpts(b, S, PT):
    if _poly(b):
        return [(round(x*S), round(y*S)+PT) for x, y in b]
    return [(round(b[0]*S), round(b[1]*S)+PT), (round(b[2]*S), round(b[1]*S)+PT),
            (round(b[2]*S), round(b[3]*S)+PT), (round(b[0]*S), round(b[3]*S)+PT)]

def _ccentre(b):
    if _poly(b):
        xs=[x for x,_ in b]; ys=[y for _,y in b]
        return (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    return (b[0]+b[2])/2, (b[1]+b[3])/2
CORE_AREAS = [   # ref-suffix, (x1,y1,x2,y2), font
 ("TV",   (593,655,665,717), 16),
 ("GARB", (593,747,665,838), 16),
 ("CH",   (534,796,578,838), 11),
 ("FF",   (646,850,668,897), 12),
 ("ELEC", (529,900,651,955), 15),
 ("STR2", (525,930,660,1163), 17),
 ("COR",  [(524,568),(851,568),(851,640),(795,640),(795,1336),(851,1336),(851,1407),
           (524,1407),(524,1336),(669,1336),(669,640),(524,640)], 15, (732,1010)),
 ("STR1", (780,640,900,900), 17),
 ("WM",   (800,905,872,975), 13),
 ("LIFT2",(800,988,895,1078), 13),
 ("LIFT1",(800,1084,895,1180), 13),
 ("TEL",  (800,1198,872,1272), 13),
]
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
f_lbl, f_ttl, f_sub = (ImageFont.truetype(FB, s) for s in (58, 46, 26))
f_leg = ImageFont.truetype(FB, 29)

def build(src, out, pre, title, sub):
    base = Image.open(src).convert("RGBA"); W,H = base.size
    PT, PB = 130, 430
    cv = Image.new("RGBA",(W,H+PT+PB),(255,255,255,255)); cv.paste(base,(0,PT))
    tn = Image.new("RGBA", cv.size,(0,0,0,0)); td = ImageDraw.Draw(tn)
    for _,_,p,c,_ in UNITS: td.polygon([(x,y+PT) for x,y in sc(p)], fill=c+(48,))
    for e in CORE_AREAS:
        td.polygon(_cpts(e[1], S, PT), fill=CORE+(42,))
    cv = Image.alpha_composite(cv,tn); d = ImageDraw.Draw(cv)
    for e in CORE_AREAS:
        pts = _cpts(e[1], S, PT)
        d.line(pts+[pts[0]], fill=CORE+(255,), width=4, joint="curve")
    for _,_,p,c,_ in UNITS:
        pts=[(x,y+PT) for x,y in sc(p)]; d.line(pts+[pts[0]], fill=c+(255,), width=9, joint="curve")
    for e in CORE_AREAS:
        sfx, b, fs = e[0], e[1], e[2]
        ref = f"{pre}-{sfx}"; f = ImageFont.truetype(FB, fs)
        ax, ay = e[3] if len(e) > 3 and e[3] else _ccentre(b)
        cx=round(ax*S); cy=round(ay*S)+PT
        bb=d.textbbox((0,0),ref,font=f); w,h=bb[2]-bb[0],bb[3]-bb[1]
        d.rounded_rectangle([cx-w//2-6,cy-h//2-6,cx+w//2+6,cy+h//2+8],radius=6,
                            fill=CORE+(255,),outline=(255,255,255,255),width=2)
        d.text((cx-w//2,cy-h//2-1),ref,font=f,fill=(255,255,255,255))
    for sfx,_,p,c,lab in UNITS:
        ref=pre+sfx; cx,cy=round(lab[0]*S),round(lab[1]*S)+PT
        bb=d.textbbox((0,0),ref,font=f_lbl); w,h=bb[2]-bb[0],bb[3]-bb[1]
        d.rounded_rectangle([cx-w//2-26,cy-h//2-20,cx+w//2+26,cy+h//2+22],radius=16,
                            fill=c+(255,),outline=(255,255,255,255),width=5)
        d.text((cx-w//2,cy-h//2-6),ref,font=f_lbl,fill=(255,255,255,255))
    d.text((45,28),title,font=f_ttl,fill=(20,20,20,255))
    d.text((45,84),sub,font=f_sub,fill=(90,90,90,255))
    y0=H+PT+26
    d.text((45,y0),"LEGEND  -  8 apartments clockwise from north-west; slate = shared core areas",font=f_leg,fill=(20,20,20,255))
    for i,(sfx,pos,_,c,_) in enumerate(UNITS):
        cx,cy=45+(i%4)*400, y0+54+(i//4)*56
        d.rounded_rectangle([cx,cy,cx+44,cy+36],radius=8,fill=c+(140,),outline=c+(255,),width=4)
        d.text((cx+58,cy+2),f"{pre+sfx}   {pos}",font=f_leg,fill=(30,30,30,255))
    notes=[
     "Every unit: 2 bedrooms · 2 bathrooms · 1 guest WC · laundry alcove · kitchen · family hall · 1-2 balconies",
     "Core: COR corridor · STR1/STR2 stairs · LIFT1/LIFT2 landings · ELEC · WM water meter · TEL · TV · GARB garbage · CH chute · FF fire recess",
     "DOORS: snagged with the area they SERVE. Three service doors (TV, GARB, ELEC) open off each corridor.",
     "REV C: the CORRIDOR is now marked in full - the wide band at the top serving doors 5-8, the strip past the stair and lifts, and the band at the bottom serving doors 1-4.",
    ]
    for j,l in enumerate(notes):
        d.text((45,y0+178+j*38),l,font=f_sub,fill=(90,90,90,255))
    cv.convert("RGB").save(out,dpi=(150,150)); print("saved",out)

build("plan150-07.png","L2-L4-TYPICAL-apartments.png","2",
 "TYPICAL FLOOR PLAN  -  AREA REFERENCES",
 "Crystal Four - FZ  ·  Plot 6453226, Wadi Al Safa 3  ·  Dwg A-104  ·  Levels 2, 3 & 4 (repeat as 2xx / 3xx / 4xx)")
build("plan150L1-06.png","L1-FIRST-apartments.png","1",
 "FIRST FLOOR PLAN  -  AREA REFERENCES",
 "Crystal Four - FZ  ·  Plot 6453226, Wadi Al Safa 3  ·  Dwg A-103  ·  Level 1")
