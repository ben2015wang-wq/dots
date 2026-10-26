import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
objs=lambda pg:pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v)}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800},permissions=['clipboard-read','clipboard-write']);pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    pg.keyboard.press('t');pg.mouse.click(500,300);pg.keyboard.type('Copy me');pg.keyboard.press('Escape');pg.wait_for_timeout(600)
    pg.keyboard.press('r');pg.mouse.move(700,300);pg.mouse.down();pg.mouse.move(820,380,steps=5);pg.mouse.up();pg.wait_for_timeout(500)
    pg.keyboard.press('v');pg.keyboard.press('Control+a');pg.wait_for_timeout(300)
    pg.keyboard.press('Control+c');pg.wait_for_timeout(300);print('clip',pg.evaluate("navigator.clipboard.readText()"))
    pg.keyboard.press('Control+v');pg.wait_for_timeout(800);print('n after paste',len(objs(pg)))
    pg.keyboard.press('Control+v');pg.wait_for_timeout(800);print('n after paste2',len(objs(pg)))
    pg.keyboard.press('Control+x');pg.wait_for_timeout(800);print('n after cut',len(objs(pg)))
    pg.keyboard.press('Control+v');pg.wait_for_timeout(800);print('n after paste3',len(objs(pg)),pg._errs)
    # align
    pr=lambda:[(o['t'],round(o['x']),round(o['y']),round(o['w'])) for o in objs(pg)]
    print(pr());pg.click('#props [data-a=al-l]');pg.wait_for_timeout(500);print('left',pr())
    pg.click('#props [data-a=al-r]');pg.wait_for_timeout(500);print('right',pr())
    # resize snap
    pg.keyboard.press('Escape');pg.mouse.click(1100,700)
    pg.keyboard.press('r');pg.mouse.move(700,620);pg.mouse.down();pg.mouse.move(900,700,steps=5);pg.mouse.up();pg.wait_for_timeout(400)
    pg.keyboard.press('r');pg.mouse.move(720,520);pg.mouse.down();pg.mouse.move(820,590,steps=5);pg.mouse.up();pg.wait_for_timeout(400)
    pg.keyboard.press('v');pg.mouse.click(720,555);pg.wait_for_timeout(400)
    print(pr()[-2:],pg.evaluate("[...document.querySelectorAll('#O [data-h]')].map(e=>e.dataset.h)"));pg.screenshot(path=S+'/t45.png')
    h=pg.evaluate("(()=>{const r=document.querySelector('#O [data-h=se]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
    pg.mouse.move(*h);pg.mouse.down();pg.mouse.move(897,h[1]+20,steps=8);pg.mouse.up();pg.wait_for_timeout(700)
    print('resized',pr()[-1], 'target right edge 300 abs?',pr()[-2]);print(pg._errs)
