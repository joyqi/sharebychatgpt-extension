import { usePort } from '@plasmohq/messaging/hook';
import { useEffect, useState } from 'react';
import type { Request, Response } from '~lib/message';
import { getArticle } from '~lib/article';
import { __ } from '~lib/common';

import "./style.css";

function IndexPopup() {
    const ai = usePort<Request, Response>('chatgpt');
    const [data, setData] = useState(__('generating'));
    const [article, setArticle] = useState(false);
    const [readOnly, setReadOnly] = useState(true);
    const [disabled, setDisabled] = useState(true);

    setTimeout(async () => {
        if (!article) {
            const current = await getArticle();

            if (current !== false) {
                setArticle(current);
            }
        }
    }, 100);

    useEffect(() => {
        if (article) {
            setDisabled(false);
        }
    }, [article]);

    function ask() {
        ai.send({ type: 'ask', data: article });
        setDisabled(true);
    }

    useEffect(() => {
        if (!ai.data) {
            setData(__('generating'));
            return;
        }

        switch (ai.data.type) {
            case 'message':
                setData(ai.data.data);
                break;
            case 'end':
                setReadOnly(false);
                break;
            case 'error':
                setData(ai.data.data);
                break;
            default:
                break;
        }
    }, [ai.data]);

    return (
      <div className='flex h-72 w-96 p-4'>
            <p className='w-full mb-4'>
                <textarea className='w-full h-36 text-sm resize-none rounded-md' value={data} readOnly={readOnly} />
            </p>
            <p className='w-full'>
                <button onClick={ask} disabled={disabled}>Hello</button>
            </p>
      </div>
    )
}

export default IndexPopup
