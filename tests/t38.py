import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
def texts(pg):
    return pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v).filter(o=>o.t==='text')}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    for (x,y,tx) in [(600,200,'AAA'),(600,500,'BBB')]:
        pg.keyboard.press('t');pg.mouse.click(x,y);pg.keyboard.type(tx);pg.keyboard.press('Escape');pg.wait_for_timeout(300)
    pg.keyboard.press('v');pg.mouse.click(900,700);pg.wait_for_timeout(1200)
    print([(o['txt'],o['x'],o['y'],o['s']) for o in texts(pg)])
    # numeric size
    pg.mouse.click(610,212);pg.wait_for_timeout(300)
    n=pg.locator('#props input.nv[data-pn=s]');print('size input',n.input_value())
    n.fill('200');n.press('Enter');pg.wait_for_timeout(1200)
    print('size ->',[o['s'] for o in texts(pg) if o['txt']=='AAA'])
    r=pg.locator('#props input.nv[data-pn=r]');r.fill('37');r.press('Enter');pg.wait_for_timeout(1200)
    print('rot ->',[o['r'] for o in texts(pg) if o['txt']=='AAA'])
    # snapping: drag BBB so its x aligns near AAA
    ob=[o for o in texts(pg) if o['txt']=='BBB'][0];oa=[o for o in texts(pg) if o['txt']=='AAA'][0]
    pg.keyboard.press('Escape');pg.mouse.click(900,700)
    pg.mouse.move(ob['x']+10,ob['y']+10);pg.mouse.down();pg.mouse.move(ob['x']+10+(oa['x']-ob['x'])+3,ob['y']+60,steps=8)
    print('guide lines',pg.evaluate("document.querySelectorAll('#GD line').length"))
    pg.mouse.up();pg.wait_for_timeout(1200)
    print('after snap',[(o['txt'],o['x']) for o in texts(pg)],'AAA x',oa['x'])
    # toggle off
    pg.click('#bsn');pg.wait_for_timeout(200);print('snap btn on?',pg.evaluate("document.getElementById('bsn').classList.contains('on')"))
    pg.click('#bsn')
    # rotation badge
    pg.keyboard.press('Escape');pg.mouse.click(900,700);pg.wait_for_timeout(300)
    nb=[o for o in texts(pg) if o['txt']=='BBB'][0];pg.mouse.click(nb['x']+10,nb['y']+10);pg.wait_for_timeout(500)
    print('sel handles',pg.evaluate("[...document.querySelectorAll('#O [data-h]')].map(e=>e.dataset.h)"))
    h=pg.evaluate("(()=>{const e=document.querySelector('#O [data-h=rot]');if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()");print('rot handle',h)
    if h:
        pg.mouse.move(*h);pg.mouse.down();pg.mouse.move(h[0]+60,h[1]+30,steps=6)
        print('badge',pg.evaluate("[...document.querySelectorAll('#dots div')].filter(d=>d.textContent.startsWith('↻')&&d.style.display!=='none').map(d=>d.textContent)"))
        pg.mouse.up()
    print(pg._errs)
