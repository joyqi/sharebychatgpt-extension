import { getBrowswer } from './common';

type CacheItem = {
    value: any;
    time: number;
};

type CacheResult = {
    [key: string]: CacheItem;
};

const storage = getBrowswer().storage.local;

export async function cache(key: string, ttl: number) {
    const cached: CacheResult | undefined = await storage.get(key);
    let val: any = null;

    if (cached && cached[key] && cached[key].time + ttl > Date.now()) {
        val = cached[key].value;
    }

    async function set(value: any) {
        await storage.set({
            [key]: { value, time: Date.now() }
        });
    }

    return [val, set] as const;
}