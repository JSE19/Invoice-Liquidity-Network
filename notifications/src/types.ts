export type InvoiceStatus = "Pending" | "Funded" | "Paid" | "Defaulted";
export type ILNEventType = "submitted" | "funded" | "paid" | "defaulted";

export type NotificationTrigger =
  | "invoice_funded"
  | "invoice_paid"
  | "invoice_defaulted"
  | "invoice_due_soon"
  | "invoice_overdue";

export type SubscriptionChannel = "email" | "webhook" | "sms";

/** Roles used in the service layer (service.ts / NotificationService). */
export type ActorRole = "freelancer" | "lp" | "payer";

/** Webhook health status tracked per subscription. */
export type WebhookStatus = "active" | "failed" | "disabled";

/**
 * A normalised invoice event emitted by the contract poller and consumed by
 * the notification service.
 */
export interface InvoiceEvent {
  eventId: string;
  type: string; // e.g. "funded" | "paid" | "defaulted" | "due_date_warning"
  invoiceId: number;
  freelancer: string;
  payer: string;
  funder?: string | null;
  amount: string;
  dueDate: number;
  discountRate: number;
}

/** Result returned by the service after attempting delivery to one subscriber. */
export interface DeliveryResult {
  success: boolean;
  channel: "email" | "webhook";
  subscriptionId: string;
}

/**
 * A subscriber record stored in the database. Extends the legacy
 * Subscription shape with service-layer fields used by NotificationService.
 */
export interface Subscription {
  id: string;
  address: string;
  role: ActorRole;
  channel: "email" | "webhook";
  email?: string;
  webhookUrl?: string;
  webhookStatus: WebhookStatus;
  active: boolean;
}

export interface Invoice {
  id: number;
  freelancer: string;
  payer: string;
  amount: string;
  due_date: number;
  discount_rate: number;
  status: InvoiceStatus;
  funder: string | null;
  funded_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface LegacySubscription {
  id: number;
  stellar_address: string;
  channel: SubscriptionChannel;
  destination: string;
  triggers: NotificationTrigger[];
  created_at: number;
}

export interface NotificationPayload {
  trigger: NotificationTrigger;
  invoice: Invoice;
  recipientAddress: string;
  subject: string;
  message: string;
  actor: "freelancer" | "lp" | "payer";
  eventType?: ILNEventType;
}
