import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from run import *
srv=serve(S+'/app')
def texts(pg):
    return pg.evaluate("""()=>{const d=window.__db.load();return Object.entries(d).filter(([k])=>/^b\\/[^/]+\\/objs\\//.test(k)).map(([k,v])=>v).filter(o=>o.t==='text')}""")
with sync_playwright() as p:
    b=launch(p);ctx=b.new_context(viewport={'width':1280,'height':800});pg=newpage(ctx)
    pg.wait_for_timeout(800);pg.locator('.card').first.dblclick();pg.wait_for_timeout(700)
    pg.keyboard.press('t');pg.mouse.click(300,300)
    pg.keyboard.type('see https://example.com now www.test.org ');pg.keyboard.press('Shift+Enter')
    pg.evaluate("(()=>{const t=document.getElementById('ta');const n=document.createElement('a');n.href='https://auto.example';n.textContent='autolinked';t.appendChild(n)})()")
    pg.keyboard.type(' end');pg.keyboard.press('Escape');pg.wait_for_timeout(1500)
    t=texts(pg);print([ (o['txt'],[r.get('h') for r in o.get('runs',[])]) for o in t])
    print('svg links',pg.evaluate("document.querySelectorAll('[data-lk]').length"),pg._errs)
