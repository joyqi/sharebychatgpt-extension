import { Storage } from '@plasmohq/storage';

type CacheItem = {
    value: any;
    time: number;
};

const storage = new Storage();

export async function cache(key: string, ttl: number) {
    const cached = await storage.get<CacheItem>(key);
    let val: any = null;

    if (cached && cached.time + ttl > Date.now()) {
        val = cached.value;
    }

    async function set(value: any) {
       await storage.set(key, { value, time: Date.now() });
    }

    return [val, set] as const;
}