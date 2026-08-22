import os
import re

path = r'D:\skcti\app\(student)\settings\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace('import type { Grade, Stream } from "@/lib/types";', 'import type { Grade, Stream } from "@/lib/types";\nimport { type ExamType, type VariantType } from "@/lib/examConfig";')
content = content.replace('import { ChevronLeft, Pencil, Flame, Download, Shield, Moon, Sun, GraduationCap, Cpu, Trash2, Bell, FileText, SettingsIcon, LogOut, Check, X, Sparkles } from "lucide-react";', 'import { ChevronLeft, Pencil, Flame, Download, Shield, Moon, Sun, GraduationCap, Cpu, Trash2, Bell, FileText, SettingsIcon, LogOut, Check, X, Sparkles, Target } from "lucide-react";')

# Update useStore destructuring
content = content.replace('setStream, upgradeGrade', 'setTargetExam, upgradeGrade')

# Add new states
content = content.replace('const [confirmStream, setConfirmStream] = useState<Stream | null>(null);', '''  const [editingExam, setEditingExam] = useState(false);
  const [draftExam, setDraftExam] = useState<ExamType | null>(null);
  const [draftStream, setDraftStream] = useState<Stream | null>(null);
  const [draftVariant, setDraftVariant] = useState<VariantType | null>(null);''')

# Now we need to replace the Stream Card section using regex
stream_card_regex = re.compile(r'\{\/\* Stream Card \*\/\}.*?<\/motion\.div>', re.DOTALL)

new_stream_card = '''{/* Target Exam Card */}
        <motion.div variants={itemVariants} className="glassy rounded-[24px] p-5 flex flex-col md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Target size={22} className="text-pink-500" />
                <h3 className="font-sora font-semibold text-on-surface">Target Exam</h3>
              </div>
              <p className="font-geist text-xs text-error font-bold">Switching wipes today's AI plan.</p>
            </div>
            {!editingExam ? (
              <button onClick={() => {
                setDraftExam(profile.exam || "MHT_CET");
                setDraftStream(profile.stream || "PCM");
                setDraftVariant(profile.variant || "MAIN");
                setEditingExam(true);
              }} className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-geist text-xs font-bold transition-colors">
                Change
              </button>
            ) : (
              <button onClick={() => setEditingExam(false)} className="px-4 py-1.5 rounded-full bg-black/10 dark:bg-white/10 text-on-surface font-geist text-xs font-bold transition-colors">
                Cancel
              </button>
            )}
          </div>

          {!editingExam ? (
            <div className="flex flex-col">
              <p className="font-sora text-xl font-bold text-on-surface mb-1">
                {profile.exam === "JEE" ? "JEE" : (profile.exam === "NEET" ? "NEET" : "MHT-CET")}
              </p>
              <p className="font-geist text-sm text-on-surface-variant">
                {profile.exam === "JEE" ? `Targeting JEE ${profile.variant === "ADVANCED" ? "Advanced" : "Main"}` : (profile.exam === "NEET" ? "Medical UG" : `Stream: ${profile.stream || "PCM"}`)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {([
                  { id: "MHT_CET" as ExamType, label: "MHT-CET" },
                  { id: "JEE" as ExamType, label: "JEE" },
                  { id: "NEET" as ExamType, label: "NEET" }
                ]).map((ex) => (
                  <button key={ex.id} onClick={() => {
                    setDraftExam(ex.id);
                    if (ex.id === "MHT_CET") setDraftStream("PCM");
                    if (ex.id === "JEE") setDraftVariant("MAIN");
                  }} className={`py-3 rounded-xl font-sora font-bold text-sm transition-all border ${draftExam === ex.id ? "bg-purple-600 border-purple-600 text-white shadow-md" : "glassy border-black/10 dark:border-white/10 text-on-surface-variant"}`}>
                    {ex.label}
                  </button>
                ))}
              </div>

              {draftExam === "MHT_CET" && (
                <div className="flex gap-2">
                  {(["PCM", "PCB"] as Stream[]).map((s) => (
                    <button key={s} onClick={() => setDraftStream(s)} className={`flex-1 py-2 rounded-xl font-geist font-bold text-sm transition-all border ${draftStream === s ? "bg-blue-600 border-blue-600 text-white shadow-md" : "glassy border-black/10 dark:border-white/10 text-on-surface-variant"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {draftExam === "JEE" && (
                <div className="flex gap-2">
                  {(["MAIN", "ADVANCED"] as VariantType[]).map((v) => (
                    <button key={v} onClick={() => setDraftVariant(v)} className={`flex-1 py-2 rounded-xl font-geist font-bold text-sm transition-all border ${draftVariant === v ? "bg-orange-600 border-orange-600 text-white shadow-md" : "glassy border-black/10 dark:border-white/10 text-on-surface-variant"}`}>
                      JEE {v === "ADVANCED" ? "Advanced" : "Main"}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => {
                const finalStream = draftExam === "MHT_CET" ? draftStream : null;
                const finalVariant = draftExam === "JEE" ? draftVariant : null;
                void setTargetExam(draftExam as ExamType, finalStream, finalVariant);
                setEditingExam(false);
              }} className="mt-2 w-full py-3 rounded-xl bg-green-500 text-white font-geist font-bold text-sm shadow-md">
                Confirm Change
              </button>
            </div>
          )}
        </motion.div>'''

content = stream_card_regex.sub(new_stream_card, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
