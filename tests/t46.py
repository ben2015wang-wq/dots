import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
objs=lambda pg:pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v)}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    for x0,x1 in [(500,540),(600,700),(950,1000)]:
        pg.keyboard.press('r');pg.mouse.move(x0,500);pg.mouse.down();pg.mouse.move(x1,560,steps=4);pg.mouse.up();pg.wait_for_timeout(300)
    pg.keyboard.press('v');pg.keyboard.press('Control+a');pg.wait_for_timeout(300)
    pr=lambda:sorted((round(o['x']),round(o['w'])) for o in objs(pg) if o['t']=='rect')
    print(pr());pg.click('#props [data-a=ds-h]');pg.wait_for_timeout(500);r=pr();print(r,[r[i+1][0]-r[i][0]-r[i][1] for i in range(2)])
    # reopen persistence
    pg.reload();pg.wait_for_timeout(1500);print(pg._errs)
