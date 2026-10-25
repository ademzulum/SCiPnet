"""Small copies of the personnel photos for the website.

The originals are several MB each (SVGs embed the full-size picture), which
made the personnel list slow to open. This writes images/personell_pictures/
thumbs/<name>.svg|.webp with the embedded picture scaled down to 600 px wide.
SVGs keep everything else, including the censor rects.

Run again after adding or changing a photo:  python scripts/thumbs.py
Needs Pillow:  python -m pip install pillow
"""
import base64
import io
import re
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parent.parent / 'images' / 'personell_pictures'
OUT = SRC / 'thumbs'
WIDTH = 600


def shrink(data: bytes) -> bytes:
    im = Image.open(io.BytesIO(data))
    im = im.convert('RGBA')
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=82)
    return buf.getvalue()


def main():
    OUT.mkdir(exist_ok=True)
    for f in sorted(SRC.iterdir()):
        if f.suffix == '.svg':
            s = f.read_text(encoding='utf8')
            s = re.sub(r'<metadata>.*?</metadata>', '', s, flags=re.S)

            def repl(m):
                small = base64.b64encode(shrink(base64.b64decode(m.group(2)))).decode()
                return f'{m.group(1)}data:image/webp;base64,{small}"'

            s = re.sub(r'((?:xlink:)?href=")data:image/[\w+]+;base64,([^"]+)"', repl, s)
            (OUT / f.name).write_text(s, encoding='utf8')
        elif f.suffix in ('.png', '.jpg', '.jpeg', '.webp'):
            (OUT / (f.stem + '.webp')).write_bytes(shrink(f.read_bytes()))
        else:
            continue
        print(f'{f.name}: {f.stat().st_size // 1024} KB -> thumbs/')


if __name__ == '__main__':
    main()
