import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationsClient, NotificationTrigger } from "../src/notifications";

const fetchMock = vi.fn();
global.fetch = fetchMock as any;

describe("NotificationsClient", () => {
  let client: NotificationsClient;

  beforeEach(() => {
    client = new NotificationsClient("http://localhost:4001");
    fetchMock.mockReset();
  });

  it("subscribes to email", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscription: { id: 1, channel: "email" } }),
    });

    const sub = await client.subscribeEmail("G123", "test@test.com", [NotificationTrigger.InvoiceFunded]);
    
    expect(sub.id).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4001/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stellar_address: "G123",
        channel: "email",
        destination: "test@test.com",
        triggers: ["invoice_funded"],
      }),
    });
  });

  it("subscribes to webhook", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscription: { id: 2, channel: "webhook" } }),
    });

    const sub = await client.subscribeWebhook("G123", "https://hook.com", [NotificationTrigger.DueDateWarning]);
    
    expect(sub.id).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4001/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stellar_address: "G123",
        channel: "webhook",
        destination: "https://hook.com",
        triggers: ["invoice_due_soon"],
      }),
    });
  });

  it("unsubscribes", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await client.unsubscribe(5);
    
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4001/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 5 }),
    });
  });

  it("lists subscriptions", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriptions: [{ id: 1 }, { id: 2 }] }),
    });

    const subs = await client.listSubscriptions("G123");
    
    expect(subs).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4001/subscriptions/G123", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("tests a webhook", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, statusCode: 200 }),
    });

    const res = await client.testWebhook(2);
    
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4001/test-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 2 }),
    });
  });
});
