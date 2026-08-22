import os

path = r'D:\skcti\app\(student)\home\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { getCohortId } from "@/lib/examConfig";\n"use client";', '"use client";\nimport { getCohortId } from "@/lib/examConfig";')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
