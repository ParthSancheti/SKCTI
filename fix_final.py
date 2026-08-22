import os
import re

# 1. Fix home/page.tsx
path = r'D:\skcti\app\(student)\home\page.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
if 'import { getCohortId } from "@/lib/examConfig";' not in content:
    content = 'import { getCohortId } from "@/lib/examConfig";\n' + content
    with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 2. Fix examConfig.ts
path = r'D:\skcti\lib\examConfig.ts'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('export type Stream = "PCM" | "PCB";', 'import { type Stream } from "@/lib/types";')
with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 3. Fix store.tsx
path = r'D:\skcti\lib\store.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('variant: finalVariant', 'variant: finalVariant || undefined')
content = content.replace('stream: finalStream', 'stream: finalStream || undefined')
# There is one more line: `variant: finalVariant` inside completeOnboarding
content = content.replace('variant: variant,', 'variant: variant || undefined,')
content = content.replace('stream: stream,', 'stream: stream || undefined,')
with open(path, 'w', encoding='utf-8') as f: f.write(content)
