import { convert } from 'html-to-text';
import { split } from 'sentence-splitter';
import type { Article } from './message';

export async function getArticle(): Promise<Article | false> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tabs.length === 0) {
        return false;
    }

    const result = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => window.__getArticle ? window.__getArticle() : false
    });

    return result[0].result;
}

function truncateText(text: string, length: number) {
    let result = '';
    const paragraphs = text.split(/\n+/);

    for (const paragraph of paragraphs) {
        const line = paragraph.trim();

        if (line.length === 0) {
            continue;
        } else if (result.length + line.length <= length) {
            result += line + "\n";
        } else {
            const sentences = split(line);

            for (const sentence of sentences) {
                if (sentence.type !== 'Sentence' || result.length + sentence.raw.length > length) {
                    continue;
                }

                result += sentence.raw;
            }

            break;
        }
    }

    return result.trim();
}

export function generatePromptByArticle(prompt: string, article: Article, length: number) {
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

    return prompt + truncateText(article.title + "\n" + content, length);
}