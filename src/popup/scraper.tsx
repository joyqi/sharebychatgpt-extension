import { getArticle } from '~lib/article';
import { __ } from '~lib/common';
import type { Article } from '~lib/message';

type Props = {
    onArticle: (article: Article) => void;
}

export default function Scraper({ onArticle }: Props) {
    const intv = setInterval(async () => {
        const article = await getArticle();

        if (article !== false) {
            onArticle(article);
            clearInterval(intv);
        }
    }, 50);

    return <div className='mask'>
        <div className='dialog'>
            {__('waitingWebReady')}
        </div>
    </div>;
}
