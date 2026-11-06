"""Icones de Legato : trois touches ivoire, une note qui tombe sur la touche du milieu, chiffre 1.
Usage : python tools/build_icons.py (depuis le dossier legato/)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / 'icons'
BG, IVORY, EBONY, AMBER, INK = (18, 22, 33), (242, 235, 220), (11, 13, 18), (240, 165, 62), (16, 19, 26)


def draw(size, safe):
    img = Image.new('RGB', (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size / 512
    pad = 0 if not safe else 64
    k = lambda v: v * s * (512 - 2 * pad) / 512 + pad * s
    kw, top, bot = 116, 300, 456
    for i in range(3):
        x = 82 + i * (kw + 6)
        d.rounded_rectangle([k(x), k(top), k(x + kw), k(bot)], radius=12 * s, fill=AMBER if i == 1 else IVORY)
    for i in (1, 2):
        x = 82 + i * (kw + 6) - 38
        d.rounded_rectangle([k(x), k(top - 2), k(x + 70), k(top + 96)], radius=6 * s, fill=EBONY)
    nx = 82 + kw + 6 + 22
    d.rounded_rectangle([k(nx), k(70), k(nx + 72), k(276)], radius=16 * s, fill=AMBER)
    r = 30
    cx, cy = nx + 36, 236
    d.ellipse([k(cx - r), k(cy - r), k(cx + r), k(cy + r)], fill=(0, 0, 0, 0), outline=None)
    d.ellipse([k(cx - r), k(cy - r), k(cx + r), k(cy + r)], fill=(150, 98, 30))
    try:
        font = ImageFont.truetype('arialbd.ttf', int(44 * s * (512 - 2 * pad) / 512))
    except OSError:
        font = ImageFont.load_default()
    d.text((k(cx), k(cy + 1)), '1', fill=(255, 255, 255), font=font, anchor='mm')
    return img


OUT.mkdir(exist_ok=True)
draw(512, False).save(OUT / 'icon-512.png')
draw(512, False).resize((192, 192), Image.LANCZOS).save(OUT / 'icon-192.png')
draw(512, True).save(OUT / 'icon-maskable-512.png')
(OUT / 'icon.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#121621"/>
<rect x="82" y="300" width="116" height="156" rx="12" fill="#f2ebdc"/>
<rect x="204" y="300" width="116" height="156" rx="12" fill="#f0a53e"/>
<rect x="326" y="300" width="116" height="156" rx="12" fill="#f2ebdc"/>
<rect x="166" y="298" width="70" height="98" rx="6" fill="#0b0d12"/>
<rect x="288" y="298" width="70" height="98" rx="6" fill="#0b0d12"/>
<rect x="226" y="70" width="72" height="206" rx="16" fill="#f0a53e"/>
<circle cx="262" cy="236" r="30" fill="#96621e"/>
<text x="262" y="252" font-family="Arial,sans-serif" font-weight="700" font-size="44" fill="#fff" text-anchor="middle">1</text>
</svg>
''', encoding='utf-8')
print('icones ecrites dans', OUT)
