import re
p=r"D:\Projects\miniprj\miniprj\frontend\public\admin.html"
s=open(p,encoding="utf-8").read()
m=re.search(r"<script>([\s\S]*?)</script>",s)
js=m.group(1)
open(r"D:\Projects\miniprj\miniprj\frontend\admin-check.js","w",encoding="utf-8").write(js)
print("ok")
PY