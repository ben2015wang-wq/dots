import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
def objs(pg):
    return pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v)}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    print('tool btn',pg.evaluate("!!document.querySelector('[data-t=note]')"))
    for (x,y,tx) in [(500,250,'目標 本季上線'),(850,150,'研究 訪談'),(850,380,'設計 原型')]:
        pg.keyboard.press('s');pg.mouse.click(x,y);pg.keyboard.type(tx);pg.keyboard.press('Escape');pg.wait_for_timeout(300)
    pg.keyboard.press('v');pg.mouse.click(1100,700);pg.wait_for_timeout(800)
    ns=[o for o in objs(pg) if o['t']=='text'];print('notes',[(o['txt'],round(o['x']),round(o['y']),o.get('fo'),o.get('c')) for o in ns])
    A,B,C=[ [o for o in ns if o['txt'].startswith(k)][0] for k in ('目標','研究','設計')]
    cx=lambda o:(o['x']+o['w']/2,o['y']+o['h']/2)
    pg.keyboard.press('n')
    for t in (B,C):
        a=cx(A);bb=cx(t);pg.mouse.move(*a);pg.mouse.down();pg.mouse.move((a[0]+bb[0])/2,(a[1]+bb[1])/2,steps=5);pg.mouse.move(*bb,steps=5);pg.mouse.up();pg.wait_for_timeout(500)
    cs=[o for o in objs(pg) if o['t'] in('line','arrow')];print('connectors',[(o.get('ca') is not None,o.get('cb') is not None,o.get('cv'),o.get('cd'),o['pts']) for o in cs])
    pg.screenshot(path='t/conn1.png')
    pg.keyboard.press('v');pg.mouse.click(1100,700)
    ma=cx(A);pg.mouse.move(A['x']+5,A['y']+5);pg.mouse.down();pg.mouse.move(A['x']+5-150,A['y']+5+120,steps=8);pg.mouse.up();pg.wait_for_timeout(1000)
    cs2=[o for o in objs(pg) if o['t'] in('line','arrow')];print('after move',[o['pts'] for o in cs2]);pg.screenshot(path='t/conn2.png');print(pg._errs)
