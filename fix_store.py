import os
import re

path = r'D:\skcti\lib\store.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('variant: (variant || undefined) as any,', 'variant: variant as any,')
content = content.replace('stream: (stream || undefined) as any,', 'stream: stream as any,')
content = content.replace('variant: (finalVariant || undefined) as any,', 'variant: finalVariant as any,')
content = content.replace('stream: (finalStream || undefined) as any,', 'stream: finalStream as any,')

# if there's any variant: without as any
content = re.sub(r'variant:\s*([a-zA-Z0-9_]+),', r'variant: \1 as any,', content)
content = re.sub(r'stream:\s*([a-zA-Z0-9_]+),', r'stream: \1 as any,', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
