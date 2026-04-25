export type EventType = "funded" | "paid" | "defaulted" | "due_date_warning";
export type ActorRole = "freelancer" | "lp" | "payer";
export type DeliveryChannel = "email" | "webhook";
export type WebhookStatus = "active" | "failed";

export interface InvoiceEvent {
  eventId: string;
  type: EventType;
  invoiceId: number;
  freelancer: string;
  payer: string;
  funder: string | null;
  amount: string;
  dueDate: number;
  discountRate: number;
  settledOnTime?: boolean;
}

export interface Subscription {
  id: string;
  address: string;
  role: ActorRole;
  channel: DeliveryChannel;
  email?: string;
  webhookUrl?: string;
  webhookStatus: WebhookStatus;
  active: boolean;
}

export interface DeliveryResult {
  success: boolean;
  channel: DeliveryChannel;
  subscriptionId: string;
}
