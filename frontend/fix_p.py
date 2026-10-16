p=r"D:\Projects\miniprj\miniprj\frontend\update_dashboard2.py"
lines=open(p,encoding="utf-8").read().splitlines()
out=[]
for line in lines:
    out.append(line.replace("<p|Keep","<p>Keep"))
open(p,"w",encoding="utf-8").write("\n".join(out))
print("done")
PY