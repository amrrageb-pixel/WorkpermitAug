/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PermitType = 'HOT' | 'COLD' | 'ELECTRICAL' | 'LOTO' | 'HEIGHT' | 'CONFINED' | 'EXCAVATION' | 'LIFTING' | 'LINE_BREAKING' | 'CHEMICAL';
export type Language = 'ar' | 'en' | 'zh';

export type PermitStatus = 
  | 'DRAFT' 
  | 'PENDING_DEPT' 
  | 'HSE_REVIEW' 
  | 'ACTIVE' 
  | 'SUSPENDED'
  | 'PENDING_CLOSE' 
  | 'CLOSED' 
  | 'REJECTED'
  | 'EXPIRED';

export interface LotoDetail {
  id: string;
  isolationPoint: string;
  energyType: 'ELECTRICAL' | 'MECHANICAL' | 'HYDRAULIC' | 'PNEUMATIC' | 'OTHER';
  lockTagNumber: string;
  isolatorName: string;
  isRemoved?: boolean;
  removedAt?: string;
  removerName?: string;
  /**
   * Required for stored-energy isolations (hydraulic/pneumatic lines, line-breaking): two
   * isolation points plus a vented bleed point between them, confirming zero residual
   * pressure — not just "the valve is closed."
   */
  doubleBlockAndBleedVerified?: boolean;
}

export interface GasReadings {
  lel?: number; // Lower Explosive Limit (%)
  o2?: number; // Oxygen (%)
  h2s?: number; // Hydrogen Sulfide (ppm)
  timeTested?: string;
  testerName?: string;
}

export interface CompetencyWorker {
  id: string;
  name: string;
  role: string;
  competencyStatus: 'QUALIFIED' | 'EXPIRED' | 'NOT_REQUIRED';
  isExternal?: boolean;
  externalCompany?: string;
  certExpiryDate?: string;
}

export interface PermitSignatures {
  issuerName?: string;
  issuerSignedAt?: string;
  siteManagerName?: string;
  siteManagerSignedAt?: string;
  receiverName?: string;
  receiverSignedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionAr: string;
  actionEn: string;
  actorName: string;
  actorRoleAr: string;
  actorRoleEn: string;
  comment: string;
}

export interface Permit extends TenantScopedRecord {
  id: string;
  /** Optimistic-concurrency counter, incremented on every server write. See dbSavePermitTransactional. */
  version?: number;
  title: string;
  type: PermitType;
  location: string;
  requesterName: string;
  requesterRoleAr: string;
  requesterRoleEn: string;
  description: string;
  hazards: string[];
  startDate: string;
  endDate: string;
  status: PermitStatus;
  
  // Department Approvals
  productionRequired: boolean;
  productionApproval: boolean;
  productionApprover?: string;
  productionComment?: string;
  productionApprovedAt?: string;
  
  electricalRequired: boolean;
  electricalApproval: boolean;
  electricalApprover?: string;
  electricalComment?: string;
  electricalApprovedAt?: string;
  
  // LOTO details
  lotoRequired: boolean;
  lotoLockNumber?: string; // Legacy
  lotoKeyNumber?: string; // Legacy
  lotoDetails?: LotoDetail[]; // New Wizard approach
  
  // Gas test details
  gasTestRequired: boolean;
  gasO2Level?: number; // Target: 19.5% - 23.5%
  gasLELLevel?: number; // Target: < 10%
  gasCOLevel?: number; // Target: < 35 ppm
  gasH2SLevel?: number; // Target: < 10 ppm (OSHA PEL)
  gasTester?: string;
  gasTestedAt?: string;
  gasTestPassed?: boolean;
  lastGasTestedAt?: string;
  gasReadingsData?: GasReadings; // New Wizard approach
  
  // HSE Final Approval
  hseApproval: boolean;
  hseApprover?: string;
  hseComment?: string;
  hseApprovedAt?: string;

  // Supervisor field audit
  supervisorVerified?: boolean;
  supervisorVerifier?: string;
  supervisorVerifiedAt?: string;
  supervisorComment?: string;

  // Safety Measures & PPE
  requiredPPE: string[];
  safetyPrecautionConfirmations: {[key: string]: boolean};
  
  // NEBOSH / Qatrana Specific Fields
  toolsAndEquipment?: string;
  neboshChecklists?: {
    ppe?: {[key: string]: boolean};
    general?: {[key: string]: boolean};
    hotWork?: {[key: string]: boolean};
    hotMaterial?: {[key: string]: boolean};
    lifting?: {[key: string]: boolean};
    confinedSpace?: {[key: string]: boolean};
    workAtHeight?: {[key: string]: boolean};
  };

  workers: string[];
  auditTrail: AuditLogEntry[];
  hiraId?: string;
  internalRiskAssessment?: boolean;

  // NEBOSH Gap A: Control Measures / Safety Precautions
  controlMeasures?: {[key: string]: boolean};
  additionalControlMeasures?: string;

  // NEBOSH Gap B: Emergency Procedures
  emergencyAssemblyPoint?: string;
  emergencyContact?: string;
  rescuePlanRequired?: boolean;
  rescueEquipmentOnStandby?: boolean;
  firstAidKitConfirmed?: boolean;

  // NEBOSH Gap C: Competency & Training Verification
  toolboxTalkCompleted?: boolean;
  toolboxTalkTopicAr?: string;
  toolboxTalkTopicEn?: string;
  toolboxTalkConductor?: string;
  toolboxTalkAttendees?: string[];
  toolboxTalkTimestamp?: string;
  allWorkersBriefed?: boolean;
  workerCertifications?: string[];

  // NEBOSH Gap D: Type-Specific Safety Conditions
  typeSpecificChecks?: {[key: string]: boolean | string | number};

  // NEBOSH Gap E: Cross-referencing Other Permits
  crossReferencedPermits?: string[];
  conflictAcknowledged?: boolean;

  // NEBOSH Gap F: Communication Plan
  communicationMethod?: string;
  shiftHandoverRequired?: boolean;
  shiftHandoverNotes?: string;
  otherDepartmentsNotified?: boolean;

  // NEBOSH Gap G: Permit Extension
  extensionRequested?: boolean;
  extensionApproved?: boolean;
  extensionReason?: string;
  extensionNewEndDate?: string;

  // NEBOSH Gap H: Suspension / Reinstatement
  suspensionHistory?: Array<{
    suspendedAt: string;
    suspendedBy: string;
    reason: string;
    reinstatedAt?: string;
    reinstatedBy?: string;
    reinstatementChecks?: {[key: string]: boolean};
  }>;

  // OSHA Specific Fields (Version 2)
  oshaChecklists?: {
    lotoVerification?: {[key: string]: boolean};
    confinedSpace?: {[key: string]: boolean};
    hotWork?: {[key: string]: boolean};
    generalSafety?: {[key: string]: boolean};
  };

  // NEBOSH Gap I: Structured Hand-back / Closure
  handbackChecks?: {[key: string]: boolean};
  handbackAcceptedBy?: string;

  // New Wizard Additions
  competencyWorkers?: CompetencyWorker[];
  signatures?: PermitSignatures;

  // Emergency Protocols & Evacuation (Phase 5)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  assemblyPoint?: string;
  nearestMedicalFacility?: string;
}

export type SandboxRole = 'REQUESTER' | 'PRODUCTION' | 'ELECTRICAL' | 'HSE';

export type TenantPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  maxUsers: number;
  status: TenantStatus;
  description?: string;
  ownerEmail?: string;
  companyAdminId?: string;
  logoUrl?: string;
  expiryDate?: string;
  startDate?: string;
  storageLimitGb?: number;
  storageUsedBytes?: number;
  enabledModules?: string[];
}

export interface TenantScopedRecord {
  tenantId?: string;
  [key: string]: unknown;
}

export interface SaaSAuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  tenantId: string;
  tenantName: string;
  action: string;
  ipAddress?: string;
  deviceInfo?: string;
  details?: string;
}

export interface UserProfile {
  empCode: string;
  password?: string;
  sandboxRole?: SandboxRole;
  username: string;
  fullNameAr: string;
  fullNameEn: string;
  fullNameZh?: string;
  roleAr: string;
  roleEn: string;
  roleZh?: string;
  departmentEn?: string;
  departmentAr?: string;
  departmentZh?: string;
  customRole?: 'SAFETY_MANAGER' | 'SAFETY_SUPERVISOR' | 'EMPLOYEE' | 'PRODUCTION_DEPT' | 'ELECTRICAL_DEPT' | 'SUPER_ADMIN' | 'PLATFORM_ADMIN';
  canCreatePermit?: boolean;
  canApproveElectrical?: boolean;
  canApproveProduction?: boolean;
  canApproveSafety?: boolean;
  permissions?: string[];
  permitVersion?: 'v1' | 'v2';
  tenantId?: string;
  mustChangePassword?: boolean;
  email?: string;
}

// === NEW NEBOSH-BASED EHS MODULE TYPES ===

export type IncidentType = 'NEAR_MISS' | 'ACCIDENT' | 'PROPERTY_DAMAGE' | 'ENVIRONMENTAL';
export type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'CAPA_PENDING' | 'CLOSED';
export type HSE_Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CapaItem {
  id: string;
  actionEn: string;
  actionAr: string;
  assignedDepartmentEn: string;
  assignedDepartmentAr: string;
  dueDate: string;
  status: 'PENDING' | 'DONE';
}

export interface AttachmentInfo {
  name: string;
  type: string; // e.g. 'image/png', 'application/pdf', etc.
  dataUrl?: string; // Base64 representation of the file for persistence or viewing
  size?: string; // formatted size string e.g. "1.2 MB"
}

export interface Incident extends TenantScopedRecord {
  id: string;
  titleEn: string;
  titleAr: string;
  type: IncidentType;
  date: string;
  time: string;
  locationEn: string;
  locationAr: string;
  descriptionEn: string;
  descriptionAr: string;
  severity: HSE_Severity;
  reportedByName: string;
  reportedByEmpCode?: string;
  reportedByRoleAr: string;
  reportedByRoleEn: string;
  status: IncidentStatus;
  
  // Root Cause Analysis (RCA) - 5 Whys
  why1Ar?: string;
  why1En?: string;
  why2Ar?: string;
  why2En?: string;
  why3Ar?: string;
  why3En?: string;
  why4Ar?: string;
  why4En?: string;
  why5Ar?: string;
  why5En?: string;
  rootCauseEn?: string;
  rootCauseAr?: string;
  
  // Corrective Actions (CAPA)
  capaActions: CapaItem[];
  closedAt?: string;
  closedBy?: string;
  attachments?: AttachmentInfo[];
}

export interface HiraControlMeasures {
  eliminationEn?: string;
  eliminationAr?: string;
  substitutionEn?: string;
  substitutionAr?: string;
  engineeringEn?: string;
  engineeringAr?: string;
  administrativeEn?: string;
  administrativeAr?: string;
  ppeEn?: string;
  ppeAr?: string;
}

export interface HiraAssessment extends TenantScopedRecord {
  id: string;
  taskEn: string;
  taskAr: string;
  areaEn: string;
  areaAr: string;
  hazardEn: string;
  hazardAr: string;
  consequenceEn: string;
  consequenceAr: string;
  
  // 1-5 Scale Scoring
  initialLikelihood: number;
  initialSeverity: number;
  initialRiskScore: number; // Likelihood x Severity
  
  // NEBOSH Hierarchy Controls
  controls: HiraControlMeasures;
  
  // Residual risk after controls
  residualLikelihood: number;
  residualSeverity: number;
  residualRiskScore: number;
  
  status: 'DRAFT' | 'PENDING_HSE' | 'APPROVED' | 'REJECTED';
  assessedBy: string;
  date: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuditCheckItem {
  id: string;
  labelEn: string;
  labelAr: string;
  compliance: 'COMPLIANT' | 'NON_COMPLIANT' | 'NA';
  comment?: string;
}

export interface SafetyAudit extends TenantScopedRecord {
  id: string;
  titleEn: string;
  titleAr: string;
  conductedBy: string;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  items: AuditCheckItem[];
  score: number; // % of Compliant / (Compliant + Non-Compliant)
  correctiveActionsNeeded?: string;
}

export interface TrainingRecord extends TenantScopedRecord {
  id: string;
  titleEn: string;
  titleAr: string;
  providerEn: string;
  providerAr: string;
  attendees: string[];
  date: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED';
}
