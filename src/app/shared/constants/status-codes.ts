export const STATUS_CODES = {
  CANDIDATE: {
    SOURCED: 'sourced',
    SCREENING: 'screening',
    INTERVIEWING: 'interviewing',
    OFFER: 'offer',
    HIRED: 'hired',
    REJECTED: 'rejected'
  },
  
  JOB: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    FILLED: 'filled',
    CANCELLED: 'cancelled'
  },
  
  INTERVIEW: {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  APPLICATION: {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    SHORTLISTED: 'shortlisted',
    REJECTED: 'rejected'
  }
} as const;

export const STATUS_LABELS = {
  CANDIDATE: {
    [STATUS_CODES.CANDIDATE.SOURCED]: 'Sourced',
    [STATUS_CODES.CANDIDATE.SCREENING]: 'Screening',
    [STATUS_CODES.CANDIDATE.INTERVIEWING]: 'Interviewing',
    [STATUS_CODES.CANDIDATE.OFFER]: 'Offer Stage',
    [STATUS_CODES.CANDIDATE.HIRED]: 'Hired',
    [STATUS_CODES.CANDIDATE.REJECTED]: 'Rejected'
  },
  
  JOB: {
    [STATUS_CODES.JOB.DRAFT]: 'Draft',
    [STATUS_CODES.JOB.ACTIVE]: 'Active',
    [STATUS_CODES.JOB.ON_HOLD]: 'On Hold',
    [STATUS_CODES.JOB.FILLED]: 'Filled',
    [STATUS_CODES.JOB.CANCELLED]: 'Cancelled'
  }
} as const;
