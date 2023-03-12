import type { PlasmoMessaging } from '@plasmohq/messaging';
import { fetchArticleText } from '~lib/article';
import { __, streamAsyncIterable } from '~lib/common';
import { tokenCache } from '~lib/tokencache';
import { v4 as uuidv4 } from 'uuid';

const MAX_LENGTH = 1000;
const CACHE_TTL = 1000 * 10;
const CACHE_KEY = 'chatgpt-token';
const PROMPT = 'You are a summary writer. '
    + 'Your write summary in Chinese for the article I give you, and only output summary. '
    + 'The summary you are writing should be less than 140 characters, and make sure it is concise and catchy. '
    + 'Now write a summary for the following article: ';

const Endpoints = {
    Auth: 'https://chat.openai.com/api/auth/session',
    Chat: 'https://chat.openai.com/backend-api'
};

async function generateQuestion() {
    const text = await fetchArticleText(MAX_LENGTH);
    if (!text) {
        throw new Error(__('errorArticle'));
    }

    return PROMPT + text;
}

async function getAccessToken() {
    const [token, setToken] = await tokenCache(CACHE_KEY, CACHE_TTL);

    if (token) {
        return token;
    }

    const response = await fetch(Endpoints.Auth);
    if (response.status === 403) {
        throw new Error(__('errorCloudflare'));
    }

    const data = await response.json();
    if (!data.accessToken) {
        throw new Error(__('errorAuth'));
    }

    setToken(data.accessToken);
    return data.accessToken;
}

// Request to ChatGPT API with access token
async function request(path: string, method: string, body: any) {
    const token = await getAccessToken();
    const response = await fetch(Endpoints.Chat + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    if (response.status === 403) {
        throw new Error(__('errorAuth'));
    }

    return response;
}

async function ask() {
    const body = {
        action: 'next',
        message: [
            {
                id: uuidv4(),
                role: 'user',
                content: {
                    content_type: 'text',
                    parts: [await generateQuestion()]
                }
            }
        ],
        model: 'text-davinci-002-render',
        parent_message_id: uuidv4()
    };

    return (await request('/conversation', 'POST', body)).body;
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
    const stream = await ask();
    let conversationId: string | null = null;

    async function deleteConversation() {
        if (conversationId) {
            await request(`/conversation/${conversationId}`, 'PATCH', { is_visible: false });
        }
    }

    for await (const message of streamAsyncIterable(stream)) {
        if (message === '[DONE]') {
            deleteConversation();
            return;
        }
    }
};

export default handler