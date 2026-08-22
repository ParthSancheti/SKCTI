import os

for path in [
    r'D:\skcti\app\(student)\home\page.tsx',
    r'D:\skcti\app\(student)\learn\page.tsx',
    r'D:\skcti\app\(student)\tests\page.tsx'
]:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'getCohortId' not in content[:1000]:
        content = content.replace('import { useStore', 'import { getCohortId } from "@/lib/examConfig";\nimport { useStore')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
