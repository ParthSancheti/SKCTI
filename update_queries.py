import os

files = [
    r'D:\skcti\app\(student)\home\page.tsx',
    r'D:\skcti\app\(student)\learn\page.tsx',
    r'D:\skcti\app\(student)\tests\page.tsx'
]

for p in files:
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    
    if 'getCohortId' not in content:
        content = content.replace('import { useAuthGate, useStore } from "@/lib/store";', 'import { useAuthGate, useStore } from "@/lib/store";\nimport { getCohortId } from "@/lib/examConfig";')
        content = content.replace('where("streams", "array-contains", profile.stream)', 'where("streams", "array-contains", getCohortId((profile as any).exam, profile.stream, (profile as any).variant))')
    
    with open(p, 'w', encoding='utf-8') as f: f.write(content)
