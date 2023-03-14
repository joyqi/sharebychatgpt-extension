import { Readability } from '@mozilla/readability';
import type { Article } from '~lib/message';

declare global {
    interface Window {
        __getArticle: () => Article;
    }
}

function getUrl() {
    const url = new URL(window.location.href);
    url.hash = '';

    return url.href;
}

function getArticle(): Article {
    const documentClone = document.cloneNode(true) as Document;
    const url = getUrl();
    return { url, ...(new Readability(documentClone).parse()) };
}

// inejct the function into the page
window.__getArticle = getArticle;

export {}