import type { PlasmoMessaging } from '@plasmohq/messaging';
import { generatePromptByArticle } from '~lib/article';
import { __, fetchStreamMessage, once } from '~lib/common';
import { tokenCache } from '~lib/tokencache';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from '~lib/message';

const MAX_LENGTH = 500;
const CACHE_TTL = 1000 * 10;
const CACHE_KEY = 'chatgpt-token';
const PROMPT = 'You are a summary writer. '
    + 'Your write summary in Chinese for the article I give you, and only output text. '
    + 'The summary you are writing should be less than 140 characters, and make sure it is concise and catchy. '
    + 'Now write a summary for the following article: ';

const Endpoints = {
    Auth: 'https://chat.openai.com/api/auth/session',
    Chat: 'https://chat.openai.com/backend-api'
};

async function getAccessToken(signal: AbortSignal) {
    const [token, setToken] = await tokenCache(CACHE_KEY, CACHE_TTL);

    if (token) {
        return token;
    }

    const response = await fetch(Endpoints.Auth, { signal });
    if (response.status === 403) {
        throw new Error(__('chatgptErrorCloudflare'));
    }

    const data = await response.json();
    if (!data.accessToken) {
        throw new Error(__('chatgptErrorAuth'));
    }

    setToken(data.accessToken);
    return data.accessToken;
}

async function getModel() {
    const [model, setModel] = await tokenCache('chatgpt-model', 12 * 60 * 60 * 1000);

    if (model) {
        return model;
    }

    try {
        const response = await request('/models', 'GET');
        const data = await response.json();

        setModel(data[0].slug);
        return data[0].slug;
    } catch {
        return 'text-davinci-002-render';
    }
}

// Request to ChatGPT API with access token
async function request(path: string, method: string, body?: any, signal?: AbortSignal) {
    const token = await getAccessToken(signal);
    const response = await fetch(Endpoints.Chat + path, {
        method,
        signal,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 403) {
        throw new Error(__('chatgptErrorAuth'));
    } else if (response.status === 429) {
        throw new Error(__('chatgptErrorBusy'));
    }

    return response;
}

async function ask(article: any, signal: AbortSignal) {
    const body = {
        action: 'next',
        messages: [
            {
                id: uuidv4(),
                role: 'user',
                content: {
                    content_type: 'text',
                    parts: [generatePromptByArticle(PROMPT, article, MAX_LENGTH)]
                }
            }
        ],
        model: await getModel(),
        parent_message_id: uuidv4()
    };

    return (await request('/conversation', 'POST', body, signal)).body;
}

function tryParseMessage(message: string) {
    try {
        return JSON.parse(message);
    } catch {
        return null;
    }
}

const handler: PlasmoMessaging.PortHandler<Request, Response> = async (req, res) => {
    const controller = new AbortController();
    let conversationId: string | null = null;

    const endConversation = once((abort: boolean) => {
        if (conversationId) {
            request(`/conversation/${conversationId}`, 'PATCH', { is_visible: false });
        }

        if (abort) {
            controller.abort();
        }
    });

    req.port.onDisconnect.addListener(() => endConversation(true));

    try {
        const stream = await ask(req.body.data, controller.signal);

        await fetchStreamMessage(stream, (message) => {
            if (message === '[DONE]') {
                endConversation(false);
                res.send({ type: 'end' });
                return;
            }

            const data = tryParseMessage(message);
            if (data) {
                conversationId = data.conversation_id;
                const text = data.message?.content?.parts?.[0];
                res.send({ type: 'message', data: text });
            }
        });
    } catch (e) {
        res.send({ type: 'error', data: e.message });
        endConversation(true);
    }
};

export default handler