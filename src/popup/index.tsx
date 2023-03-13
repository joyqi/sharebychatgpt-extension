import { usePort } from '@plasmohq/messaging/hook';
import { useEffect, useState } from 'react';
import type { Request, Response } from '~lib/message';
import { getArticle } from '~lib/article';
import { __ } from '~lib/common';

import "./style.scss";

function IndexPopup() {
    const ai = usePort<Request, Response>('chatgpt');
    const [data, setData] = useState('');
    const [article, setArticle] = useState(false);
    const [readOnly, setReadOnly] = useState(true);
    const [disabled, setDisabled] = useState(true);
    const [message, setMessage] = useState(__('waitingWebReady'));
    const [btn, setBtn] = useState(__('btnGenerate'));

    if (!article) {
        const intv = setInterval(async () => {
            const current = await getArticle();

            if (current !== false) {
                setArticle(current);
                clearInterval(intv);
            }
        }, 50);
    }

    useEffect(() => {
        if (article) {
            setDisabled(false);
            setMessage(null);
        }
    }, [article]);

    function ask() {
        ai.send({ type: 'ask', data: article });
        setDisabled(true);
        setBtn(__('btnWaiting'));
    }

    useEffect(() => {
        if (!ai.data) {
            return;
        }

        switch (ai.data.type) {
            case 'message':
                setData(ai.data.data);
                break;
            case 'end':
                setReadOnly(false);
                setDisabled(false);
                setBtn(__('btnShare'));
                break;
            case 'error':
                setMessage(ai.data.data);
                break;
            default:
                break;
        }
    }, [ai.data]);

    return (
      <div className='window'>
            { message ? <div className='mask'><div className='dialog' dangerouslySetInnerHTML={{__html: message}} /></div> : null }
            <p>
                <textarea value={data} readOnly={readOnly} />
            </p>
            <p>
                <button onClick={ask} disabled={disabled}>{btn}</button>
            </p>
      </div>
    )
}

export default IndexPopup
