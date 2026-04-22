import { createAppointmentMethods } from "./service-appointments.js";
import { createClinicalNoteMethods } from "./service-notes.js";
import { createPatientMethods } from "./service-patients.js";

export const clinicalService = {
  ...createPatientMethods(),
  ...createAppointmentMethods(),
  ...createClinicalNoteMethods()
};
