"""Build embedded polygon contours from official DejaVu Sans 2.37.
Usage: py tools/build-letter-contours.py path/to/DejaVuSans.ttf
Build tool only; fontTools is not a browser dependency.
"""
import json
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

font = TTFont(sys.argv[1])
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()

class PolygonPen(BasePen):
    def __init__(self):
        super().__init__(glyphs)
        self.contours = []
        self.points = []
    def _moveTo(self, p):
        self.points = [p]
    def _lineTo(self, p):
        self.points.append(p)
    def _qCurveToOne(self, p1, p2):
        p0 = self._getCurrentPoint()
        for i in range(1, 5):
            t = i / 4
            self.points.append(tuple((1-t)**2*p0[j]+2*(1-t)*t*p1[j]+t*t*p2[j] for j in (0,1)))
    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        for i in range(1, 7):
            t = i / 6
            self.points.append(tuple((1-t)**3*p0[j]+3*(1-t)**2*t*p1[j]+3*(1-t)*t*t*p2[j]+t**3*p3[j] for j in (0,1)))
    def _closePath(self):
        if len(self.points)>1 and self.points[-1]==self.points[0]:
            self.points.pop()
        if len(self.points)>2:
            self.contours.append([[round(x,2),round(y,2)] for x,y in self.points])
    def _endPath(self):
        self._closePath()

data = {}
for code in list(range(32,127))+list(range(160,256)):
    if code in cmap:
        pen = PolygonPen()
        glyphs[cmap[code]].draw(pen)
        data[chr(code)] = {'advance':font['hmtx'][cmap[code]][0], 'contours':pen.contours}
path = Path('jscad/braille.jscad')
source = path.read_text(encoding='utf-8')
source = source.split('// BEGIN EMBEDDED DEJAVU CONTOURS')[0].rstrip()
source += '\n\n// BEGIN EMBEDDED DEJAVU CONTOURS\n// DejaVu Sans 2.37; license: docs/licenses/DejaVu-LICENSE.txt.\n'
source += 'var letterFontCapHeight = 1493;\nvar letterFontContours = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
path.write_text(source,encoding='utf-8')
