import { Storage } from '@plasmohq/storage';

type CacheItem = {
    value: any;
    time: number;
};

const storage = new Storage();

export async function tokenCache(key: string, ttl: number) {
    const cached = await storage.get<CacheItem>(key);
    let token: string | null = null;

    if (cached && cached.time + ttl > Date.now()) {
        token = cached.value;
    }

    function set(value: any) {
        storage.set(key, { value, time: Date.now() });
    }

    return [token, set] as const;
}