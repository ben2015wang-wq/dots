import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
imgs=lambda pg:pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v).filter(o=>o.t==='img').map(o=>[Math.round(o.x),Math.round(o.w)])}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800},permissions=['clipboard-read','clipboard-write']);pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    pg.set_input_files('#fi',S+'/tests/big.png');pg.wait_for_timeout(2500)
    print('imgs',imgs(pg))
    pg.keyboard.press('Control+c');pg.wait_for_timeout(800)
    print('clip types',pg.evaluate("navigator.clipboard.read().then(a=>a.map(i=>i.types))"))
    pg.keyboard.press('Control+v');pg.wait_for_timeout(1500);print('after paste',imgs(pg),pg._errs)
