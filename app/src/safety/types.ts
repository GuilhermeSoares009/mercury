export interface SafetyConfig {
  enabled: boolean;
  quotas: {
    invitesPerSession: number;
    jobsPerDay: number;
    applicationsPerDay: number;
    searchesPerHour: number;
  };
  delays: {
    minSeconds: number;
    maxSeconds: number;
  };
  dryRun: boolean;
}

export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  enabled: true,
  quotas: {
    invitesPerSession: 15,
    jobsPerDay: 50,
    applicationsPerDay: 10,
    searchesPerHour: 30,
  },
  delays: {
    minSeconds: 180,
    maxSeconds: 900,
  },
  dryRun: true,
};

export type ActionType =
  | "recruiter.add"
  | "recruiter.update"
  | "outreach.log"
  | "outreach.withdraw"
  | "job.save"
  | "application.add"
  | "application.update"
  | "metric.record"
  | "activity.log"
  | "match"
  | "answer.set"
  | "interview.add";

export const DESTRUCTIVE_ACTIONS: ActionType[] = [
  "recruiter.add",
  "outreach.log",
  "outreach.withdraw",
  "job.save",
  "application.add",
  "application.update",
];

export const READONLY_ACTIONS: ActionType[] = [
  "match",
  "activity.log",
  "answer.set",
  "interview.add",
  "metric.record",
  "recruiter.update",
];
