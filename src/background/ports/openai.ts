import type { PlasmoMessaging } from '@plasmohq/messaging';
import { generatePromptByArticle } from '~lib/article';
import { __, fetchStreamMessage, tryParseMessage } from '~lib/common';
import type { Article, Request, Response } from '~lib/message';
import { option } from '~lib/options';

const Endpoints = {
    API: 'https://api.openai.com/v1'
};

const Prefs = {
    'gpt-4-32k': 16000,
    'gpt-3.5-turbo-16k-0613': 8000,
    'gpt-3.5-turbo-16k': 8000,
    'gpt-3.5-turbo-0613': 4000,
    'gpt-3.5-turbo-0301': 4000,
    'gpt-3.5-turbo': 4000,
};

function makeMessages(text: string) {
    return [
        { role: 'system', content: 'You are a social media writer.' },
        {
            role: 'user',
            content: 'Your write a tweet in ' + __('langInEnglish') + ' for the article I give you. '
            + 'The tweet you are writing should be less than 140 characters, and make sure it is concise and catchy. '
            + 'The article is: ' + text
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
    const resp = await request('/models', 'GET', undefined, signal);
    const data = await resp.json();
    const models = data.data.map((model: any) => model.id);

    for (const model in Prefs) {
        if (models.includes(model)) {
            return [model, Prefs[model]];
        }
    }

    return ['gpt-3.5-turbo-0301', 2000];
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
    const [model, length] = await getModel(signal);

    const body = {
        messages: makeMessages(generatePromptByArticle(article, length)),
        model,
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