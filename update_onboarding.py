import os

path = r'D:\skcti\app\onboarding\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import type { Grade, Stream } from "@/lib/types";', 'import type { Grade, Stream } from "@/lib/types";\nimport type { ExamType, VariantType } from "@/lib/examConfig";')
content = content.replace('const [stream, setStream] = useState<Stream | null>(null);', 'const [stream, setStream] = useState<Stream | null>(null);\n  const [exam, setExam] = useState<ExamType | null>(null);\n  const [variant, setVariant] = useState<VariantType | null>(null);')
content = content.replace('const finish = async (s: Stream) => {', 'const finish = async (ex: any, s: any, v: any) => {')
content = content.replace('await completeOnboarding({ phone: phone.trim(), grade, stream: s });', 'await completeOnboarding({ phone: phone.trim(), grade, stream: s, exam: ex, variant: v });')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
