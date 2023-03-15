import { useState, useEffect } from 'react';
import type { Article, Request, Response } from '~lib/message';
import { __ } from '~lib/common';
import { usePort } from '@plasmohq/messaging/hook';
import { Twitter } from './buttons';

type Step = 'choosing' | 'waiting' | 'generating' | 'done';

type Props = {
    article: Article;
}

export default function Generator({ article }: Props) {
    const ai = usePort<Request, Response>('chatgpt');
    const [step, setStep] = useState<Step>('choosing');
    const [data, setData] = useState('');
    const [error, setError] = useState('');

    function generate() {
        ai.send({ type: 'ask', data: article });
        setStep('waiting');
    }

    function dissmiss() {
        setError('');
        setStep('choosing');
    }

    function changeText(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setData(e.target.value);
    }

    useEffect(() => {
        if (!ai.data) {
            return;
        }

        switch (ai.data.type) {
            case 'message':
                if (ai.data.data) {
                    setData(ai.data.data);

                    if (step === 'waiting') {
                        setStep('generating');
                    }
                }
                break;
            case 'end':
                setStep('done');
                break;
            case 'error':
                setError(ai.data.data);
                break;
            default:
                break;
        }
    }, [ai.data]);

    function makeStep() {
        switch (step) {
            case 'choosing':
                return <div className='mask'>
                    <div className='dialog'>
                        <button onClick={generate}>{__('btnGenerate')}</button>
                    </div>
                </div>;
            case 'waiting':
                return <div className='mask'>
                    <div className='dialog'>
                        <i className='waiting' />
                    </div>
                </div>;
            default:
                return <div>
                    <div className='full'>
                        <textarea value={data} onChange={changeText} />
                    </div>
                    <div className='full'>
                        <Twitter text={data} url={article.url}></Twitter>
                    </div>
                </div>;
        }
    }

    return <div className={step}>
        {error ? <div className='error' onClick={dissmiss} dangerouslySetInnerHTML={{ __html: error }} /> : null}
        {makeStep()}
    </div>;
}