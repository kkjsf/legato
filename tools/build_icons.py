"""Icones de Legato : trois notes qui montent (or) liees par une liaison (violet), sans portee.
Usage : python tools/build_icons.py (depuis le dossier legato/)."""
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'icons'
BG, GOLD, VIOLET = '#0b0d0f', '#c9a84c', '#9384bd'
HEADS = [(150, 372), (258, 316), (366, 246)]   # centres des tetes, en repere 512
RX, RY, ROT = 47, 33, -22                       # tete de noire inclinee
STEM_W, STEM_H = 21, 200


def ellipse_pts(cx, cy, n=72):
    a = math.radians(ROT)
    return [(cx + RX * math.cos(t) * math.cos(a) - RY * math.sin(t) * math.sin(a),
             cy + RX * math.cos(t) * math.sin(a) + RY * math.sin(t) * math.cos(a))
            for t in (2 * math.pi * i / n for i in range(n))]


def stem(cx, cy):
    x = cx + RX * math.cos(math.radians(ROT)) - 4   # hampe collee au bord droit de la tete
    return (x - STEM_W, cy - STEM_H, x, cy - 6)


def bez(p0, p1, p2, p3, n=48):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


# liaison : un croissant sous les notes, epais au milieu, effile aux bouts
SLUR_OUT = ((104, 404), (184, 496), (344, 484), (414, 304))
SLUR_IN = ((414, 304), (334, 432), (194, 448), (104, 404))


def draw(size, safe):
    big = size * 4
    img = Image.new('RGB', (big, big), BG)
    d = ImageDraw.Draw(img)
    pad = 64 if safe else 0
    k = lambda p: tuple(((v - 256) * (512 - 2 * pad) / 512 + 256) * big / 512 for v in p)
    d.polygon([k(p) for p in bez(*SLUR_OUT) + bez(*SLUR_IN)], fill=VIOLET)
    for cx, cy in HEADS:
        d.polygon([k(p) for p in ellipse_pts(cx, cy)], fill=GOLD)
        x0, y0, x1, y1 = stem(cx, cy)
        a, b = k((x0, y0)), k((x1, y1))
        d.rounded_rectangle([a, b], radius=(b[0] - a[0]) / 2, fill=GOLD)
    return img.resize((size, size), Image.LANCZOS)


def svg():
    f = lambda pts: ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    o, i = SLUR_OUT, SLUR_IN
    slur = (f'M{o[0][0]} {o[0][1]} C{o[1][0]} {o[1][1]} {o[2][0]} {o[2][1]} {o[3][0]} {o[3][1]} '
            f'C{i[1][0]} {i[1][1]} {i[2][0]} {i[2][1]} {i[3][0]} {i[3][1]}Z')
    notes = ''
    for cx, cy in HEADS:
        x0, y0, x1, y1 = stem(cx, cy)
        notes += (f'<ellipse cx="{cx}" cy="{cy}" rx="{RX}" ry="{RY}" transform="rotate({ROT} {cx} {cy})" fill="{GOLD}"/>\n'
                  f'<rect x="{x0:.1f}" y="{y0}" width="{STEM_W}" height="{y1 - y0}" rx="{STEM_W / 2}" fill="{GOLD}"/>\n')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n<rect width="512" height="512" rx="96" fill="{BG}"/>\n'
            f'<path d="{slur}" fill="{VIOLET}"/>\n{notes}</svg>\n')


OUT.mkdir(exist_ok=True)
draw(512, False).save(OUT / 'icon-512.png')
draw(192, False).save(OUT / 'icon-192.png')
draw(512, True).save(OUT / 'icon-maskable-512.png')
(OUT / 'icon.svg').write_text(svg(), encoding='utf-8')
print('icones ecrites dans', OUT)
