import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
objs=lambda pg:pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v)}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    pg.keyboard.press('r');pg.mouse.move(700,300);pg.mouse.down();pg.mouse.move(820,380,steps=4);pg.mouse.up();pg.wait_for_timeout(500)
    pg.on('pageerror',lambda e:print('PE',str(e.stack)[:300]))
    print('btn',pg.locator('#props .pgpop').count())
    with ctx.expect_page() as ev: pg.click('#props .pgpop')
    w=ev.value;w.wait_for_load_state();w.wait_for_timeout(800)
    print('in popup',w.evaluate("!!document.querySelector('#props')"),'main has props',pg.evaluate("!!document.querySelector('#dots > #props')"))
    w.screenshot(path=S+'/t50.png')
    print('rect before',[ (o['w'],o['h']) for o in objs(pg)])
    # change width via numeric input in popup
    inp=w.locator('#props input[data-pn=w]')
    print('w inputs',inp.count())
    if inp.count():
        inp.first.fill('300');inp.first.press('Enter');w.wait_for_timeout(800)
    print('rect after',[ (o['w'],o['h']) for o in objs(pg)])
    w.locator('#props [data-c]').nth(2).click();w.wait_for_timeout(500);print('color',[o.get('c') for o in objs(pg)])
    w.click('#props .pgpop');pg.wait_for_timeout(1000)
    print('docked back',pg.evaluate("!!document.querySelector('#dots > #props')"),pg._errs)
