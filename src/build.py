import glob,os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda n:open(os.path.join(d,n),encoding='utf8').read()
parts=''.join(r(p) +'\n' for p in ['parts/a_core.js','parts/b_ui.js','parts/c_render.js','parts/d_data.js','parts/e_pointer.js','parts/f_export.js','parts/g_social.js','parts/h_life.js'])
open(os.path.join(d,'dots.js'),'w',encoding='utf8').write(parts)
out=r('pre.html')+'<style>'+r('dash.css')+'</style></head>'+r('body.html')+'<script>'+r('dash.new.js')+'</script><style>'+r('dots.css')+'</style>'+r('dots.html')+'<script>'+parts+'</script></body></html>'
open(os.path.join(d,'app.html'),'w',encoding='utf8').write(out)
def fill(t):
    for k,f in [('{{LOGO_DK}}','logo_dk'),('{{LOGO_LT}}','logo_lt'),('{{ICON180}}','icon180'),('{{ICON}}','icon')]:
        t=t.replace(k,r('assets/'+f+'.txt').strip())
    return t
out=fill(out)
open(os.path.join(d,'app.html'),'w',encoding='utf8').write(out)
print(len(out))

sh=fill(r('shim.js'))
st=out.replace('<title>','<script>'+sh+'</script><title>',1)
open(os.path.join(d,'standalone.html'),'w',encoding='utf8').write(st)
print('standalone',len(st))
