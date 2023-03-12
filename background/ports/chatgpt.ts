import type { PlasmoMessaging } from '@plasmohq/messaging';
import { fetchArticleText } from '~lib/article';
import { __ } from '~lib/common';
import { tokenCache } from '~lib/tokencache';

const MAX_LENGTH = 1000;
const CACHE_TTL = 1000 * 10;
const CACHE_KEY = 'chatgpt-token';

const Endpoints = {
    Auth: 'https://chat.openai.com/api/auth/session',
    Chat: 'https://chat.openai.com/backend-api'
};

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

const handler: PlasmoMessaging.PortHandler = async (_, res) => {
    res.send(await fetchArticleText(MAX_LENGTH));

    setTimeout(() => {
        res.send('hello');
    }, 1000);
};

export default handler