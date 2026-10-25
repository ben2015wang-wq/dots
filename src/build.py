import glob,os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda n:open(os.path.join(d,n),encoding='utf8').read()
parts=''.join(r(p) +'\n' for p in ['parts/a_core.js','parts/b_ui.js','parts/c_render.js','parts/d_data.js','parts/e_pointer.js','parts/f_export.js','parts/g_social.js','parts/h_life.js'])
open(os.path.join(d,'dots.js'),'w',encoding='utf8').write(parts)
out=r('pre.html')+'<style>'+r('dash.css')+'</style></head>'+r('body.html')+'<script>'+r('dash.new.js')+'</script><style>'+r('dots.css')+'</style>'+r('dots.html')+'<script>'+parts+'</script></body></html>'
open(os.path.join(d,'app.html'),'w',encoding='utf8').write(out)
print(len(out))

sh=r('shim.js')
st=out.replace('<title>','<script>'+sh+'</script><title>',1)
open(os.path.join(d,'standalone.html'),'w',encoding='utf8').write(st)
print('standalone',len(st))
