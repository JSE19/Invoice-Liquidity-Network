export declare enum NotificationTrigger {
    InvoiceFunded = "invoice_funded",
    InvoiceSettled = "invoice_paid",
    InvoiceDefaulted = "invoice_defaulted",
    DueDateWarning = "invoice_due_soon"
}
export type SubscriptionChannel = "email" | "webhook";
export interface Subscription {
    id: number;
    stellar_address: string;
    channel: SubscriptionChannel;
    destination: string;
    triggers: NotificationTrigger[];
    created_at: number;
}
export declare class NotificationsClient {
    private readonly baseUrl;
    constructor(baseUrl: string);
    subscribeEmail(address: string, email: string, triggers: NotificationTrigger[]): Promise<Subscription>;
    subscribeWebhook(address: string, url: string, triggers: NotificationTrigger[]): Promise<Subscription>;
    unsubscribe(subscriptionId: number): Promise<void>;
    listSubscriptions(address: string): Promise<Subscription[]>;
    testWebhook(subscriptionId: number): Promise<{
        success: boolean;
        statusCode: number;
    }>;
}
//# sourceMappingURL=notifications.d.ts.map