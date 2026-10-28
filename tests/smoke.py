"""Smoke test for a built DOTS site.   usage: python tests/smoke.py dist"""
import sys, os, json, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'dist')

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=root))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:%d/' % port
fails = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    if not cond: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    pg = b.new_context(viewport={'width': 1280, 'height': 800}).new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(base); pg.wait_for_timeout(1500)
    check('dashboard shows the sample works', pg.locator('.card').count() >= 10)
    check('no page errors', not errs)
    check('manifest is linked', pg.evaluate("!!document.querySelector('link[rel=manifest]')"))
    m = pg.request.get(base + 'manifest.webmanifest'); check('manifest served', m.ok and json.loads(m.text()).get('name') == 'DOTS')
    check('service worker served', pg.request.get(base + 'sw.js').ok)
    check('icons served', pg.request.get(base + 'icons/icon-512.png').ok and pg.request.get(base + 'icons/icon-192.png').ok)
    check('privacy policy served', pg.request.get(base + 'privacy.html').ok)
    check('terms served', pg.request.get(base + 'terms.html').ok)
    # create a board from a template and make sure the editor opens
    pg.click('text=新增作品'); pg.click('#tpm [data-id=bs]'); pg.wait_for_timeout(2500)
    check('editor opens', pg.evaluate("document.getElementById('dots').classList.contains('on')"))
    check('no page errors after opening the editor', not errs)
    # the schedule app (日常行程本) at /planner/
    pp = b.new_context(viewport={'width': 390, 'height': 800}).new_page()
    perrs = []
    pp.on('pageerror', lambda e: perrs.append(str(e)))
    pp.goto(base + 'planner/'); pp.wait_for_timeout(1200)
    check('planner: week board renders', pp.locator('#grid .col').count() >= 1)
    check('planner: manifest linked and served', pp.evaluate("!!document.querySelector('link[rel=manifest]')")
          and json.loads(pp.request.get(base + 'planner/manifest.webmanifest').text()).get('short_name') == '行程')
    check('planner: apple touch icon served', pp.request.get(base + 'planner/icons/apple-touch-icon.png').ok)
    check('planner: service worker served', pp.request.get(base + 'planner/sw.js').ok)
    check('planner: widget script served', 'ListWidget' in pp.request.get(base + 'planner/widget.js').text())
    pp.fill('#t-new', '交報告 明天'); pp.press('#t-new', 'Enter'); pp.wait_for_timeout(200)
    check('planner: adding a todo works', pp.locator('#todoList li:has-text("交報告")').count() == 1)
    pp.reload(); pp.wait_for_timeout(1000)
    check('planner: todo kept after reload', pp.locator('#todoList li:has-text("交報告")').count() == 1)
    pp.click('#prefBtn'); pp.wait_for_timeout(200)
    check('planner: settings open', pp.evaluate("!document.getElementById('prefScrim').hidden && !!document.getElementById('set-key')"))
    check('planner: no page errors', not perrs)
    b.close()
srv.shutdown()
sys.exit(1 if fails else 0)
