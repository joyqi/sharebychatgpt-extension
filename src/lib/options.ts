import { getBrowswer } from './common';

type Options = {
    openAIKey?: string;
    useOpenAI?: boolean;
};

type OptionsResult = {
    [key: string]: Options;
};

const storage = getBrowswer().storage.local;

export async function option<T extends keyof Options>(key: T, value?: Options[T]): Promise<Options[T] | undefined | void> {
    const cache: OptionsResult = await storage.get('options');
    const options = cache.options || {};

    if (value !== undefined) {
        options[key] = value;
        await storage.set({ options });
    } else {
        return options[key];
    }
}