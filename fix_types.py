import os
import re

# 1. Fix settings/page.tsx
path = r'D:\skcti\app\(student)\settings\page.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()

# Uncomment draft variables
content = content.replace('// const draftExam', 'const [draftExam, setDraftExam] = useState')
content = content.replace('// const draftStream', 'const [draftStream, setDraftStream] = useState')
content = content.replace('// const draftVariant', 'const [draftVariant, setDraftVariant] = useState')

# Add Target to lucide-react import
if 'Target' not in content[:500]:
    content = content.replace('X, Trash2, Cpu, Download, FileText, BarChart3, Gauge', 'X, Trash2, Cpu, Download, FileText, BarChart3, Gauge, Target')

with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 2. Fix home/page.tsx
path = r'D:\skcti\app\(student)\home\page.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
if 'import { getCohortId' not in content:
    content = content.replace('import { useStore', 'import { getCohortId } from "@/lib/examConfig";\nimport { useStore')
with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 3. Fix learn/page.tsx (duplicate imports)
path = r'D:\skcti\app\(student)\learn\page.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
# Remove all getCohortId imports and just add one
content = re.sub(r'import \{ getCohortId \} from "@/lib/examConfig";\n', '', content)
content = content.replace('import { useStore', 'import { getCohortId } from "@/lib/examConfig";\nimport { useStore')
with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 4. Fix tests/page.tsx
path = r'D:\skcti\app\(student)\tests\page.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
content = re.sub(r'import \{ getCohortId \} from "@/lib/examConfig";\n', '', content)
content = content.replace('import { useStore', 'import { getCohortId } from "@/lib/examConfig";\nimport { useStore')
with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 5. Fix examConfig.ts StreamType vs Stream
path = r'D:\skcti\lib\examConfig.ts'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
# Change StreamType to Stream everywhere
content = content.replace('StreamType', 'Stream')
# Except the definition of StreamType? Wait, I defined it as `export type StreamType = "PCM" | "PCB";`
# Let's change `export type StreamType = "PCM" | "PCB";` to import Stream from types
content = content.replace('export type Stream = "PCM" | "PCB";', 'import type { Stream } from "@/lib/types";')
with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 6. Fix VariantType type issues
path = r'D:\skcti\lib\examConfig.ts'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
if 'export type VariantType =' not in content:
    content = content.replace('export type VariantType', 'export type VariantType = "MAIN" | "ADVANCED" | null;')
with open(path, 'w', encoding='utf-8') as f: f.write(content)

# 7. Store.tsx VariantType assignment error
path = r'D:\skcti\lib\store.tsx'
with open(path, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('variant: finalVariant', 'variant: finalVariant || undefined')
content = content.replace('stream: finalStream', 'stream: finalStream || undefined')
with open(path, 'w', encoding='utf-8') as f: f.write(content)
