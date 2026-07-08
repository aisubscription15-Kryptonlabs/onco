"use client";

import { useEffect, useSyncExternalStore } from "react";
import { initialDemoState } from "./demo-data";
import type {
  ActivityLog,
  AuditEvent,
  ChatMessage,
  ConnectedDevice,
  DemoRole,
  DemoState,
  DemoToastTone,
  OnboardingAnswers,
  PatientPlan,
  PatientNotification,
  ProgramSession,
  SymptomReport,
  TrackingType,
  TeamMember,
  MetCatalogItem,
  PromptRegistryItem,
  SiteRequest,
  PlatformSite,
} from "./demo-types";

const STORAGE_KEY = "oncomotionrx-demo-state";

let state: DemoState = initialDemoState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, toast: null }));
  }
}

function setState(updater: (current: DemoState) => DemoState) {
  state = updater(state);
  emit();
}

function nowLabel() {
  return "Just now";
}

function estimateBaselineMetHours(answers: OnboardingAnswers) {
  const walkingMinutes = Number(answers.weeklyWalkingMinutes) || 0;
  const otherMinutes = Number(answers.weeklyOtherActivityMinutes) || 0;
  const intensityMet = answers.baselineIntensity === "Hard exercise sometimes" ? 4 : answers.baselineIntensity === "Some moderate" ? 3.3 : 2.3;
  return Number((((walkingMinutes * 2.5) + (otherMinutes * intensityMet)) / 60).toFixed(1));
}

function cleanOnboardingAnswers(): OnboardingAnswers {
  return {
    cancerType: "Other",
    treatmentStatus: "Before treatment",
    treatments: [],
    previousActivity: "",
    currentCapacity: "",
    weeklyWalkingMinutes: "",
    weeklyOtherActivityMinutes: "",
    baselineIntensity: "Mostly light",
    averageDailySteps: "",
    sixMinuteWalk: "",
    useFirstWeekAsBaseline: true,
    redFlags: [],
    preferences: [],
    preferenceChips: [],
    barriers: [],
    environment: {
      "Sidewalks nearby": false,
      "Safe walking area": false,
      "Bathrooms on route": false,
      "Gym/community center access": false,
      "Indoor movement space": false,
    },
    environmentZipCode: "",
    selectedTrailId: "",
    supportPerson: null,
    goalAnchor: "Rebuild stamina for gardening and errands.",
    trackingType: "Manual",
  };
}

function generateSelfStartCareTeam(identity: DemoState["patientIdentity"], current: DemoState) {
  const first = (identity?.firstName || current.patientProfile.name || "Patient").trim().split(/\s+/)[0] || "Patient";
  const prefix = first.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "OMR";
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const careTeamCode = `${prefix}-TEAM-${digits}`;
  return {
    careTeam: current.site.name,
    careTeamCode,
    siteId: current.site.id,
    siteName: current.site.name,
  };
}

function notification(
  type: PatientNotification["type"],
  title: string,
  detail: string,
): PatientNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    detail,
    createdAt: nowLabel(),
    read: false,
  };
}

function activeCareCode(current: DemoState) {
  return current.careCode || current.generatedCareCode || null;
}

function patientProfileWithIdentityContact(current: DemoState) {
  const identityContact = current.patientIdentity?.contact?.trim() || "";
  const identityEmail = identityContact.includes("@") ? identityContact : "";
  const identityPhone = identityContact && !identityContact.includes("@") ? identityContact : "";
  return {
    ...current.patientProfile,
    name: current.patientProfile.name || current.patientIdentity?.firstName || "",
    email: current.patientProfile.email || identityEmail,
    phone: current.patientProfile.phone || identityPhone,
    birthYear: current.patientProfile.birthYear || Number(current.patientIdentity?.birthYear) || new Date().getFullYear() - 50,
  };
}

function syncCareCodeSnapshot(current: DemoState) {
  const code = activeCareCode(current);
  if (!code || code === "SAM-GVOC-7429") return current.acceptedCareCodes;
  const snapshot = {
    code,
    patientProfile: patientProfileWithIdentityContact(current),
    patientIdentity: current.patientIdentity ? { ...current.patientIdentity } : null,
    onboarding: { ...current.onboarding },
    patientPlan: { ...current.patientPlan, adaptations: [...current.patientPlan.adaptations] },
    activityLogs: current.activityLogs.map((log) => ({ ...log })),
    completedSessions: [...current.completedSessions],
    sessionProgress: { ...current.sessionProgress },
    createdAt: nowLabel(),
  };
  const exists = current.acceptedCareCodes.some((item) => item.code === code);
  return exists
    ? current.acceptedCareCodes.map((item) => (item.code === code ? snapshot : item))
    : [snapshot, ...current.acceptedCareCodes];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return initialDemoState;
}

export function hydrateDemoState() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    state = {
      ...initialDemoState,
      ...parsed,
      onboarding: { ...initialDemoState.onboarding, ...parsed.onboarding },
      patientProfile: { ...initialDemoState.patientProfile, ...parsed.patientProfile },
      doctorSummary: { ...initialDemoState.doctorSummary, ...parsed.doctorSummary },
      acceptedCareCodes: parsed.acceptedCareCodes || [],
      toast: null,
    };
    emit();
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function useDemoStore() {
  useEffect(() => {
    hydrateDemoState();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const demoStore = {
  getState: () => state,
  get activeRole() {
    return state.role;
  },
  get activeUser() {
    return state.users.find((user) => user.id === state.userId) || null;
  },
  get activePatient() {
    return state.patients.find((patient) => patient.id === state.selectedPatientId) || null;
  },
  get activeSite() {
    return state.site;
  },
  login(role: DemoRole, userId: string) {
    setState((current) => ({ ...current, role, userId }));
  },
  logout() {
    setState((current) => ({ ...current, role: null, userId: null }));
  },
  preparePatientProgram() {
    setState((current) => ({
      ...current,
      role: null,
      userId: null,
      onboardingMode: "none",
      careCode: "",
      generatedCareCode: null,
      patientProfile: {
        ...current.patientProfile,
        careCodeLinked: false,
        inviteCodeType: "none",
        inviteVerified: false,
        prefilledFromClinic: false,
        assignedDoctor: "Dr. Maya Chen",
        siteId: null,
        siteName: null,
        careTeam: "",
        careTeamCode: null,
        selfStarted: false,
        onboardingStartMode: "self",
      },
    }));
  },
  reset() {
    state = { ...initialDemoState, toast: { id: Date.now(), message: "Demo data reset", tone: "success" } };
    emit();
  },
  selectPatient(patientId: string) {
    setState((current) => ({ ...current, selectedPatientId: patientId }));
  },
  toast(message: string, tone: DemoToastTone = "success") {
    setState((current) => ({ ...current, toast: { id: Date.now(), message, tone } }));
  },
  updatePatient(patientId: string, patch: Partial<DemoState["patients"][number]>) {
    setState((current) => ({
      ...current,
      patients: current.patients.map((patient) =>
        patient.id === patientId ? { ...patient, ...patch } : patient,
      ),
    }));
  },
  updatePrescription(patientId: string, prescription: DemoState["patients"][number]["prescription"], status: DemoState["patients"][number]["prescriptionStatus"] = "pending-approval") {
    setState((current) => ({
      ...current,
      patients: current.patients.map((patient) =>
        patient.id === patientId ? { ...patient, prescription, prescriptionStatus: status } : patient,
      ),
    }));
  },
  updateSiteStatus(status: DemoState["site"]["status"]) {
    setState((current) => ({ ...current, site: { ...current.site, status } }));
  },
  updateAlert(alertId: string, status: DemoState["alerts"][number]["status"]) {
    setState((current) => ({
      ...current,
      alerts: current.alerts.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)),
    }));
  },
  updateOnboarding(patch: Partial<OnboardingAnswers>) {
    setState((current) => {
      const next = { ...current, onboarding: { ...current.onboarding, ...patch } };
      return { ...next, acceptedCareCodes: syncCareCodeSnapshot(next) };
    });
  },
  linkCareTeamCode() {
    setState((current) => ({
      ...current,
      patientProfile: { ...current.patientProfile, careCodeLinked: true, careTeam: current.site.name, careTeamCode: current.site.id.toUpperCase() },
      notifications: [
        notification("reminder", "Care team linked", `Your plan is connected to ${current.site.name}.`),
        ...current.notifications,
      ],
      toast: { id: Date.now(), message: `Linked to ${current.site.name}`, tone: "success" },
    }));
  },
  beginSelfStart() {
    setState((current) => ({
      ...current,
      onboardingMode: "self_start",
      onboarding: cleanOnboardingAnswers(),
      careCode: "",
      generatedCareCode: null,
      patientIdentity: null,
      patientProfile: {
        ...current.patientProfile,
        name: "",
        email: "",
        phone: "",
        birthYear: new Date().getFullYear() - 50,
        careCodeLinked: false,
        inviteCodeType: "none",
        inviteVerified: false,
        prefilledFromClinic: false,
        assignedDoctor: "Dr. Maya Chen",
        siteId: null,
        siteName: null,
        careTeam: "",
        careTeamCode: null,
        selfStarted: true,
        onboardingStartMode: "self",
      },
    }));
  },
  saveSelfStartIdentity(identity: DemoState["patientIdentity"]) {
    if (!identity) return;
    setState((current) => {
      const careTeam = current.patientProfile.careTeamCode ? {
        careTeam: current.patientProfile.careTeam,
        careTeamCode: current.patientProfile.careTeamCode,
        siteId: current.patientProfile.siteId,
        siteName: current.patientProfile.siteName,
      } : generateSelfStartCareTeam(identity, current);
      return {
        ...current,
        patientIdentity: identity,
        patientProfile: {
          ...current.patientProfile,
          name: identity.firstName || current.patientProfile.name,
          email: identity.contact.includes("@") ? identity.contact : current.patientProfile.email,
          phone: identity.contact.includes("@") ? current.patientProfile.phone : identity.contact,
          birthYear: identity.birthYear ? Number(identity.birthYear) : current.patientProfile.birthYear,
          careTeam: careTeam.careTeam,
          careTeamCode: careTeam.careTeamCode,
          siteId: careTeam.siteId,
          siteName: careTeam.siteName,
          assignedDoctor: "Dr. Maya Chen",
        },
        notifications: [
          notification("reminder", "Care team generated", `${careTeam.careTeam} was assigned to this signup.`),
          ...current.notifications,
        ],
        toast: { id: Date.now(), message: "Identity saved and care team generated", tone: "success" },
      };
    });
  },
  generateCareCode() {
    const first = (state.patientIdentity?.firstName || state.patientProfile.name || "SAM").trim().split(/\s+/)[0] || "SAM";
    const prefix = first.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "SAM";
    const clinicCode = (state.site.id || "GVOC").toUpperCase().replace(/[^A-Z0-9]/g, "") || "GVOC";
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    const generatedCareCode = `${prefix}-${clinicCode}-${digits}`;
    setState((current) => ({
      ...current,
      generatedCareCode,
      acceptedCareCodes: [
        {
          code: generatedCareCode,
          patientProfile: patientProfileWithIdentityContact(current),
          patientIdentity: current.patientIdentity ? { ...current.patientIdentity } : null,
          onboarding: { ...current.onboarding },
          patientPlan: { ...current.patientPlan, adaptations: [...current.patientPlan.adaptations] },
          activityLogs: current.activityLogs.map((log) => ({ ...log })),
          completedSessions: [...current.completedSessions],
          sessionProgress: { ...current.sessionProgress },
          createdAt: nowLabel(),
        },
        ...current.acceptedCareCodes.filter((item) => item.code !== generatedCareCode),
      ],
      completedOnboarding: true,
      toast: { id: Date.now(), message: "Care Code generated", tone: "success" },
    }));
    return generatedCareCode;
  },
  completeLinkedPatientOnboarding() {
    setState((current) => ({
      ...current,
      generatedCareCode: null,
      completedOnboarding: true,
      toast: { id: Date.now(), message: "Clinic-linked program ready", tone: "success" },
    }));
  },
  beginCareCode() {
    setState((current) => ({
      ...current,
      onboardingMode: "care_code",
      careCode: "",
      patientProfile: {
        ...current.patientProfile,
        inviteCodeType: "none",
        inviteVerified: false,
        prefilledFromClinic: false,
        onboardingStartMode: "patient_invite",
      },
    }));
  },
  submitCareCode(code: string) {
    const normalized = code
      .trim()
      .toUpperCase()
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, "");
    const generatedMatch = state.acceptedCareCodes.find((item) => item.code.toUpperCase() === normalized);
    const currentGeneratedMatches = state.generatedCareCode?.toUpperCase() === normalized;
    const generatedPattern = normalized.match(/^([A-Z]{2,})-([A-Z0-9]+)-(\d{4})$/);
    const generatedPatternMatches = Boolean(
      generatedPattern &&
      generatedPattern[2] === state.site.id.toUpperCase() &&
      normalized !== "SAM-GVOC-7429",
    );
    const fallbackName = generatedPattern?.[1]?.toLowerCase() || "patient";
    const fallbackContact = state.generatedCareCode?.toUpperCase() === normalized && state.patientIdentity?.contact.includes("@")
      ? state.patientIdentity.contact
      : "";
    const fallbackGeneratedProfile = {
      ...state.patientProfile,
      name: fallbackName,
      email: fallbackContact,
      phone: state.generatedCareCode?.toUpperCase() === normalized && state.patientIdentity?.contact && !state.patientIdentity.contact.includes("@")
        ? state.patientIdentity.contact
        : "",
      careTeam: state.site.name,
      careTeamCode: state.site.id.toUpperCase(),
      siteId: state.site.id,
      siteName: state.site.name,
      assignedDoctor: "Dr. Maya Chen",
      selfStarted: true,
    };
    const sampleInviteProfile = {
      ...state.patientProfile,
      name: "Sam Rivera",
      email: "sam.rivera@example.com",
      phone: "(512) 555-0198",
      birthYear: 1974,
      careTeam: state.site.name,
      careTeamCode: state.site.id.toUpperCase(),
      siteId: state.site.id,
      siteName: state.site.name,
      assignedDoctor: "Dr. Maya Chen",
      selfStarted: false,
    };
    const matchedProfile = normalized === "SAM-GVOC-7429"
      ? sampleInviteProfile
      : generatedMatch?.patientProfile || (generatedPatternMatches ? fallbackGeneratedProfile : state.patientProfile);
    const matchedIdentityContact = generatedMatch?.patientIdentity?.contact || "";
    const correctedMatchedEmail = normalized !== "SAM-GVOC-7429" && (matchedProfile.email === sampleInviteProfile.email || !matchedProfile.email)
      ? (matchedIdentityContact.includes("@") ? matchedIdentityContact : matchedProfile.email === sampleInviteProfile.email ? "" : matchedProfile.email)
      : matchedProfile.email;
    const normalizedMatchedProfile = {
      ...matchedProfile,
      email: correctedMatchedEmail,
      careTeam: matchedProfile.careTeam?.startsWith("OncoMotionRx Care Team") ? state.site.name : matchedProfile.careTeam,
      siteId: matchedProfile.siteId?.startsWith("self-") ? state.site.id : matchedProfile.siteId,
      siteName: matchedProfile.siteName?.startsWith("OncoMotionRx Care Team") ? state.site.name : matchedProfile.siteName,
    };
    const matchedOnboarding = normalized === "SAM-GVOC-7429"
      ? initialDemoState.onboarding
      : generatedMatch?.onboarding || (generatedPatternMatches ? cleanOnboardingAnswers() : state.onboarding);
    const matchedPlan = generatedMatch?.patientPlan || state.patientPlan;
    const matchedActivityLogs = normalized === "SAM-GVOC-7429"
      ? initialDemoState.activityLogs
      : generatedMatch?.activityLogs || [];
    const matchedCompletedSessions = normalized === "SAM-GVOC-7429"
      ? initialDemoState.completedSessions
      : generatedMatch?.completedSessions || [];
    const matchedSessionProgress = normalized === "SAM-GVOC-7429"
      ? initialDemoState.sessionProgress
      : generatedMatch?.sessionProgress || {};
    if (normalized !== "SAM-GVOC-7429" && !generatedMatch && !currentGeneratedMatches && !generatedPatternMatches) {
      return false;
    }
    setState((current) => ({
      ...current,
      onboardingMode: "care_code",
      onboarding: { ...matchedOnboarding },
      patientPlan: { ...matchedPlan, adaptations: [...matchedPlan.adaptations] },
      activityLogs: matchedActivityLogs.map((log) => ({ ...log })),
      completedSessions: [...matchedCompletedSessions],
      sessionProgress: { ...matchedSessionProgress },
      careCode: normalized,
      generatedCareCode: current.generatedCareCode?.toUpperCase() === normalized ? current.generatedCareCode : null,
      patientIdentity: generatedMatch?.patientIdentity || (generatedPatternMatches ? { firstName: fallbackName, contact: fallbackGeneratedProfile.email || fallbackGeneratedProfile.phone, birthYear: "" } : current.patientIdentity),
      patientProfile: {
        ...normalizedMatchedProfile,
        inviteCodeType: "patient_invite",
        inviteVerified: false,
        prefilledFromClinic: normalized === "SAM-GVOC-7429",
        assignedDoctor: normalizedMatchedProfile.assignedDoctor,
        siteId: normalizedMatchedProfile.siteId || current.site.id,
        siteName: normalizedMatchedProfile.siteName || current.site.name,
        careTeam: normalizedMatchedProfile.careTeam || current.site.name,
        careTeamCode: normalizedMatchedProfile.careTeamCode || current.site.id.toUpperCase(),
        careCodeLinked: true,
        selfStarted: generatedMatch?.patientProfile.selfStarted ?? (generatedPatternMatches || currentGeneratedMatches ? current.patientProfile.selfStarted || generatedPatternMatches : false),
        onboardingStartMode: "patient_invite",
      },
      toast: { id: Date.now(), message: "Care Code found", tone: "info" },
    }));
    return true;
  },
  verifyCareCode(value: string) {
    const generatedMatch = state.acceptedCareCodes.find((item) => item.code.toUpperCase() === state.careCode);
    const generatedPattern = state.careCode.match(/^([A-Z]{2,})-([A-Z0-9]+)-(\d{4})$/);
    const isFallbackGeneratedCode = Boolean(
      !generatedMatch &&
      generatedPattern &&
      generatedPattern[2] === state.site.id.toUpperCase() &&
      state.careCode !== "SAM-GVOC-7429",
    );
    if (isFallbackGeneratedCode) {
      if (!/^\d{4}$/.test(value.trim())) return false;
      setState((current) => {
        const next = {
          ...current,
          patientIdentity: current.patientIdentity ? { ...current.patientIdentity, birthYear: value.trim() } : current.patientIdentity,
          patientProfile: {
            ...current.patientProfile,
            birthYear: Number(value.trim()),
            inviteVerified: true,
            emailVerified: true,
          },
          toast: { id: Date.now(), message: "Care Code verified", tone: "success" as const },
        };
        return { ...next, acceptedCareCodes: syncCareCodeSnapshot(next) };
      });
      return true;
    }
    const expectedBirthYear = String(state.patientProfile.birthYear || 1974);
    if (value.trim() !== expectedBirthYear) {
      return false;
    }
    setState((current) => {
      const next = {
        ...current,
        patientProfile: {
          ...current.patientProfile,
          inviteVerified: true,
          emailVerified: true,
        },
        toast: { id: Date.now(), message: "Care Code verified", tone: "success" as const },
      };
      return { ...next, acceptedCareCodes: syncCareCodeSnapshot(next) };
    });
    return true;
  },
  confirmClinicProfile() {
    setState((current) => {
      const isSampleInvite = current.careCode === "SAM-GVOC-7429";
      const next: DemoState = {
        ...current,
        onboardingMode: "care_code",
        generatedCareCode: null,
        patientProfile: {
          ...current.patientProfile,
          name: current.patientProfile.name || current.patientIdentity?.firstName || "Patient",
          email: current.patientProfile.email || current.patientIdentity?.contact || "",
          birthYear: current.patientProfile.birthYear || Number(current.patientIdentity?.birthYear) || 1974,
          inviteCodeType: "patient_invite",
          inviteVerified: true,
          prefilledFromClinic: isSampleInvite,
          assignedDoctor: current.patientProfile.assignedDoctor || "Dr. Maya Chen",
          siteId: current.patientProfile.siteId || (isSampleInvite ? current.site.id : null),
          siteName: current.patientProfile.siteName || (isSampleInvite ? current.site.name : null),
          careTeam: current.patientProfile.careTeam || (isSampleInvite ? current.site.name : ""),
          careTeamCode: current.patientProfile.careTeamCode || (isSampleInvite ? current.site.id.toUpperCase() : null),
          careCodeLinked: true,
          selfStarted: !isSampleInvite && current.patientProfile.selfStarted,
          onboardingStartMode: "patient_invite",
        },
        toast: { id: Date.now(), message: "Clinic profile confirmed", tone: "success" },
      };
      return { ...next, acceptedCareCodes: syncCareCodeSnapshot(next) };
    });
  },
  continueExistingPatient() {
    setState((current) => ({
      ...current,
      completedOnboarding: true,
      generatedCareCode: null,
      toast: { id: Date.now(), message: "Continuing existing patient", tone: "info" },
    }));
  },
  startSelfOnboarding(email: string, name?: string) {
    setState((current) => {
      const identity = { firstName: name?.trim() || current.patientProfile.name, contact: email.trim(), birthYear: String(current.patientProfile.birthYear) };
      const careTeam = generateSelfStartCareTeam(identity, current);
      return {
        ...current,
        patientIdentity: identity,
        patientProfile: {
          ...current.patientProfile,
          name: identity.firstName,
          email: email.trim(),
          careCodeLinked: false,
          emailVerified: false,
          inviteCodeType: "none",
          inviteVerified: false,
          prefilledFromClinic: false,
          assignedDoctor: "Dr. Maya Chen",
          siteId: careTeam.siteId,
          siteName: careTeam.siteName,
          careTeam: careTeam.careTeam,
          careTeamCode: careTeam.careTeamCode,
          selfStarted: true,
          onboardingStartMode: "self",
        },
        notifications: [
          notification("reminder", "Care team generated", `${careTeam.careTeam} was assigned to this signup.`),
          ...current.notifications,
        ],
        toast: { id: Date.now(), message: "Self-start onboarding started", tone: "success" },
      };
    });
  },
  submitClinicCode(code: string, email: string) {
    const normalized = code.trim().toUpperCase();
    if (normalized !== "SAM-GVOC-7429") {
      return false;
    }
    setState((current) => ({
      ...current,
      patientProfile: {
        ...current.patientProfile,
        email: email.trim(),
        careTeam: current.site.name,
        careTeamCode: current.site.id.toUpperCase(),
        careCodeLinked: true,
        emailVerified: false,
        inviteCodeType: "clinic",
        inviteVerified: false,
        prefilledFromClinic: false,
        assignedDoctor: "Dr. Maya Chen",
        siteId: current.site.id,
        siteName: current.site.name,
        selfStarted: false,
        onboardingStartMode: "patient_invite",
      },
      generatedCareCode: null,
      notifications: [
        notification("reminder", "Clinic linked", `${current.site.name} is linked without loading protected patient details.`),
        ...current.notifications,
      ],
      toast: { id: Date.now(), message: `Linked to ${current.site.name}`, tone: "success" },
    }));
    return true;
  },
  submitPatientInviteCode(code: string) {
    const normalized = code.trim().toUpperCase();
    if (normalized !== "SAM-GVOC-7429") {
      return false;
    }
    setState((current) => ({
      ...current,
      onboardingMode: "care_code",
      careCode: normalized,
      generatedCareCode: null,
      patientProfile: {
        ...current.patientProfile,
        inviteCodeType: "patient_invite",
        inviteVerified: false,
        prefilledFromClinic: false,
        assignedDoctor: "Dr. Maya Chen",
        siteId: current.site.id,
        siteName: current.site.name,
        careTeam: current.site.name,
        careTeamCode: current.site.id.toUpperCase(),
        careCodeLinked: true,
        selfStarted: false,
        onboardingStartMode: "patient_invite",
      },
      toast: { id: Date.now(), message: "Care Code found", tone: "info" },
    }));
    return true;
  },
  submitPatientInviteCodeLegacy(code: string) {
    const normalized = code.trim().toUpperCase();
    if (normalized !== "SAM-GVOC-7429") {
      return false;
    }
    setState((current) => ({
      ...current,
      patientProfile: {
        ...current.patientProfile,
        careTeam: current.site.name,
        careTeamCode: current.site.id.toUpperCase(),
        careCodeLinked: true,
        inviteCodeType: "patient_invite",
        inviteVerified: false,
        prefilledFromClinic: false,
        assignedDoctor: "Dr. Maya Chen",
        siteId: current.site.id,
        siteName: current.site.name,
        selfStarted: false,
        onboardingStartMode: "patient_invite",
      },
      generatedCareCode: null,
      toast: { id: Date.now(), message: "Invitation found", tone: "info" },
    }));
    return true;
  },
  verifyPatientInvite(value: string) {
    if (value.trim() !== "1974") {
      return false;
    }
    setState((current) => ({
      ...current,
      patientProfile: {
        ...current.patientProfile,
        name: current.patientProfile.name || current.patientIdentity?.firstName || "Patient",
        email: current.patientProfile.email || current.patientIdentity?.contact || "",
        birthYear: current.patientProfile.birthYear || Number(current.patientIdentity?.birthYear) || 1974,
        emailVerified: true,
        inviteVerified: true,
        prefilledFromClinic: true,
        assignedDoctor: "Dr. Maya Chen",
        siteId: current.site.id,
        siteName: current.site.name,
        careCodeLinked: true,
        careTeam: current.site.name,
        careTeamCode: current.site.id.toUpperCase(),
        onboardingStartMode: "patient_invite",
      },
      generatedCareCode: null,
      toast: { id: Date.now(), message: "Invite verified", tone: "success" },
    }));
    return true;
  },
  confirmPrefilledClinicProfile() {
    setState((current) => ({
      ...current,
      patientProfile: {
        ...current.patientProfile,
        prefilledFromClinic: true,
        inviteVerified: true,
      },
      toast: { id: Date.now(), message: "Clinic profile confirmed", tone: "success" },
    }));
  },
  clearPatientInviteFlow() {
    setState((current) => ({
      ...current,
      patientProfile: {
        ...current.patientProfile,
        inviteCodeType: "none",
        inviteVerified: false,
        prefilledFromClinic: false,
        onboardingStartMode: "self",
      },
    }));
  },
  setSupportPerson(supportPerson: OnboardingAnswers["supportPerson"]) {
    setState((current) => {
      const next = { ...current, onboarding: { ...current.onboarding, supportPerson } };
      return { ...next, acceptedCareCodes: syncCareCodeSnapshot(next) };
    });
  },
  generatePatientPlan() {
    const answers = state.onboarding;
    const adaptations: string[] = [];
    if (answers.barriers.includes("Fatigue")) adaptations.push("short sessions");
    if (answers.barriers.includes("Bathroom access")) adaptations.push("short loops near home");
    if (answers.barriers.includes("Neuropathy")) adaptations.push("flat steady routes");
    if (answers.barriers.includes("Fear of overdoing it")) adaptations.push("starts below your limit");
    if (answers.preferences.includes("Gardening")) adaptations.push("gardening counts");
    if (estimateBaselineMetHours(answers) > 0) adaptations.push("baseline measured");
    const activity: PatientPlan["activity"] = answers.preferences.includes("Gardening") ? "Gardening" : "Walking";
    const met = activity === "Gardening" ? 2.3 : 2.5;
    const minutes = answers.barriers.includes("Fatigue") ? 8 : 10;
    const metHours = Number(((met * minutes * 3) / 60).toFixed(2));
    setState((current) => {
      const next: DemoState = {
        ...current,
        patientPlan: {
        activity,
        minutes,
        daysPerWeek: 3,
        intensity: "Easy-to-moderate",
        metHours,
        adaptations,
        },
        safetyPaused: answers.redFlags.length > 0,
      };
      return { ...next, acceptedCareCodes: syncCareCodeSnapshot(next) };
    });
  },
  addActivityLog(log: Omit<ActivityLog, "id" | "metHours" | "dateLabel"> & { dateLabel?: string }) {
    const met = log.activity === "Gardening" ? 2.3 : log.activity === "Cycling" ? 4 : log.activity === "Swimming" ? 4.5 : 2.5;
    const entry: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      dateLabel: log.dateLabel || "Today",
      metHours: Number(((met * log.duration) / 60).toFixed(2)),
    };
    setState((current) => {
      const patientName = current.patientProfile.name || "patient";
      const patient = current.patients.find((item) => item.name === current.patientProfile.name) || current.patients.find((item) => item.id === "sam-rivera");
      const nextLogs = [entry, ...current.activityLogs];
      const updatedMinutes = nextLogs.reduce((sum, item) => sum + item.duration, 0);
      return {
        ...current,
        activityLogs: nextLogs,
        acceptedCareCodes: current.acceptedCareCodes.map((item) =>
          item.code === current.careCode || item.code === current.generatedCareCode
            ? { ...item, activityLogs: nextLogs.map((log) => ({ ...log })) }
            : item,
        ),
        patients: current.patients.map((item) =>
          item.id === patient?.id
            ? {
                ...item,
                activeDays: item.activeDays + 1,
                adherence: Math.min(100, Math.round((updatedMinutes / (current.patientPlan.minutes * current.patientPlan.daysPerWeek)) * 100)),
              }
            : item,
        ),
        notifications: [
          notification("celebration", "Activity logged", `${entry.duration} minutes of ${entry.activity} added to this week.`),
          ...current.notifications,
        ],
        toast: { id: Date.now(), message: patient ? `Activity logged for ${patientName.split(/\s+/)[0]}` : "Activity logged", tone: "success" },
      };
    });
  },
  addSymptomReport(report: Omit<SymptomReport, "id" | "createdAt">) {
    const entry: SymptomReport = {
      ...report,
      id: `symptom-${Date.now()}`,
      createdAt: nowLabel(),
    };
    setState((current) => ({
      ...current,
      symptomReports: [entry, ...current.symptomReports],
      safetyPaused: report.redFlag || current.safetyPaused,
      notifications: [
        notification(
          report.redFlag ? "safety" : "reminder",
          report.redFlag ? "Safety check-in created" : "Symptom report saved",
          report.redFlag
            ? `${report.symptom} may need care-team review before more activity.`
            : `${report.symptom} was saved for your doctor summary.`,
        ),
        ...current.notifications,
      ],
      toast: {
        id: Date.now(),
        message: report.redFlag ? "Safety notification created" : "Symptom saved",
        tone: report.redFlag ? "warning" : "success",
      },
    }));
  },
  connectDevice(deviceName: TrackingType) {
    setState((current) => ({
      ...current,
      onboarding: { ...current.onboarding, trackingType: deviceName },
      connectedDevices: current.connectedDevices.map((device) =>
        device.name === deviceName ? { ...device, connected: true, lastSync: device.lastSync || "Connected just now" } : device,
      ),
      notifications: [
        notification("device", `${deviceName} connected`, "Automatic activity detection is simulated in this demo."),
        ...current.notifications,
      ],
      toast: { id: Date.now(), message: `${deviceName} connected`, tone: "success" },
    }));
  },
  disconnectDevice(deviceName: TrackingType) {
    setState((current) => ({
      ...current,
      connectedDevices: current.connectedDevices.map((device) =>
        device.name === deviceName ? { ...device, connected: false, lastSync: null } : device,
      ),
      toast: { id: Date.now(), message: `${deviceName} disconnected`, tone: "info" },
    }));
  },
  syncDevice(deviceName: TrackingType) {
    const sample: ConnectedDevice["lastSync"] = nowLabel();
    const entry: ActivityLog = {
      id: `log-${Date.now()}`,
      dateLabel: "Synced today",
      activity: "Walking",
      duration: 8,
      paceFeel: "Easy",
      symptoms: false,
      metHours: Number(((2.5 * 8) / 60).toFixed(2)),
    };
    setState((current) => {
      const nextLogs = [entry, ...current.activityLogs];
      return {
        ...current,
        connectedDevices: current.connectedDevices.map((device) =>
          device.name === deviceName ? { ...device, connected: true, lastSync: sample } : device,
        ),
        activityLogs: nextLogs,
        acceptedCareCodes: current.acceptedCareCodes.map((item) =>
          item.code === current.careCode || item.code === current.generatedCareCode
            ? { ...item, activityLogs: nextLogs.map((log) => ({ ...log })) }
            : item,
        ),
        notifications: [
          notification("device", `${deviceName} synced`, "Detected 8 minutes of easy walking and estimated dose."),
          ...current.notifications,
        ],
        toast: { id: Date.now(), message: `${deviceName} synced`, tone: "success" },
      };
    });
  },
  addNotification(item: Omit<PatientNotification, "id" | "createdAt" | "read">) {
    setState((current) => ({
      ...current,
      notifications: [notification(item.type, item.title, item.detail), ...current.notifications],
    }));
  },
  markNotificationRead(notificationId: string) {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    }));
  },
  dismissNotification(notificationId: string) {
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter((item) => item.id !== notificationId),
    }));
  },
  addChatMessage(message: Omit<ChatMessage, "id">) {
    const entry: ChatMessage = { ...message, id: `chat-${Date.now()}-${message.sender}` };
    setState((current) => ({ ...current, chatMessages: [...current.chatMessages, entry] }));
  },
  completeSession(sessionId: number) {
    setState((current) => ({
      ...current,
      completedSessions: current.completedSessions.includes(sessionId)
        ? current.completedSessions
        : [...current.completedSessions, sessionId],
      sessionProgress: { ...current.sessionProgress, [String(sessionId)]: 5 },
      acceptedCareCodes: current.acceptedCareCodes.map((item) =>
        item.code === current.careCode || item.code === current.generatedCareCode
          ? {
              ...item,
              completedSessions: current.completedSessions.includes(sessionId) ? current.completedSessions : [...current.completedSessions, sessionId],
              sessionProgress: { ...current.sessionProgress, [String(sessionId)]: 5 },
            }
          : item,
      ),
      notifications: [
        notification("session", `Session ${sessionId} complete`, "Your next Phase 1 session will unlock in this demo path."),
        ...current.notifications,
      ],
    }));
  },
  setSessionProgress(sessionId: number, progress: number) {
    setState((current) => ({
      ...current,
      sessionProgress: { ...current.sessionProgress, [String(sessionId)]: progress },
      acceptedCareCodes: current.acceptedCareCodes.map((item) =>
        item.code === current.careCode || item.code === current.generatedCareCode
          ? { ...item, sessionProgress: { ...current.sessionProgress, [String(sessionId)]: progress } }
          : item,
      ),
    }));
  },
  setSafetyPaused(safetyPaused: boolean) {
    setState((current) => ({ ...current, safetyPaused }));
  },
  updateDoctorSummary(patch: Partial<DemoState["doctorSummary"]>) {
    setState((current) => ({
      ...current,
      doctorSummary: { ...current.doctorSummary, ...patch },
    }));
  },
  sharePatientDetailsWithDoctor() {
    setState((current) => {
      const baselineMet = estimateBaselineMetHours(current.onboarding);
      const prescription = `${current.patientPlan.activity} ${current.patientPlan.minutes} min, ${current.patientPlan.daysPerWeek} days/week, ${current.patientPlan.metHours} MET-hrs/wk`;
      const patientName = current.patientProfile.name || "Patient";
      const rosterActivity = ["Walking", "Cycling", "Strength", "Gardening"].includes(current.patientPlan.activity) ? current.patientPlan.activity as DemoState["patients"][number]["prescription"]["activity"] : "Walking";
      return {
        ...current,
        patients: current.patients.map((patient) =>
          patient.name === patientName
            ? {
                ...patient,
                prescriptionStatus: "pending-approval",
                prescription: {
                  activity: rosterActivity,
                  minutes: current.patientPlan.minutes,
                  daysPerWeek: current.patientPlan.daysPerWeek,
                  intensity: current.patientPlan.intensity,
                  metHours: current.patientPlan.metHours,
                },
              }
            : patient,
        ),
        doctorSummary: {
          ...current.doctorSummary,
          lastGeneratedAt: nowLabel(),
          shared: true,
          reviewRequest: {
            patientName,
            patientEmail: current.patientProfile.email || "Not provided",
            doctorName: current.patientProfile.assignedDoctor || "Dr. Maya Chen",
            clinicName: current.patientProfile.siteName || current.patientProfile.careTeam || current.site.name,
            context: `${current.onboarding.cancerType}, ${current.onboarding.treatmentStatus}`,
            baseline: `${baselineMet || 0} MET-hrs/week baseline; ${current.onboarding.weeklyWalkingMinutes || 0} walking min/wk; ${current.onboarding.weeklyOtherActivityMinutes || 0} other min/wk`,
            preferences: current.onboarding.preferences.length ? current.onboarding.preferences.join(", ") : "Not selected",
            barriers: current.onboarding.barriers.length ? current.onboarding.barriers.join(", ") : "None selected",
            prescription,
            status: "waiting-review",
            sharedAt: nowLabel(),
          },
        },
        notifications: [
          notification("reminder", "Shared with doctor", `${patientName}'s plan was sent to ${current.patientProfile.assignedDoctor || "Dr. Maya Chen"} for review.`),
          ...current.notifications,
        ],
        toast: { id: Date.now(), message: "Patient details sent to doctor for review", tone: "success" },
      };
    });
  },
  addTeamMember(member: Omit<TeamMember, "id" | "status">) {
    const entry: TeamMember = { ...member, id: `tm-${Date.now()}`, status: "Invited" };
    setState((current) => ({ ...current, teamMembers: [...current.teamMembers, entry] }));
  },
  updateTeamMember(memberId: string, patch: Partial<TeamMember>) {
    setState((current) => ({
      ...current,
      teamMembers: current.teamMembers.map((member) => member.id === memberId ? { ...member, ...patch } : member),
    }));
  },
  updateProgramSession(sessionId: string, patch: Partial<ProgramSession>) {
    setState((current) => ({
      ...current,
      programSessions: current.programSessions.map((session) => session.id === sessionId ? { ...session, ...patch } : session),
    }));
  },
  addMetCatalogItem(item: Omit<MetCatalogItem, "id">) {
    setState((current) => ({ ...current, metCatalog: [...current.metCatalog, { ...item, id: `met-${Date.now()}` }] }));
  },
  updateMetCatalogItem(itemId: string, patch: Partial<MetCatalogItem>) {
    setState((current) => ({
      ...current,
      metCatalog: current.metCatalog.map((item) => item.id === itemId ? { ...item, ...patch } : item),
    }));
  },
  updatePrompt(promptId: string, patch: Partial<PromptRegistryItem>) {
    setState((current) => ({
      ...current,
      promptRegistry: current.promptRegistry.map((prompt) => prompt.id === promptId ? { ...prompt, ...patch } : prompt),
    }));
  },
  addPromptVersion(promptId: string) {
    setState((current) => ({
      ...current,
      promptRegistry: current.promptRegistry.map((prompt) =>
        prompt.id === promptId ? { ...prompt, version: `${prompt.version}-draft`, active: false, lastUpdated: "Just now" } : prompt,
      ),
    }));
  },
  updateSiteRequest(requestId: string, patch: Partial<SiteRequest>) {
    setState((current) => ({
      ...current,
      siteRequests: current.siteRequests.map((request) => request.id === requestId ? { ...request, ...patch } : request),
    }));
  },
  updatePlatformSite(siteId: string, patch: Partial<PlatformSite>) {
    setState((current) => ({
      ...current,
      platformSites: current.platformSites.map((site) => site.id === siteId ? { ...site, ...patch } : site),
    }));
  },
  addAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">) {
    setState((current) => ({
      ...current,
      auditEvents: [{ ...event, id: `audit-${Date.now()}`, timestamp: "Just now" }, ...current.auditEvents],
    }));
  },
};
