import os

path = r'D:\skcti\components\TitleBar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'getExamLabel' not in content:
    content = content.replace('import { useHapticRouter } from "@/components/HapticRouter";', 'import { useHapticRouter } from "@/components/HapticRouter";\nimport { getExamLabel } from "@/lib/examConfig";')

search_str = '{ icon: "⚙️", label: "Settings", act: (e: React.MouseEvent) => navigate("/settings", e) }'
replace_str = '{ icon: "🎓", label: getExamLabel((profile as any).exam, profile.stream, (profile as any).variant), act: (e: React.MouseEvent) => navigate("/settings", e) },\n                    ' + search_str

content = content.replace(search_str, replace_str)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
