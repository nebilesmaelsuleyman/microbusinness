export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  JOB_PAYMENT = 'job_payment',
  SUBSCRIPTION = 'subscription',
  DEPOSIT = 'deposit',
}
