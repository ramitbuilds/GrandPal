export type TimeOfDay = "Morning" | "Afternoon" | "Evening" | "Night";

export type DoseStatus = "PENDING" | "TAKEN" | "TAKEN_EARLY" | "TAKEN_LATE" | "MISSED";

export interface Medication {
  id: string;
  seniorId?: string;
  name: string;
  dosage: string;
  timeOfDay: TimeOfDay | string;
  instructions: string;
  color?: string;
  shape?: string;
  active?: boolean;
}

export interface DoseLog {
  id: string;
  seniorId?: string;
  medicationId: string;
  scheduledFor: string;
  takenAt?: string | null;
  status: DoseStatus | string;
  notes?: string | null;
  medication?: Medication;
}

export interface Appointment {
  id: string;
  seniorId?: string;
  title: string;
  doctor?: string;
  doctorName?: string;
  specialty?: string;
  date: string;
  location: string;
  notes?: string;
}

export interface AdaptiveMemory {
  id: string;
  seniorId?: string;
  category: string;
  keyFact: string;
  createdAt?: string;
}

export interface TriageRecord {
  id: string;
  seniorId?: string;
  reportedText: string;
  severityScore: number;
  guidance: string;
  status: string;
  createdAt: string;
}

export interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  passcodeHash: string;
  caregiverEmail: string;
  streakDays: number;
  createdAt?: string;
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments?: Appointment[];
  memories?: AdaptiveMemory[];
  triageRecords?: TriageRecord[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
