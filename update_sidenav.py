import os

path = r'D:\skcti\components\SideNav.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'getExamLabel' not in content:
    content = content.replace('import { useStore, vibrate } from "@/lib/store";', 'import { useStore, vibrate } from "@/lib/store";\nimport { getExamLabel } from "@/lib/examConfig";')

content = content.replace('const stream = profile?.stream ?? "PCM";', 'const stream = getExamLabel((profile as any)?.exam, profile?.stream, (profile as any)?.variant);')
content = content.replace('Your {profile?.stream ?? "PCM"} class awaits.', 'Your {stream} class awaits.')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
