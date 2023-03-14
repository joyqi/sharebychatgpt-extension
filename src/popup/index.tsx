import { useState } from 'react';
import type { Article } from '~lib/message';
import Scraper from './scraper';
import Generator from './generator';

import "./style.scss";

export default function IndexPopup() {
    const [article, setArticle] = useState<Article | null>(null);

    function onArticle(article: Article) {
        setArticle(article);
    }

    return (
        <div className='window'>
            {!article ? <Scraper onArticle={onArticle}></Scraper> : <Generator article={article}></Generator>}
        </div>
    )
}
