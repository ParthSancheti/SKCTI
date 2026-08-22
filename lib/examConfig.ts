export type ExamType = "MHT_CET" | "JEE" | "NEET";
import { type Stream } from "@/lib/types";
export type VariantType = "MAIN" | "ADVANCED";

export interface ExamDef {
  id: ExamType;
  name: string;
  hasStream: boolean;
  streams?: string[];
  hasVariant: boolean;
  variants?: VariantType[];
  subjectsByStream?: Record<string, string[]>;
  subjects?: string[];
}

export const EXAM_CONFIG: Record<ExamType, ExamDef> = {
  MHT_CET: {
    id: "MHT_CET",
    name: "MHT-CET",
    hasStream: true,
    streams: ["PCM", "PCB"],
    hasVariant: false,
    subjectsByStream: {
      PCM: ["Physics", "Chemistry", "Mathematics"],
      PCB: ["Physics", "Chemistry", "Biology"]
    }
  },
  JEE: {
    id: "JEE",
    name: "JEE",
    hasStream: false,
    hasVariant: true,
    variants: ["MAIN", "ADVANCED"],
    subjects: ["Physics", "Chemistry", "Mathematics"]
  },
  NEET: {
    id: "NEET",
    name: "NEET",
    hasStream: false,
    hasVariant: false,
    subjects: ["Physics", "Chemistry", "Biology"]
  }
};

export function getExamLabel(exam: ExamType | undefined | null, stream: Stream | undefined | null, variant: VariantType | undefined | null): string {
  if (!exam) return stream ? `MHT-CET • ${stream}` : "MHT-CET"; // legacy fallback
  const e = EXAM_CONFIG[exam];
  if (e.hasStream && stream) return `${e.name} • ${stream}`;
  if (e.hasVariant && variant) {
    if (variant === "MAIN") return `${e.name} Main`;
    if (variant === "ADVANCED") return `${e.name} Advanced`;
  }
  return e.name;
}

export function getExamSubjects(exam: ExamType | undefined | null, stream: Stream | undefined | null): string[] {
  if (!exam) exam = "MHT_CET"; // legacy fallback
  const e = EXAM_CONFIG[exam];
  if (e.hasStream && stream && e.subjectsByStream) {
    return e.subjectsByStream[stream] || e.subjectsByStream["PCM"];
  }
  return e.subjects || ["Physics", "Chemistry", "Mathematics"];
}

export function getCohortId(exam: ExamType | undefined | null, stream: Stream | undefined | null, variant: VariantType | undefined | null): string {
  if (!exam) return stream || "PCM";
  if (exam === "MHT_CET") return stream || "PCM";
  if (exam === "JEE") return variant ? `JEE_${variant}` : "JEE_MAIN";
  if (exam === "NEET") return "NEET";
  return "PCM";
}

