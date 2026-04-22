import { Prisma, prisma } from "@birthub/database";
import { readPrismaModel } from "../../lib/prisma-runtime.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";
export type FhirContext = {
  organizationId: string;
  tenantId: string;
  userId: string;
};
const FHIR_PATIENT_SEARCH_LIMIT = 25;
const APPOINTMENT_STATUS = {
  CANCELLED: "CANCELLED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW"
} as const;
type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];
type AppointmentType = string;
type PatientRecord = {
  birthDate: Date | null;
  bloodType: string | null;
  chronicConditions: string[];
  documentId: string | null;
  email: string | null;
  fullName: string;
  id: string;
  medicalRecordNumber: string | null;
  phone: string | null;
  preferredName: string | null;
  status: string;
  updatedAt: Date;
};
type AppointmentRecord = {
  chiefComplaint: string | null;
  durationMinutes: number;
  id: string;
  location: string | null;
  patient: {
    fullName: string;
    id: string;
    preferredName: string | null;
  } | null;
  patientId: string;
  providerName: string | null;
  scheduledAt: Date;
  status: AppointmentStatus;
  summary: string | null;
  type: AppointmentType;
  updatedAt: Date;
};
type FhirModelDelegate = {
  findFirst<TResult extends object>(args: object): Promise<TResult | null>;
  findMany<TResult extends object>(args: object): Promise<TResult[]>;
};
function toDateOnly(value: Date | null): string | undefined {
  return value ? value.toISOString().slice(0, 10) : undefined;
}
function splitHumanName(value: string): {
  family?: string;
  given?: string[];
  text: string;
} {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return {
      text: value
    };
  }
  if (parts.length === 1) {
    return {
      given: [parts[0]!],
      text: value
    };
  }
  return {
    family: parts[parts.length - 1]!,
    given: parts.slice(0, -1),
    text: value
  };
}
function mapAppointmentStatus(status: AppointmentStatus):
  | "booked"
  | "cancelled"
  | "checked-in"
  | "fulfilled"
  | "noshow" {
  switch (status) {
    case APPOINTMENT_STATUS.CANCELLED:
      return "cancelled";
    case APPOINTMENT_STATUS.CHECKED_IN:
      return "checked-in";
    case APPOINTMENT_STATUS.COMPLETED:
      return "fulfilled";
    case APPOINTMENT_STATUS.NO_SHOW:
      return "noshow";
    default:
      return "booked";
  }
}
function toPatientResource(record: PatientRecord) {
  const officialName = splitHumanName(record.fullName);
  const telecom = [
    ...(record.email
      ? [
          {
            system: "email",
            use: "home",
            value: record.email
          }
        ]
      : []),
    ...(record.phone
      ? [
          {
            system: "phone",
            use: "mobile",
            value: record.phone
          }
        ]
      : [])
  ];
  const identifiers = [
    ...(record.medicalRecordNumber
      ? [
          {
            system: "urn:birthhub360:mrn",
            value: record.medicalRecordNumber
          }
        ]
      : []),
    ...(record.documentId
      ? [
          {
            system: "urn:birthhub360:document-id",
            value: record.documentId
          }
        ]
      : [])
  ];
  return {
    active: record.status === "ACTIVE",
    extension: [
      ...(record.bloodType
        ? [
            {
              url: "urn:birthhub360:patient:blood-type",
              valueString: record.bloodType
            }
          ]
        : []),
      ...(record.chronicConditions.length > 0
        ? [
            {
              url: "urn:birthhub360:patient:chronic-conditions",
              valueString: record.chronicConditions.join(", ")
            }
          ]
        : [])
    ],
    id: record.id,
    identifier: identifiers,
    meta: {
      lastUpdated: record.updatedAt.toISOString(),
      profile: ["http://hl7.org/fhir/StructureDefinition/Patient"]
    },
    name: [
      officialName,
      ...(record.preferredName
        ? [
            {
              text: record.preferredName,
              use: "usual"
            }
          ]
        : [])
    ],
    resourceType: "Patient",
    telecom,
    birthDate: toDateOnly(record.birthDate)
  };
}
function toAppointmentResource(record: AppointmentRecord) {
  return {
    description: record.summary ?? record.chiefComplaint ?? undefined,
    end: new Date(record.scheduledAt.getTime() + record.durationMinutes * 60_000).toISOString(),
    id: record.id,
    meta: {
      lastUpdated: record.updatedAt.toISOString(),
      profile: ["http://hl7.org/fhir/StructureDefinition/Appointment"]
    },
    participant: [
      {
        actor: {
          display: record.patient?.preferredName ?? record.patient?.fullName ?? record.patientId,
          reference: `Patient/${record.patient?.id ?? record.patientId}`
        },
        required: "required",
        status: "accepted"
      },
      ...(record.providerName
        ? [
            {
              actor: {
                display: record.providerName
              },
              required: "optional",
              status: "accepted"
            }
          ]
        : [])
    ],
    resourceType: "Appointment",
    serviceType: [
      {
        coding: [
          {
            code: record.type,
            display: record.type.toLowerCase().replaceAll("_", " "),
            system: "urn:birthhub360:appointment-type"
          }
        ]
      }
    ],
    start: record.scheduledAt.toISOString(),
    status: mapAppointmentStatus(record.status),
    supportingInformation: record.location
      ? [
          {
            display: record.location
          }
        ]
      : undefined
  };
}
function toBundle(baseUrl: string, resourceType: "Appointment" | "Patient", items: object[]) {
  return {
    entry: items.map((resource) => ({
      fullUrl: `${baseUrl}/${resourceType}/${String((resource as { id?: string }).id ?? "")}`,
      resource,
      search: {
        mode: "match"
      }
    })),
    resourceType: "Bundle",
    total: items.length,
    type: "searchset"
  };
}
function readFhirModel(name: "appointment" | "patient"): FhirModelDelegate {
  return readPrismaModel<FhirModelDelegate>(prisma, name, "the FHIR facade");
}
export const fhirService = {
  metadata(baseUrl: string) {
    return {
      date: new Date().toISOString(),
      fhirVersion: "4.0.1",
      format: ["application/fhir+json", "json"],
      implementation: {
        description: "BirthHub 360 FHIR R4 facade",
        url: baseUrl
      },
      kind: "instance",
      resourceType: "CapabilityStatement",
      rest: [
        {
          mode: "server",
          resource: [
            {
              interaction: [
                {
                  code: "read"
                },
                {
                  code: "search-type"
                }
              ],
              searchParam: [
                {
                  name: "identifier",
                  type: "token"
                },
                {
                  name: "name",
                  type: "string"
                }
              ],
              type: "Patient"
            },
            {
              interaction: [
                {
                  code: "read"
                }
              ],
              type: "Appointment"
            }
          ],
          security: {
            cors: false,
            description: "Authenticated session required.",
            service: [
              {
                coding: [
                  {
                    code: "SMART-on-FHIR",
                    display: "BirthHub session authentication",
                    system: "http://terminology.hl7.org/CodeSystem/restful-security-service"
                  }
                ]
              }
            ]
          }
        }
      ],
      software: {
        name: "BirthHub 360",
        version: "1.0.0"
      },
      status: "active"
    };
  },
  async getPatient(context: FhirContext, patientId: string) {
    const patientModel = readFhirModel("patient");
    const patient = await patientModel.findFirst<PatientRecord>({
      select: {
        birthDate: true,
        bloodType: true,
        chronicConditions: true,
        documentId: true,
        email: true,
        fullName: true,
        id: true,
        medicalRecordNumber: true,
        phone: true,
        preferredName: true,
        status: true,
        updatedAt: true
      },
      where: {
        deletedAt: null,
        id: patientId,
        organizationId: context.organizationId,
        tenantId: context.tenantId
      }
    });
    if (!patient) {
      throw new ProblemDetailsError({
        detail: "Patient was not found for the active tenant.",
        status: 404,
        title: "Not Found"
      });
    }
    return toPatientResource(patient);
  },
  async searchPatients(
    context: FhirContext,
    filters: {
      identifier?: string;
      name?: string;
    },
    baseUrl: string
  ) {
    const normalizedIdentifier = filters.identifier?.trim();
    const normalizedName = filters.name?.trim();
    const searchFilters: object[] = [];
    if (!normalizedIdentifier && !normalizedName) {
      throw new ProblemDetailsError({
        detail: "At least one FHIR search parameter is required.",
        status: 400,
        title: "Bad Request"
      });
    }
    if (normalizedIdentifier) {
      searchFilters.push(
        {
          medicalRecordNumber: normalizedIdentifier
        },
        {
          documentId: normalizedIdentifier
        }
      );
    }
    if (normalizedName) {
      searchFilters.push(
        {
          fullName: {
            contains: normalizedName,
            mode: Prisma.QueryMode.insensitive
          }
        },
        {
          preferredName: {
            contains: normalizedName,
            mode: Prisma.QueryMode.insensitive
          }
        }
      );
    }
    const patientModel = readFhirModel("patient");
    const items = await patientModel.findMany<PatientRecord>({
      orderBy: {
        updatedAt: "desc"
      },
      take: FHIR_PATIENT_SEARCH_LIMIT,
      select: {
        birthDate: true,
        bloodType: true,
        chronicConditions: true,
        documentId: true,
        email: true,
        fullName: true,
        id: true,
        medicalRecordNumber: true,
        phone: true,
        preferredName: true,
        status: true,
        updatedAt: true
      },
      where: {
        deletedAt: null,
        organizationId: context.organizationId,
        tenantId: context.tenantId,
        OR: searchFilters
      }
    });
    return toBundle(
      baseUrl,
      "Patient",
      items.map((item) => toPatientResource(item))
    );
  },
  async getAppointment(context: FhirContext, appointmentId: string) {
    const appointmentModel = readFhirModel("appointment");
    const appointment = await appointmentModel.findFirst<AppointmentRecord>({
      select: {
        chiefComplaint: true,
        durationMinutes: true,
        id: true,
        location: true,
        patient: {
          select: {
            fullName: true,
            id: true,
            preferredName: true
          }
        },
        patientId: true,
        providerName: true,
        scheduledAt: true,
        status: true,
        summary: true,
        type: true,
        updatedAt: true
      },
      where: {
        deletedAt: null,
        id: appointmentId,
        organizationId: context.organizationId,
        patient: {
          deletedAt: null
        },
        tenantId: context.tenantId
      }
    });
    if (!appointment) {
      throw new ProblemDetailsError({
        detail: "Appointment was not found for the active tenant.",
        status: 404,
        title: "Not Found"
      });
    }
    return toAppointmentResource(appointment);
  }
};
