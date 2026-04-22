export type SalesOsModuleId =
  | "exec"
  | "presales"
  | "sales"
  | "marketing"
  | "cs"
  | "revops"
  | "data"
  | "finance"
  | "fintech"
  | "ldr"
  | "bdr"
  | "sdr"
  | "closer";

export type SalesOsFieldType = "text" | "textarea" | "select";

export interface SalesOsField {
  id: string;
  label: string;
  options?: string[];
  placeholder?: string;
  type: SalesOsFieldType;
}

export interface SalesOsTool {
  acceptsImage?: boolean;
  color: string;
  desc: string;
  emoji: string;
  fields?: SalesOsField[];
  firstMsg?: string;
  icon: string;
  id: string;
  isChat?: boolean;
  isImage?: boolean;
  modules: SalesOsModuleId[];
  name: string;
  persona?: string;
  prompt: string;
  useSearch?: boolean;
}

export interface SalesOsModuleDefinition {
  description: string;
  icon: string;
  id: SalesOsModuleId;
  subtitle: string;
  title: string;
}

export interface SalesOsChatMessage {
  role: "assistant" | "user";
  text: string;
}

export type ModuleType = SalesOsModuleId;
export type ToolField = SalesOsField;
export type Tool = SalesOsTool;

