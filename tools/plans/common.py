from PIL import Image, ImageDraw, ImageFont

CAT = {
 "CIRC":  ((30,136,229),  "Circulation - stairs, lifts, lobby, corridor, entrance"),
 "PLANT": ((245,124,0),   "Plant & services - pump, electrical, telecom, gas"),
 "PARK":  ((69,90,100),   "Parking & vehicle circulation"),
 "STORE": ((109,76,65),   "Waste & storage"),
 "AMEN":  ((0,150,136),   "Amenity - pool, gym, changing, WCs"),
}
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def _is_poly(box):
    """A box is either (x1,y1,x2,y2) or a list of (x,y) points."""
    return isinstance(box, (list, tuple)) and len(box) and isinstance(box[0], (list, tuple))

def _pts(box, PAD_T):
    if _is_poly(box):
        return [(x, y + PAD_T) for x, y in box]
    return [(box[0], box[1] + PAD_T), (box[2], box[1] + PAD_T),
            (box[2], box[3] + PAD_T), (box[0], box[3] + PAD_T)]

def _centre(box):
    if _is_poly(box):
        xs = [x for x, _ in box]; ys = [y for _, y in box]
        return (min(xs) + max(xs)) // 2, (min(ys) + max(ys)) // 2
    return (box[0] + box[2]) // 2, (box[1] + box[3]) // 2

def build(src, out, areas, title, sub, note, legend_cats, pad_b=430):
    base = Image.open(src).convert("RGBA"); W,H = base.size
    PAD_T, PAD_B = 130, pad_b
    cv = Image.new("RGBA",(W,H+PAD_T+PAD_B),(255,255,255,255)); cv.paste(base,(0,PAD_T))
    tint = Image.new("RGBA", cv.size, (0,0,0,0)); td = ImageDraw.Draw(tint)
    for ref,cat,box,fs,*_ in areas:
        col = CAT[cat][0]
        td.polygon(_pts(box, PAD_T), fill=col+(46,))
    cv = Image.alpha_composite(cv,tint); d = ImageDraw.Draw(cv)
    for ref,cat,box,fs,*_ in areas:
        col = CAT[cat][0]
        pts = _pts(box, PAD_T)
        d.line(pts + [pts[0]], fill=col+(255,), width=5, joint="curve")
    for ref,cat,box,fs,*rest in areas:
        col = CAT[cat][0]; f = ImageFont.truetype(FB, fs)
        if rest and rest[0]:
            cx, cy0 = rest[0]
        else:
            cx, cy0 = _centre(box)
        cy = cy0 + PAD_T
        bb = d.textbbox((0,0), ref, font=f); w,h = bb[2]-bb[0], bb[3]-bb[1]
        pad = max(7, fs//4)
        d.rounded_rectangle([cx-w//2-pad, cy-h//2-pad, cx+w//2+pad, cy+h//2+pad+4],
                            radius=8, fill=col+(255,), outline=(255,255,255,255), width=3)
        d.text((cx-w//2, cy-h//2-2), ref, font=f, fill=(255,255,255,255))
    f_t = ImageFont.truetype(FB,46); f_s = ImageFont.truetype(FB,26); f_n = ImageFont.truetype(FB,23); f_l = ImageFont.truetype(FB,29)
    d.text((45,28), title, font=f_t, fill=(20,20,20,255))
    d.text((45,84), sub, font=f_s, fill=(90,90,90,255))
    y0 = H+PAD_T+26
    d.text((45,y0), "LEGEND  -  colour = area type,  label = the exact ref used in SnaggingPro",
           font=f_l, fill=(20,20,20,255))
    for i,c in enumerate(legend_cats):
        col,desc = CAT[c]
        cy = y0+54+i*46
        d.rounded_rectangle([45,cy,89,cy+34], radius=8, fill=col+(140,), outline=col+(255,), width=4)
        d.text((104,cy+3), desc, font=f_s, fill=(30,30,30,255))
    import textwrap
    wrapped = []
    for line in note:
        wrapped.extend(textwrap.wrap(line, width=118) or [""])
    for j,line in enumerate(wrapped):
        d.text((45, y0+70+len(legend_cats)*46+j*34), line, font=f_n, fill=(90,90,90,255))
    cv.convert("RGB").save(out, dpi=(150,150)); print("saved", out, len(areas), "areas")
