export enum OnboardingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LeadStage {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ActivityType {
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
}

export enum CommissionType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum BindType {
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_OPS = 'PLATFORM_OPS',
}

export enum MerchantRole {
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  MERCHANT_STAFF = 'MERCHANT_STAFF',
}
