import { Readability } from '@mozilla/readability';

declare global {
    interface Window {
        __getArticle: () => any;
    }
}

function getArticle() {
    const documentClone = document.cloneNode(true) as Document;
    return new Readability(documentClone).parse();
}

// inejct the function into the page
window.__getArticle = getArticle;

export {}