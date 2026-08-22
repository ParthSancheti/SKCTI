import os

path = r'D:\skcti\app\(student)\settings\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import type { Stream } from "@/lib/types";', 'import type { Stream } from "@/lib/types";\nimport { type ExamType, type VariantType } from "@/lib/examConfig";')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
