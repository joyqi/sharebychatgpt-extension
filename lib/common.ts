export function __(name: string) {
    return chrome.i18n.getMessage(name);
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