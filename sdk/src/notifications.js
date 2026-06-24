export var NotificationTrigger;
(function (NotificationTrigger) {
    NotificationTrigger["InvoiceFunded"] = "invoice_funded";
    NotificationTrigger["InvoiceSettled"] = "invoice_paid";
    NotificationTrigger["InvoiceDefaulted"] = "invoice_defaulted";
    NotificationTrigger["DueDateWarning"] = "invoice_due_soon";
})(NotificationTrigger || (NotificationTrigger = {}));
export class NotificationsClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    async subscribeEmail(address, email, triggers) {
        const response = await fetch(`${this.baseUrl}/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stellar_address: address,
                channel: "email",
                destination: email,
                triggers,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to subscribe email: ${await response.text()}`);
        }
        const data = await response.json();
        return data.subscription;
    }
    async subscribeWebhook(address, url, triggers) {
        const response = await fetch(`${this.baseUrl}/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stellar_address: address,
                channel: "webhook",
                destination: url,
                triggers,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to subscribe webhook: ${await response.text()}`);
        }
        const data = await response.json();
        return data.subscription;
    }
    async unsubscribe(subscriptionId) {
        const response = await fetch(`${this.baseUrl}/unsubscribe`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: subscriptionId }),
        });
        if (!response.ok) {
            throw new Error(`Failed to unsubscribe: ${await response.text()}`);
        }
    }
    async listSubscriptions(address) {
        const response = await fetch(`${this.baseUrl}/subscriptions/${encodeURIComponent(address)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
            throw new Error(`Failed to list subscriptions: ${await response.text()}`);
        }
        const data = await response.json();
        return data.subscriptions;
    }
    async testWebhook(subscriptionId) {
        const response = await fetch(`${this.baseUrl}/test-webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: subscriptionId }),
        });
        if (!response.ok) {
            throw new Error(`Failed to test webhook: ${await response.text()}`);
        }
        return await response.json();
    }
}
