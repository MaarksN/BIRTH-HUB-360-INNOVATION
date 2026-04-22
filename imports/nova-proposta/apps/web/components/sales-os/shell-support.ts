import type { CSSProperties } from "react";
import {
  Activity,
  BarChart3,
  Briefcase,
  CheckSquare,
  Crown,
  Eye,
  Flame,
  Globe,
  Image as ImageIcon,
  Layers,
  LifeBuoy,
  ListPlus,
  MailCheck,
  Megaphone,
  PenTool,
  PhoneIncoming,
  ScanSearch,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  UserX,
  Users,
  Zap
} from "lucide-react";

import type {
  SalesOsModuleDefinition,
  SalesOsTool
} from "../../lib/sales-os/types";

export type SalesOsShellCopy = {
  catalogLoading: string;
  copied: string;
  copyOutput: string;
  emptySearchDescription: string;
  emptySearchTitle: string;
  emptyWorkspaceDescription: string;
  emptyWorkspaceTitle: string;
  imageBriefHint: string;
  mentorDescription: string;
  mentorGreeting: string;
  mentorInputPlaceholder: string;
  mentorTitle: string;
  micUnsupported: string;
  moduleSearchPlaceholder: string;
  noImageSelected: string;
  openMentor: string;
  outputEmpty: string;
  outputTitle: string;
  removeImage: string;
  roleplayInputPlaceholder: string;
  running: string;
  runProtocol: string;
  send: string;
  toolSearchPlaceholder: string;
  uploadImage: string;
  visionHint: string;
};

export type CatalogResponse = {
  modules: SalesOsModuleDefinition[];
  tools: SalesOsTool[];
};

const iconMap = {
  activity: Activity,
  "bar-chart": BarChart3,
  briefcase: Briefcase,
  "check-square": CheckSquare,
  crown: Crown,
  eye: Eye,
  flame: Flame,
  globe: Globe,
  image: ImageIcon,
  layers: Layers,
  "life-buoy": LifeBuoy,
  "list-plus": ListPlus,
  "mail-check": MailCheck,
  megaphone: Megaphone,
  "pen-tool": PenTool,
  "phone-incoming": PhoneIncoming,
  "scan-search": ScanSearch,
  shield: Shield,
  "shield-alert": ShieldAlert,
  target: Target,
  "user-x": UserX,
  users: Users,
  zap: Zap
} as const;

const paletteMap: Record<string, { glow: string; soft: string; solid: string }> = {
  amber: { glow: "rgba(245, 158, 11, 0.3)", soft: "rgba(245, 158, 11, 0.12)", solid: "#f59e0b" },
  blue: { glow: "rgba(59, 130, 246, 0.3)", soft: "rgba(59, 130, 246, 0.12)", solid: "#3b82f6" },
  "brand-gold": {
    glow: "rgba(245, 158, 11, 0.3)",
    soft: "rgba(245, 158, 11, 0.12)",
    solid: "#f59e0b"
  },
  cyan: { glow: "rgba(6, 182, 212, 0.3)", soft: "rgba(6, 182, 212, 0.12)", solid: "#06b6d4" },
  emerald: {
    glow: "rgba(16, 185, 129, 0.3)",
    soft: "rgba(16, 185, 129, 0.12)",
    solid: "#10b981"
  },
  green: { glow: "rgba(34, 197, 94, 0.3)", soft: "rgba(34, 197, 94, 0.12)", solid: "#22c55e" },
  indigo: {
    glow: "rgba(99, 102, 241, 0.3)",
    soft: "rgba(99, 102, 241, 0.12)",
    solid: "#6366f1"
  },
  orange: {
    glow: "rgba(249, 115, 22, 0.3)",
    soft: "rgba(249, 115, 22, 0.12)",
    solid: "#f97316"
  },
  pink: { glow: "rgba(236, 72, 153, 0.3)", soft: "rgba(236, 72, 153, 0.12)", solid: "#ec4899" },
  purple: {
    glow: "rgba(168, 85, 247, 0.3)",
    soft: "rgba(168, 85, 247, 0.12)",
    solid: "#a855f7"
  },
  red: { glow: "rgba(239, 68, 68, 0.3)", soft: "rgba(239, 68, 68, 0.12)", solid: "#ef4444" },
  rose: { glow: "rgba(244, 63, 94, 0.3)", soft: "rgba(244, 63, 94, 0.12)", solid: "#f43f5e" },
  sky: { glow: "rgba(14, 165, 233, 0.3)", soft: "rgba(14, 165, 233, 0.12)", solid: "#0ea5e9" }
};

const defaultPalette = {
  glow: "rgba(99, 102, 241, 0.3)",
  soft: "rgba(99, 102, 241, 0.12)",
  solid: "#6366f1"
};

type VoiceRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type VoiceRecognition = {
  lang: string;
  onresult: (event: VoiceRecognitionEvent) => void;
  start: () => void;
};

type RecognitionFactory = new () => VoiceRecognition;

export function resolveIcon(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap] ?? Sparkles;
}

export function accentStyle(color: string): CSSProperties {
  const palette = paletteMap[color] ?? defaultPalette;
  return {
    "--sales-glow": palette.glow,
    "--sales-soft": palette.soft,
    "--sales-solid": palette.solid
  } as CSSProperties;
}

export function buildMentorGreeting(copy: SalesOsShellCopy, moduleTitle: string) {
  return `${copy.mentorGreeting} ${moduleTitle}.`;
}

export function speakReply(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || text.length > 320) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  window.speechSynthesis.speak(utterance);
}

export async function readImageAsPayload(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.onload = () => {
      const { result } = reader;
      if (typeof result !== "string") {
        reject(new Error("Unable to read the selected file."));
        return;
      }

      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  });

  return {
    data,
    mimeType: file.type,
    name: file.name
  };
}

export function startVoiceCapture(
  onResult: (transcript: string) => void,
  copy: SalesOsShellCopy
) {
  const recognitionWindow = window as typeof window & {
    SpeechRecognition?: RecognitionFactory;
    webkitSpeechRecognition?: RecognitionFactory;
  };
  const Recognition = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;

  if (!Recognition) {
    window.alert(copy.micUnsupported);
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "pt-BR";
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? "";
    if (transcript.trim()) {
      onResult(transcript.trim());
    }
  };
  recognition.start();
}
