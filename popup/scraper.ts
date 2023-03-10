import { convert } from 'html-to-text';

async function getArticle() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => window.__getArticle()
    });

    return result[0].result;
}

function fetchArticle(article: any) {
    if (!article) {
        return null;
    }

    const content = convert(article.content, {
        wordwrap: false,
        selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' },
            { selector: 'pre', format: 'skip' },
            { selector: 'blockquote', format: 'skip' },
            { selector: 'table', format: 'skip' },
            { selector: 'hr', format: 'skip' }
        ]
    });

    return article.title + "\n" + content;
}

export default async () =>{
    return fetchArticle(await getArticle());
}