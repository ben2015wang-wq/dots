import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
objs=lambda pg:pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v)}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    pg.keyboard.press('t');pg.mouse.click(500,300);pg.keyboard.type('Hello group');pg.keyboard.press('Escape');pg.wait_for_timeout(600)
    pg.keyboard.press('r');pg.mouse.move(700,300);pg.mouse.down();pg.mouse.move(820,380,steps=5);pg.mouse.up();pg.wait_for_timeout(600)
    pg.keyboard.press('v');pg.keyboard.press('Control+a');pg.wait_for_timeout(600)
    print('sel',pg.evaluate("[...document.querySelectorAll('#O [data-h]')].map(e=>e.dataset.h)"))
    pr=lambda:[(o['t'],round(o['x']),round(o['y']),round(o['w']),round(o['h']),o.get('r',0),o.get('s')) for o in objs(pg)]
    print('before',pr())
    def drag(n,dx,dy):
        h=pg.evaluate("n=>{const r=document.querySelector('#O [data-h='+n+']').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}",n)
        pg.mouse.move(*h);pg.mouse.down();pg.mouse.move(h[0]+dx,h[1]+dy,steps=8);pg.mouse.up();pg.wait_for_timeout(900)
    drag('gse',-100,-60);print('scaled',pr())
    drag('grot',120,40);print('rot',pr())
    pg.keyboard.press('Control+z');pg.wait_for_timeout(500);print('undo',pr());print(pg._errs)
    pg.screenshot(path=S+'/t43.png')
