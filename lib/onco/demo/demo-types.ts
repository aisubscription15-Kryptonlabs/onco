export type DemoRole = "patient" | "doctor" | "care-team" | "admin" | "app-provider";

export type CancerType =
  | "Colon cancer"
  | "Breast cancer"
  | "Prostate cancer"
  | "Lung cancer"
  | "Lymphoma"
  | "Ovarian cancer"
  | "Other";

export type TreatmentStatus =
  | "Before treatment"
  | "In active treatment"
  | "Active treatment"
  | "Finished treatment"
  | "Surveillance";

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type DemoToastTone = "success" | "info" | "warning";

export type DemoUser = {
  id: string;
  name: string;
  role: DemoRole;
  title: string;
};

export type DemoSite = {
  id: string;
  name: string;
  city: string;
  status: "Active" | "Pending" | "Paused";
  inviteCode: string;
};

export type DemoPatient = {
  id: string;
  name: string;
  cancerType: CancerType;
  treatmentStatus: TreatmentStatus;
  phase: "Phase 1" | "Phase 2" | "Maintenance";
  adherence: number;
  activeDays: number;
  prescriptionStatus: "active" | "low-adherence" | "high-adherence" | "alert" | "pending-approval";
  flags: string[];
  prescription: {
    activity: "Walking" | "Cycling" | "Strength" | "Gardening";
    minutes: number;
    daysPerWeek: number;
    intensity: "Easy" | "Easy-to-moderate" | "Moderate";
    metHours: number;
  };
};

export type DemoAlert = {
  id: string;
  patientId: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  status: "open" | "acknowledged" | "resolved";
};

export type DemoPrompt = {
  id: string;
  name: string;
  version: string;
  status: "Draft" | "Live" | "Archived";
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Doctor" | "Care Team" | "Site Admin";
  specialty: string;
  status: "Active" | "Invited" | "Inactive";
};

export type ProgramSession = {
  id: string;
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  talkingPoints: string;
  active: boolean;
};

export type MetCatalogItem = {
  id: string;
  activity: string;
  type: string;
  intensity: string;
  met: number;
  active: boolean;
};

export type PromptRegistryItem = {
  id: string;
  key: string;
  agentType: "Artie chat" | "Safety triage" | "Prescription generation" | "Doctor summary" | "Adherence reflection";
  version: string;
  model: string;
  active: boolean;
  lastUpdated: string;
};

export type SiteRequest = {
  id: string;
  siteName: string;
  adminName: string;
  adminEmail: string;
  cityState: string;
  status: "Pending review" | "Approved" | "Rejected";
  inviteCode: string;
  rejectionReason?: string;
};

export type PlatformSite = {
  id: string;
  name: string;
  admin: string;
  patients: number;
  doctors: number;
  status: "Active" | "Pending" | "Suspended";
  createdDate: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  status: "Success" | "Warning" | "Failed";
  site: string;
};

export type OnboardingAnswers = {
  cancerType: CancerType;
  treatmentStatus: TreatmentStatus;
  treatments: string[];
  previousActivity: string;
  currentCapacity: string;
  weeklyWalkingMinutes: string;
  weeklyOtherActivityMinutes: string;
  baselineIntensity: "Mostly light" | "Some moderate" | "Hard exercise sometimes";
  averageDailySteps: string;
  sixMinuteWalk: string;
  useFirstWeekAsBaseline: boolean;
  redFlags: string[];
  preferences: string[];
  preferenceChips: string[];
  barriers: string[];
  environment: Record<string, boolean>;
  environmentZipCode: string;
  selectedTrailId: string;
  supportPerson: {
    name: string;
    relationship: string;
    contact: string;
    supportType: string;
    invitePending: boolean;
  } | null;
  goalAnchor: string;
  trackingType: TrackingType;
};

export type TrackingType = "Apple Health" | "Google Fit" | "Garmin" | "Fitbit" | "Manual";

export type PatientPlan = {
  activity: "Walking" | "Gardening" | "Cycling" | "Swimming" | "Strength";
  minutes: number;
  daysPerWeek: number;
  intensity: "Easy" | "Easy-to-moderate" | "Moderate";
  metHours: number;
  adaptations: string[];
};

export type ActivityLog = {
  id: string;
  dateLabel: string;
  activity: string;
  duration: number;
  paceFeel: string;
  symptoms: boolean;
  metHours: number;
};

export type ChatMessage = {
  id: string;
  sender: "user" | "artie";
  text: string;
  patientKey?: string;
};

export type PatientProfile = {
  name: string;
  email: string;
  phone: string;
  birthYear: number;
  careTeam: string;
  careTeamCode: string | null;
  careCodeLinked: boolean;
  emailVerified: boolean;
  inviteCodeType: "none" | "clinic" | "patient_invite";
  inviteVerified: boolean;
  prefilledFromClinic: boolean;
  assignedDoctor: string | null;
  siteId: string | null;
  selfStarted: boolean;
  onboardingStartMode: "self" | "clinic_code" | "patient_invite";
  siteName: string | null;
};

export type PatientIdentity = {
  firstName: string;
  contact: string;
  birthYear: string;
};

export type AcceptedCareCode = {
  code: string;
  patientProfile: PatientProfile;
  patientIdentity: PatientIdentity | null;
  onboarding: OnboardingAnswers;
  patientPlan: PatientPlan;
  activityLogs: ActivityLog[];
  completedSessions: number[];
  sessionProgress: Record<string, number>;
  createdAt: string;
};

export type ConnectedDevice = {
  id: string;
  name: TrackingType;
  connected: boolean;
  lastSync: string | null;
};

export type SymptomReport = {
  id: string;
  symptom: string;
  redFlag: boolean;
  createdAt: string;
};

export type PatientNotification = {
  id: string;
  type: "reminder" | "session" | "celebration" | "safety" | "streak" | "device";
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
};

export type DoctorSummaryState = {
  lastGeneratedAt: string;
  copiedToMyChart: boolean;
  shared: boolean;
  reviewRequest: {
    patientName: string;
    patientEmail: string;
    doctorName: string;
    clinicName: string;
    context: string;
    baseline: string;
    preferences: string;
    barriers: string;
    prescription: string;
    status: "not-shared" | "waiting-review" | "reviewed";
    sharedAt: string | null;
  } | null;
};

export type DemoState = {
  role: DemoRole | null;
  userId: string | null;
  selectedPatientId: string;
  users: DemoUser[];
  site: DemoSite;
  patients: DemoPatient[];
  alerts: DemoAlert[];
  prompts: DemoPrompt[];
  teamMembers: TeamMember[];
  programSessions: ProgramSession[];
  metCatalog: MetCatalogItem[];
  promptRegistry: PromptRegistryItem[];
  siteRequests: SiteRequest[];
  platformSites: PlatformSite[];
  auditEvents: AuditEvent[];
  onboarding: OnboardingAnswers;
  patientProfile: PatientProfile;
  patientPlan: PatientPlan;
  connectedDevices: ConnectedDevice[];
  activityLogs: ActivityLog[];
  symptomReports: SymptomReport[];
  chatMessages: ChatMessage[];
  notifications: PatientNotification[];
  doctorSummary: DoctorSummaryState;
  onboardingMode: "none" | "self_start" | "care_code";
  careCode: string;
  generatedCareCode: string | null;
  acceptedCareCodes: AcceptedCareCode[];
  patientIdentity: PatientIdentity | null;
  completedOnboarding: boolean;
  completedSessions: number[];
  sessionProgress: Record<string, number>;
  safetyPaused: boolean;
  toast: { id: number; message: string; tone: DemoToastTone } | null;
};
