"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState, useTransition } from "react";

import {
  buildGrowthCurvePath,
  calculateDueDateFromLmp,
  createClinicalNote,
  deleteClinicalNote,
  deletePatient,
  loadPatientDetail,
  saveNeonatalRecord,
  savePregnancyRecord,
  updateClinicalNote,
  updatePatient,
  type PatientDetailResponse
} from "../clinical-data";
import { PatientDetailContent } from "./page.sections";

type PatientFormState = {
  allergies: string;
  bloodType: string;
  chronicConditions: string;
  email: string;
  fullName: string;
  notes: string;
  phone: string;
  preferredName: string;
  status: "ACTIVE" | "ARCHIVED" | "INACTIVE";
};

type PregnancyFormState = {
  complications: string;
  fetalCount: string;
  gravidity: string;
  lastMenstrualPeriod: string;
  notes: string;
  parity: string;
  previousCesareans: string;
  riskLevel: "" | "HIGH" | "LOW" | "MODERATE";
  status: "" | "ACTIVE" | "CLOSED" | "DELIVERED";
};

type NoteFormState = {
  assessment: string;
  objective: string;
  plan: string;
  subjective: string;
  title: string;
};

type NeonatalFormState = {
  apgar1: string;
  apgar5: string;
  birthWeightGrams: string;
  bornAt: string;
  newbornName: string;
  notes: string;
  outcome: "" | "ALIVE" | "ICU" | "STILLBIRTH" | "TRANSFERRED";
  sex: "" | "FEMALE" | "MALE" | "UNDETERMINED";
};

function toCsv(value: string[]) {
  return value.join(", ");
}

function fromCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function buildPatientForm(patient: PatientDetailResponse["patient"]): PatientFormState {
  return {
    allergies: toCsv(patient.allergies),
    bloodType: patient.bloodType ?? "",
    chronicConditions: toCsv(patient.chronicConditions),
    email: patient.email ?? "",
    fullName: patient.fullName,
    notes: patient.notes ?? "",
    phone: patient.phone ?? "",
    preferredName: patient.preferredName ?? "",
    status: patient.status
  };
}

function buildPregnancyForm(
  activePregnancy: PatientDetailResponse["activePregnancy"]
): PregnancyFormState {
  return {
    complications: toCsv(activePregnancy?.complications ?? []),
    fetalCount: activePregnancy?.fetalCount ? String(activePregnancy.fetalCount) : "",
    gravidity: activePregnancy?.gravidity ? String(activePregnancy.gravidity) : "",
    lastMenstrualPeriod: toDateInput(activePregnancy?.lastMenstrualPeriod ?? null),
    notes: activePregnancy?.notes ?? "",
    parity: activePregnancy?.parity ? String(activePregnancy.parity) : "",
    previousCesareans: activePregnancy?.previousCesareans
      ? String(activePregnancy.previousCesareans)
      : "",
    riskLevel: activePregnancy?.riskLevel ?? "",
    status: activePregnancy?.status ?? ""
  };
}

function buildPatientPayload(patientForm: PatientFormState) {
  return {
    allergies: fromCsv(patientForm.allergies),
    bloodType: patientForm.bloodType || undefined,
    chronicConditions: fromCsv(patientForm.chronicConditions),
    email: patientForm.email || undefined,
    fullName: patientForm.fullName,
    notes: patientForm.notes || undefined,
    phone: patientForm.phone || undefined,
    preferredName: patientForm.preferredName || undefined,
    status: patientForm.status
  };
}

function buildPregnancyPayload(pregnancyForm: PregnancyFormState) {
  return {
    complications: fromCsv(pregnancyForm.complications),
    fetalCount: pregnancyForm.fetalCount ? Number(pregnancyForm.fetalCount) : undefined,
    gravidity: pregnancyForm.gravidity ? Number(pregnancyForm.gravidity) : undefined,
    lastMenstrualPeriod: pregnancyForm.lastMenstrualPeriod || undefined,
    notes: pregnancyForm.notes || undefined,
    parity: pregnancyForm.parity ? Number(pregnancyForm.parity) : undefined,
    previousCesareans: pregnancyForm.previousCesareans
      ? Number(pregnancyForm.previousCesareans)
      : undefined,
    riskLevel: pregnancyForm.riskLevel || undefined,
    status: pregnancyForm.status || undefined
  };
}

function buildNotePayload(noteForm: NoteFormState, patientId: string) {
  return {
    assessment: noteForm.assessment || undefined,
    objective: noteForm.objective || undefined,
    patientId,
    plan: noteForm.plan || undefined,
    subjective: noteForm.subjective || undefined,
    title: noteForm.title || undefined
  };
}

function buildNeonatalPayload(neonatalForm: NeonatalFormState) {
  return {
    apgar1: neonatalForm.apgar1 ? Number(neonatalForm.apgar1) : undefined,
    apgar5: neonatalForm.apgar5 ? Number(neonatalForm.apgar5) : undefined,
    birthWeightGrams: neonatalForm.birthWeightGrams
      ? Number(neonatalForm.birthWeightGrams)
      : undefined,
    bornAt: neonatalForm.bornAt,
    newbornName: neonatalForm.newbornName || undefined,
    notes: neonatalForm.notes || undefined,
    outcome: neonatalForm.outcome || undefined,
    sex: neonatalForm.sex || undefined
  };
}

const initialNoteForm: NoteFormState = {
  assessment: "",
  objective: "",
  plan: "",
  subjective: "",
  title: ""
};

const initialNeonatalForm: NeonatalFormState = {
  apgar1: "",
  apgar5: "",
  birthWeightGrams: "",
  bornAt: "",
  newbornName: "",
  notes: "",
  outcome: "",
  sex: ""
};

export default function PatientDetailPageClient({ params }: { params: Promise<{ id: string }> }) {
  return <PatientDetailPageEnabled params={params} />;
}

function PatientDetailPageEnabled({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<PatientDetailResponse | null>(null);
  const [patientForm, setPatientForm] = useState<PatientFormState | null>(null);
  const [pregnancyForm, setPregnancyForm] = useState<PregnancyFormState | null>(null);
  const [noteForm, setNoteForm] = useState<NoteFormState>(initialNoteForm);
  const [neonatalForm, setNeonatalForm] = useState<NeonatalFormState>(initialNeonatalForm);
  const [editingNoteGroupId, setEditingNoteGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const payload = await loadPatientDetail(id);
      setDetail(payload);
      setPatientForm(buildPatientForm(payload.patient));
      setPregnancyForm(buildPregnancyForm(payload.activePregnancy));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Falha ao carregar prontuario."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  const onPatientFieldChange = (field: keyof PatientFormState, value: string) => {
    setPatientForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const onPregnancyFieldChange = (field: keyof PregnancyFormState, value: string) => {
    setPregnancyForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const onNoteFieldChange = (field: keyof NoteFormState, value: string) => {
    setNoteForm((current) => ({ ...current, [field]: value }));
  };

  const onNeonatalFieldChange = (field: keyof NeonatalFormState, value: string) => {
    setNeonatalForm((current) => ({ ...current, [field]: value }));
  };

  const submitPatient = () => {
    if (!patientForm) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await updatePatient(id, buildPatientPayload(patientForm));
          await refresh();
        } catch (saveError) {
          setError(getErrorMessage(saveError, "Falha ao salvar paciente."));
        }
      })();
    });
  };

  const submitPregnancy = () => {
    if (!pregnancyForm) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await savePregnancyRecord(
            id,
            buildPregnancyPayload(pregnancyForm),
            detail?.activePregnancy?.id
          );
          await refresh();
        } catch (saveError) {
          setError(getErrorMessage(saveError, "Falha ao salvar gestacao."));
        }
      })();
    });
  };

  const submitNote = () => {
    startTransition(() => {
      void (async () => {
        try {
          const payload = buildNotePayload(noteForm, id);
          if (editingNoteGroupId) {
            await updateClinicalNote(editingNoteGroupId, payload);
          } else {
            await createClinicalNote(payload);
          }
          setEditingNoteGroupId(null);
          setNoteForm(initialNoteForm);
          await refresh();
        } catch (saveError) {
          setError(getErrorMessage(saveError, "Falha ao salvar nota clinica."));
        }
      })();
    });
  };

  const submitNeonatal = () => {
    startTransition(() => {
      void (async () => {
        try {
          await saveNeonatalRecord(id, buildNeonatalPayload(neonatalForm));
          setNeonatalForm(initialNeonatalForm);
          await refresh();
        } catch (saveError) {
          setError(getErrorMessage(saveError, "Falha ao registrar nascimento."));
        }
      })();
    });
  };

  const removePatient = () => {
    if (!confirm("Arquivar este paciente e todos os registros clinicos vinculados?")) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deletePatient(id);
          router.push("/patients");
        } catch (deleteError) {
          setError(getErrorMessage(deleteError, "Falha ao excluir paciente."));
        }
      })();
    });
  };

  const onStartNewNote = () => {
    setEditingNoteGroupId(null);
    setNoteForm(initialNoteForm);
  };

  const onStartNoteVersion = (note: PatientDetailResponse["clinicalNotes"][number]) => {
    setEditingNoteGroupId(note.noteGroupId);
    setNoteForm({
      assessment: note.assessment ?? "",
      objective: note.objective ?? "",
      plan: note.plan ?? "",
      subjective: note.subjective ?? "",
      title: note.title ?? ""
    });
  };

  const onDeleteNote = (noteGroupId: string) => {
    startTransition(() => {
      void (async () => {
        try {
          await deleteClinicalNote(noteGroupId);
          await refresh();
        } catch (deleteError) {
          setError(getErrorMessage(deleteError, "Falha ao remover nota."));
        }
      })();
    });
  };

  const growthPath = buildGrowthCurvePath(detail?.growthCurve ?? []);
  const manualDueDate = calculateDueDateFromLmp(pregnancyForm?.lastMenstrualPeriod ?? null);

  return (
    <PatientDetailContent
      detail={detail}
      editingNoteGroupId={editingNoteGroupId}
      error={error}
      growthPath={growthPath}
      isLoading={isLoading}
      isPending={isPending}
      manualDueDate={manualDueDate}
      neonatalForm={neonatalForm}
      noteForm={noteForm}
      onDeleteNote={onDeleteNote}
      onNeonatalFieldChange={onNeonatalFieldChange}
      onNoteFieldChange={onNoteFieldChange}
      onPatientFieldChange={onPatientFieldChange}
      onPregnancyFieldChange={onPregnancyFieldChange}
      onRemovePatient={removePatient}
      onStartNewNote={onStartNewNote}
      onStartNoteVersion={onStartNoteVersion}
      onSubmitNeonatal={submitNeonatal}
      onSubmitNote={submitNote}
      onSubmitPatient={submitPatient}
      onSubmitPregnancy={submitPregnancy}
      patientForm={patientForm}
      pregnancyForm={pregnancyForm}
    />
  );
}
