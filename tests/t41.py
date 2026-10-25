import sys;sys.path.insert(0,'/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad/tests')
from playwright.sync_api import sync_playwright
from run import serve
S='/tmp/claude-0/-home-claude/c56ee7cb-7625-56ea-a2c7-f27e432dee5c/scratchpad'
srv=serve(S+'/app',8803)
URL='http://127.0.0.1:8803/standalone.html'
CFG='localStorage.setItem("dots-fbconfig",JSON.stringify({apiKey:"k",authDomain:"x",projectId:"p",appId:"a"}));'
FAKE=open(S+'/tests/fakefb.js').read()
ok=lambda n,c:print(('PASS ' if c else 'FAIL ')+n)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1280,'height':800})
    def mk(pre=''):
        pg=ctx.new_page();e=[];pg.on('pageerror',lambda x:e.append(str(x)));pg._e=e;pg.add_init_script(CFG+pre+FAKE);return pg
    a=mk();a.goto(URL);a.wait_for_timeout(1000)
    ok('landing shown',a.evaluate("!!document.querySelector('#fbgate .ld-hero')"))
    a.click('#fbgate .ld-nav [data-go="#ld-q"]');a.wait_for_timeout(900)
    ok('anchor scrolls',a.evaluate("document.getElementById('fbgate').scrollTop>500"))
    a.evaluate("document.getElementById('fbgate').scrollTo(0,0)")
    a.click('#fbg');a.wait_for_timeout(2500)
    ok('google login -> app',a.evaluate("!document.getElementById('fbgate')&&document.querySelectorAll('.card').length>0"))
    c=mk();c.goto(URL);c.wait_for_timeout(1000)
    c.click('#fbl');c.wait_for_timeout(1800)
    ok('local trial -> app',c.evaluate("!document.getElementById('fbgate')&&document.querySelectorAll('.card').length>0"))
    d=mk();d.goto(URL);d.wait_for_timeout(1000)
    d.locator('.ld-final .ld-g').click();d.wait_for_timeout(2500)
    ok('bottom CTA login',d.evaluate("!document.getElementById('fbgate')"))
    print(a._e,c._e,d._e)
