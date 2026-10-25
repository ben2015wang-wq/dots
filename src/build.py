"""Build DOTS from its source files.

  python build.py            dev build: writes dots.js, app.html and standalone.html next to the sources
  python build.py --out dist release build: writes dist/index.html (the standalone app) plus the PWA files
                             (manifest, service worker, icons, privacy policy, terms) into dist/
"""
import os, sys, shutil

d = os.path.dirname(os.path.abspath(__file__))
r = lambda n: open(os.path.join(d, n), encoding='utf8').read()
PARTS = ['a_core', 'b_ui', 'c_render', 'd_data', 'e_pointer', 'f_export', 'g_social', 'h_life']
parts = ''.join(r('parts/%s.js' % p) + '\n' for p in PARTS)

def fill(t):
    for k, f in [('{{LOGO_DK}}', 'logo_dk'), ('{{LOGO_LT}}', 'logo_lt'), ('{{ICON180}}', 'icon180'), ('{{ICON}}', 'icon')]:
        t = t.replace(k, r('assets/' + f + '.txt').strip())
    return t

page = (r('pre.html') + '<style>' + r('dash.css') + '</style></head>' + r('body.html')
        + '<script>' + r('dash.new.js') + '</script><style>' + r('dots.css') + '</style>' + r('dots.html')
        + '<script>' + parts + '</script></body></html>')
page = fill(page)                      # the version without the standalone runtime (claude.ai artifact)
standalone = page.replace('<title>', '<script>' + fill(r('shim.js')) + '</script><title>', 1)

if '--out' in sys.argv:
    out = os.path.abspath(sys.argv[sys.argv.index('--out') + 1])
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(standalone)
    pwa = os.path.join(d, 'pwa')
    for root, _, files in os.walk(pwa):
        for f in files:
            src = os.path.join(root, f)
            dst = os.path.join(out, os.path.relpath(src, pwa))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copyfile(src, dst)
    open(os.path.join(out, '.nojekyll'), 'w').close()
    left = [k for k in ('{{LOGO_DK}}', '{{LOGO_LT}}', '{{ICON}}', '{{ICON180}}') if k in standalone]
    if left:
        sys.exit('unreplaced placeholders: %s' % left)
    print('built', out, len(standalone), 'bytes')
else:
    open(os.path.join(d, 'dots.js'), 'w', encoding='utf8').write(parts)
    open(os.path.join(d, 'app.html'), 'w', encoding='utf8').write(page)
    open(os.path.join(d, 'standalone.html'), 'w', encoding='utf8').write(standalone)
    for root, _, files in os.walk(os.path.join(d, 'pwa')):   # so a local test server serves the PWA files too
        for f in files:
            src = os.path.join(root, f); dst = os.path.join(d, os.path.relpath(src, os.path.join(d, 'pwa')))
            os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(src, dst)
    print(len(page), 'standalone', len(standalone))
