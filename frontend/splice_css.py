import re

p = r"D:\Projects\miniprj\miniprj\frontend\public\admin.html"
s = open(p, encoding="utf-8").read()
css = open(r"D:\Projects\miniprj\miniprj\frontend\public\admin-new.css", encoding="utf-8").read()
s2 = re.sub(r"<style>[\s\S]*?</style>", "<style>\n" + css + "\n  </style>", s, count=1)
open(p, "w", encoding="utf-8").write(s2)
print("done", s2.count("<style>"))
PY