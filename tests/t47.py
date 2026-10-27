import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    pg.click('#bl');pg.wait_for_timeout(300)
    pg.click('#lp [data-ly=add]');pg.wait_for_timeout(300);pg.keyboard.type('背景圖層');pg.keyboard.press('Enter');pg.wait_for_timeout(400)
    print([e.inner_text() for e in pg.locator('#lp .ln').all()])
    pg.locator('#lp .lr').last.locator('[data-ly=ren]').click();pg.wait_for_timeout(200);pg.keyboard.type('底層');pg.keyboard.press('Enter');pg.wait_for_timeout(400)
    print([e.inner_text() for e in pg.locator('#lp .ln').all()])
    # slider drag: vertical
    r=pg.evaluate("(()=>{const r=document.getElementById('zs').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()");print('zs rect',r)
    cx,cy=r[0]+r[2]/2,r[1]+r[3]/2
    v0=pg.evaluate("document.getElementById('zs').value")
    pg.mouse.move(cx,cy);pg.mouse.down();pg.mouse.move(cx,cy-40,steps=6);pg.mouse.up();v1=pg.evaluate("document.getElementById('zs').value")
    pg.mouse.move(cx,cy-40);pg.mouse.down();pg.mouse.move(cx+60,cy-40,steps=6);pg.mouse.up();v2=pg.evaluate("document.getElementById('zs').value")
    print('values',v0,v1,v2,pg._errs);pg.screenshot(path=S+'/t47.png')
