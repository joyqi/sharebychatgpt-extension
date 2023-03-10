import { Readability, isProbablyReaderable } from '@mozilla/readability';

declare global {
    interface Window {
        __getArticle: () => any;
    }
}

function getArticle() {
    const documentClone = document.cloneNode(true) as Document;

    if (isProbablyReaderable(documentClone)) {
        const reader = new Readability(documentClone);
        return reader.parse();
    }

    return null;
}

// inejct the function into the page
window.__getArticle = getArticle;

export {}