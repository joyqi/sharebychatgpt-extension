import { createParser } from 'eventsource-parser';

export function getBrowswer() {
    return typeof browser !== 'undefined' ? browser : chrome;
}

export function __(name: string) {
    return getBrowswer().i18n.getMessage(name);
}

export async function* streamAsyncIterable(stream: ReadableStream) {
    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
 
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

export async function fetchStreamMessage(stream: ReadableStream, fn: (message: string) => void) {
    const parser = createParser((event) => {
        if (event.type === 'event') {
            fn(event.data);
        }
    });

    for await (const chunk of streamAsyncIterable(stream)) {
        parser.feed(chunk);
    }
}

export function tryParseMessage(message: string) {
    try {
        return JSON.parse(message);
    } catch {
        return null;
    }
}

export function once<Fn extends (...args: any[]) => void>(fn: Fn) {
    let called = false;
    return (...params: Parameters<Fn>) => {
        if (!called) {
            called = true;
            fn(...params);
        }
    };
}