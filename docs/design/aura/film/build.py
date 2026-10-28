# Builds the motion reel page (reel.html) from template.html.
import json, pathlib, sys

HERE = pathlib.Path(__file__).parent
CAPS = HERE.parent
sys.path.insert(0, str(CAPS))
import tabs

IDS = json.loads((CAPS / 'ids.json').read_text())
NM = '/home/claude/kabuk/node_modules/@expo-google-fonts/plus-jakarta-sans/'
FONTS = ''.join('@font-face{font-family:"Plus Jakarta Sans";font-weight:%d;src:url(file://%s%s)}' % (w, NM, f) for w, f in [
    (400, '400Regular/PlusJakartaSans_400Regular.ttf'), (500, '500Medium/PlusJakartaSans_500Medium.ttf'),
    (600, '600SemiBold/PlusJakartaSans_600SemiBold.ttf'), (700, '700Bold/PlusJakartaSans_700Bold.ttf'),
    (800, '800ExtraBold/PlusJakartaSans_800ExtraBold.ttf')])


def img(i):
    return 'file://' + IDS[i]


def fig(name):
    return (CAPS / 'assets' / ('fig-%s.svg' % name)).read_text().strip()


WORDMARK = ('<div class="row" style="gap: 8px"><svg viewBox="0 0 132 300" width="14" height="32" aria-hidden="true"><defs><clipPath id="wm"><rect x="0" y="0" width="80" height="240" rx="40"></rect></clipPath></defs>'
            '<rect x="0" y="0" width="80" height="240" rx="40" fill="#7B5CFF"></rect><rect x="52" y="60" width="80" height="240" rx="40" fill="#FF4F8B"></rect>'
            '<rect x="52" y="60" width="80" height="240" rx="40" fill="#FFB547" clip-path="url(#wm)"></rect></svg>'
            '<span style="font-size: 26px; font-weight: 800; letter-spacing: -0.04em">skall</span></div>')
FWD = '<svg class="ci sm" viewBox="0 0 24 24" aria-hidden="true"><rect class="a" x="5.45" y="6.9" width="13.1" height="3.2" rx="1.6" transform="rotate(45 12 8.5)"></rect><rect class="b" x="5.45" y="13.9" width="13.1" height="3.2" rx="1.6" transform="rotate(135 12 15.5)"></rect></svg>'
PLUS = '<svg class="ci sm" viewBox="0 0 24 24" aria-hidden="true"><rect class="a" x="2.9" y="10.4" width="18.2" height="3.2" rx="1.6" transform="rotate(90 12 12)"></rect><rect class="b" x="2.9" y="10.4" width="18.2" height="3.2" rx="1.6"></rect></svg>'
CHECK = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><rect class="b" x="2.41" y="13.3" width="9.99" height="3.2" rx="1.6" transform="rotate(45 7.4 14.9)"></rect><rect class="a" x="5.89" y="10.55" width="17.01" height="3.2" rx="1.6" transform="rotate(-48.23 14.4 12.15)"></rect></svg>'

TABLES = [('Kamp Ateşi', '8ddd576983d47cc910f39d929f93487f', 3, 'purple', 'Oyun'),
          ('Galaksi', '14307489853f304650bb31ffaa0d4e07', 2, 'pink', 'Sohbet'),
          ('Deniz Feneri', '8085f6640819b8f2c3e603c7358f1135', 5, 'glassy', 'Krot')]
rows0 = ''.join(
    '<div class="li" id="lr%d"><img class="thumb" id="lt%d" src="%s" alt=""><div class="col grow" style="gap: 5px"><p class="h3">%s</p>'
    '<div class="row" style="gap: 8px"><span class="pips">%s</span><span class="fine">%d kişi</span><span class="tag %s">%s</span></div></div>'
    '<button class="btn primary sm" type="button">%sKatıl</button></div>' % (i, i, img(t[1]), t[0], '<i></i>' * t[2], t[2], t[3], t[4], FWD)
    for i, t in enumerate(TABLES))
# The first row's button: its label, a loader while the request waits, a check once accepted.
K0 = ('<button class="btn primary sm" type="button" id="k0" style="position: relative">'
      '<span id="k0lbl" class="row" style="gap: 8px">%sKatıl</span>'
      '<span id="k0load" class="typing" style="position: absolute; left: 50%%; top: 50%%; margin: -6px 0 0 -10px; opacity: 0"><i id="kl0" style="background: #FFFFFF"></i><i id="kl1" style="background: #FFFFFF"></i><i id="kl2" style="background: #FFFFFF"></i></span>'
      '<span id="k0ok" style="position: absolute; left: 50%%; top: 50%%; margin: -9px 0 0 -9px; width: 18px; height: 18px; opacity: 0">%s</span></button>') % (FWD, CHECK.replace('class="ci"', 'class="ci sm"'))
first = rows0.index('<button class="btn primary sm" type="button">')
end = rows0.index('</button>', first) + len('</button>')
rows = rows0[:first] + K0 + rows0[end:]

MSG = [('c1', 'E', 'Elif', '21:42', None), ('c3', 'M', 'Mert', '20:15', 'Yarın kantinde yine Kinshi var mı?'),
       ('c5', 'D', 'Deniz', 'Dün', "Sen: Krot'ta beni hemen buldun ya"), ('c4', 'C', 'Can', 'Pzt', 'Artık mesajlaşabilirsiniz'),
       ('c2', 'S', 'Selin', '12 Eki', 'Galaksi masası çok iyiydi')]
msgrows = ''
for i, (c, l, n, tm, last) in enumerate(MSG):
    if last is None:
        sub = ('<div class="row between"><span class="row" style="gap: 6px"><span class="typing"><i id="ty0" style="background: #7B5CFF"></i><i id="ty1" style="background: #FF4F8B"></i><i id="ty2" style="background: #FFB547"></i></span>'
               '<span class="fine" style="color: #6A47F5; font-weight: 600">yazıyor</span></span><span class="badge" id="g-badge">2</span></div>')
    else:
        sub = '<p class="fine" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">%s</p>' % last
    msgrows += ('<div class="li" id="gr%d"><span class="av %s" style="width: 52px; height: 52px; font-size: 18px">%s</span><div class="col grow" style="gap: 3px">'
                '<div class="row between"><p class="h3">%s</p><span class="stamp">%s</span></div>%s</div></div>') % (i, c, l, n, tm, sub)

MEDALS = [('parti', 'İlk oyun', False), ('buyucu', '10 oyun', False), ('kahraman', 'Kinshi ustası', False), ('sade', '5 farklı masa', True)]
medals = ''
for i, (f, label, locked) in enumerate(MEDALS):
    box = ('background: rgba(20,17,43,.05); border: 1px dashed rgba(20,17,43,.16); position: relative' if locked else '')
    cls = 'medal' if locked else 'scene medal'
    st = 'opacity: .3; filter: grayscale(1);' if locked else ''
    medals += ('<div class="col" id="pm%d" style="align-items: center; gap: 6px"><div class="%s" style="width: 100%%; height: 76px; %s">'
               '<div class="stand" id="pmb%d" style="left: 50%%; margin-left: -30px; bottom: -10px; width: 60px; height: 79px; %s">%s</div></div>'
               '<span class="fine%s" style="text-align: center">%s</span></div>') % (i, cls, box, i, st, fig(f), '' if locked else ' strong', label)

# Tab bar: both icon states stacked in each tab, the white disc moves under them.
tab_spans = []
for n in tabs.ORDER:
    tab_spans.append('<span class="tab" aria-label="%s"><svg class="ti" id="toff-%s" viewBox="0 0 24 24" aria-hidden="true">%s</svg>'
                     '<svg class="ti big" id="ton-%s" viewBox="0 0 24 24" aria-hidden="true" style="opacity: 0">%s</svg></span>'
                     % (tabs.LABEL[n], n, tabs.off(n, 'r-%s-off' % n), n, tabs.on(n, 'r-%s-on' % n)))
TABS = ('<nav class="glass tabbar" id="bar" aria-label="Sekmeler" style="z-index: 40"><span class="mo-pill" id="pill"></span>%s</nav>' % ''.join(tab_spans))

h = (HERE / 'template.html').read_text()
for k, v in {'FONTS': FONTS, 'CSS': 'file://' + str(CAPS.parent / 'aura' / 'project' / 'aura.css'), 'JS': 'reel.js',
             'WORDMARK': WORDMARK, 'FWD': FWD, 'PLUS': PLUS, 'CHECK': CHECK, 'CHECKSM': CHECK.replace('class="ci"', 'class="ci sm" style="width: 15px; height: 15px"'), 'ROWS': rows, 'MSGROWS': msgrows, 'MEDALS': medals, 'TABS': TABS}.items():
    h = h.replace('{{%s}}' % k, v)
import re
h = re.sub(r'\{\{FIG:(\w+)\}\}', lambda m: fig(m.group(1)), h)
h = re.sub(r'\{\{IMG:(\w+)\}\}', lambda m: img(m.group(1)), h)
assert '{{' not in h, re.findall(r'\{\{[^}]*\}\}', h)
(HERE / 'reel.html').write_text(h)
print('ok', len(h))
