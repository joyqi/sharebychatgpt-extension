import type { PlasmoMessaging } from '@plasmohq/messaging';
import { generatePromptByArticle } from '~lib/article';
import { __, fetchStreamMessage, tryParseMessage } from '~lib/common';
import type { Article, Request, Response } from '~lib/message';
import { option } from '~lib/options';

const Endpoints = {
    API: 'https://api.openai.com/v1'
};

function makeMessages(text: string) {
    return [
        { role: 'system', content: 'You are a social media writer.' },
        {
            role: 'user',
            content: 'Your write the summary post in ' + __('langInEnglish') + ' for the article I give you. '
            + 'The post you are writing should be less than 140 characters, and make sure it is concise and catchy. '
            + 'Now write a post without around quotes for the following article: ' + text
        }
    ]
}

async function getKey() {
    const key = option('openAIKey');

    if (!key) {
        throw new Error(__('openAIErrorKey'));
    }

    return key;
}

async function getModel(signal: AbortSignal) {
    // const models = await request('/models', 'GET', undefined, signal);
    return 'gpt-3.5-turbo';
}

// Request to ChatGPT API with access token
async function request(path: string, method: string, body?: any, signal?: AbortSignal) {
    const key = await getKey();
    const response = await fetch(Endpoints.API + path, {
        method,
        signal,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 401) {
        throw new Error(__('openAIErrorAuth'));
    } else if (response.status === 429) {
        throw new Error(__('openAIErrorBusy'));
    } else if (response.status === 500) {
        throw new Error(__('openAIErrorServer'));
    }

    return response;
}

async function ask(article: Article, signal: AbortSignal) {
    const body = {
        messages: makeMessages(generatePromptByArticle(article, 800)),
        model: await getModel(signal),
        stream: true
    };

    return (await request('/chat/completions', 'POST', body, signal)).body;
}

const handler: PlasmoMessaging.PortHandler<Request, Response> = async (req, res) => {
    const controller = new AbortController();
    let disconnected = false;
    let text = '';

    req.port.onDisconnect.addListener(() => {
        disconnected = true;
        controller.abort();
    });

    try {
        const stream = await ask(req.body.data, controller.signal);

        await fetchStreamMessage(stream, (message) => {
            if (message === '[DONE]') {
                res.send({ type: 'end' });
                return;
            }

            const data = tryParseMessage(message);
            if (data) {
                text += data.choices?.[0]?.delta?.content || '';
                res.send({ type: 'message', data: text });
            }
        });
    } catch (e) {
        if (!disconnected) {
            res.send({ type: 'error', data: e.message });
            controller.abort();
        }
    }
};

export default handler