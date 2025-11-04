export interface FormData {
  patientName: string;
  dob: string;
  sex: 'Masculino' | 'Feminino' | '';
  motherName: string;
  recordNumber: string;
  originSector: string;
  bedNumber: string;
  requestedExams: string;
  clinicalIndication: string;
  requestDate: string;
}

export interface RequestDetails {
  requestedExams: string;
  clinicalIndication: string;
  requestDate: string;
}
