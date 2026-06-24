import axios from 'axios';
export class AnalyticsSDK {
    constructor(baseUrl = 'https://api.iln.network', defaultTtl = 300000) {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.defaultTtl = defaultTtl;
    }
    async fetchWithCache(key, endpoint, ttl = this.defaultTtl) {
        const now = Date.now();
        const cached = this.cache.get(key);
        if (cached && (now - cached.timestamp < ttl)) {
            return cached.data;
        }
        const response = await axios.get(`${this.baseUrl}${endpoint}`);
        const data = this.parseBigInts(response.data);
        this.cache.set(key, { data, timestamp: now });
        return data;
    }
    parseBigInts(value) {
        if (Array.isArray(value)) {
            return value.map((item) => this.parseBigInts(item));
        }
        if (!value || typeof value !== 'object') {
            return value;
        }
        const parsed = {};
        for (const [key, fieldValue] of Object.entries(value)) {
            if (typeof fieldValue === 'string' &&
                ['amount', 'totalVolume', 'totalYield', 'deployed', 'yield', 'totalReceived'].includes(key)) {
                parsed[key] = BigInt(fieldValue);
            }
            else {
                parsed[key] = this.parseBigInts(fieldValue);
            }
        }
        return parsed;
    }
    async getProtocolStats() {
        return this.fetchWithCache('protocol-stats', '/stats');
    }
    async getLPStats(address) {
        return this.fetchWithCache(`lp-stats-${address}`, `/lps/${address}/stats`);
    }
    async getFreelancerStats(address) {
        return this.fetchWithCache(`freelancer-stats-${address}`, `/freelancers/${address}/stats`);
    }
    async getInvoiceHistory(address, role) {
        return this.fetchWithCache(`history-${address}-${role}`, `/history/${address}?role=${role}`);
    }
    async getTopLPs(limit = 10, period = 'all') {
        return this.fetchWithCache(`top-lps-${limit}-${period}`, `/lps/top?limit=${limit}&period=${period}`);
    }
    clearCache() {
        this.cache.clear();
    }
}
