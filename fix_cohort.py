import os
import re

for path in [
    r'D:\skcti\app\(student)\home\page.tsx',
    r'D:\skcti\app\(student)\learn\page.tsx',
    r'D:\skcti\app\(student)\tests\page.tsx'
]:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'getCohortId' not in content[:500]:
        content = content.replace('import { useStore, vibrate, haptic } from "@/lib/store";', 'import { useStore, vibrate, haptic } from "@/lib/store";\nimport { getCohortId } from "@/lib/examConfig";')
        content = content.replace('import { useStore, firePortal } from "@/lib/store";', 'import { useStore, firePortal } from "@/lib/store";\nimport { getCohortId } from "@/lib/examConfig";')
        content = content.replace('import { useStore, vibrate } from "@/lib/store";', 'import { useStore, vibrate } from "@/lib/store";\nimport { getCohortId } from "@/lib/examConfig";')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
