import type { PlasmoMessaging } from '@plasmohq/messaging';
import { generatePromptByArticle } from '~lib/article';
import { __, fetchStreamMessage, once } from '~lib/common';
import { cache } from '~lib/expirycache';
import { v4 as uuidv4 } from 'uuid';
import type { Article, Request, Response } from '~lib/message';

const PROMPT = 'You are a social media writer. '
    + 'Your write the summary post in ' + __('langInEnglish') + ' for the article I give you, and do not put quotes around your post. '
    + 'The post you are writing should be less than 140 characters, and make sure it is concise and catchy. '
    + 'Now write a post for the following article: ';

const Endpoints = {
    Auth: 'https://chat.openai.com/api/auth/session',
    Chat: 'https://chat.openai.com/backend-api'
};

async function getAccessToken(signal: AbortSignal) {
    const [token, setToken] = await cache('chatgpt-token', 60 * 1000);

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

    await setToken(data.accessToken);
    return data.accessToken;
}

async function getModel() {
    const [model, setModel] = await cache('chatgpt-model', 12 * 60 * 60 * 1000);

    if (model) {
        return model;
    }

    try {
        const response = await request('/models', 'GET');
        const data = await response.json();
        const currentModel = [
            data.models[0].slug,
            data.models[0].description.indexOf('Plus') >= 0
        ];

        await setModel(currentModel);
        return currentModel;
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

async function ask(article: Article, signal: AbortSignal) {
    const [modelName, isPlus] = await getModel();

    const body = {
        action: 'next',
        messages: [
            {
                id: uuidv4(),
                role: 'user',
                content: {
                    content_type: 'text',
                    parts: [generatePromptByArticle(PROMPT, article, isPlus ? 1000 : 500)]
                }
            }
        ],
        model: modelName,
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