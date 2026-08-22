import os

path = r'D:\skcti\lib\examConfig.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('export type Stream = "PCM" | "PCB" | null;', 'import { type Stream } from "@/lib/types";')
content = content.replace('export type VariantType = "MAIN" | "ADVANCED" | null;', 'export type VariantType = "MAIN" | "ADVANCED";')
content = content.replace('streams?: Stream[];', 'streams?: string[];')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
