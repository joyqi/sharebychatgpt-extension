import { useState, useEffect } from 'react';
import type { Article, Request, Response } from '~lib/message';
import { getBrowswer, __ } from '~lib/common';
import { usePort } from '@plasmohq/messaging/hook';
import { Twitter } from './buttons';
import { option } from '~lib/options';

type Step = 'choosing' | 'waiting' | 'generating' | 'done';

type Props = {
    article: Article;
}

export default function Generator({ article }: Props) {
    const [step, setStep] = useState<Step>('choosing');
    const [data, setData] = useState('');
    const [error, setError] = useState('');
    const [useOpenAI, setUseOpenAI] = useState(false);
    const [openAIKey, setOpenAIKey] = useState('');
    const ai = usePort<Request, Response>(useOpenAI ? 'openai' : 'chatgpt');

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

    function checkOpenAI(e: React.ChangeEvent<HTMLInputElement>) {
        const value = !!e.target.checked;
        option('useOpenAI', value);
        setUseOpenAI(value);
    }

    function inputOpenAIKey(e: React.ChangeEvent<HTMLInputElement>) {
        option('openAIKey', e.target.value);
        setOpenAIKey(e.target.value);
    }

    useEffect(() => {
        (async () => {
            setUseOpenAI(!!await option('useOpenAI'));
            setOpenAIKey(await option('openAIKey') || '');
        })();
    }, []);

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
                        <div className='full'>
                            <button onClick={generate}>{__('btnGenerate')}</button>
                        </div>
                        <div className='full'>
                            <input type='checkbox' checked={useOpenAI} onChange={checkOpenAI} id='check-openai' />
                            <label htmlFor='check-openai'>{__('checkOpenAI')}</label>
                        </div>
                        { useOpenAI ? <div className='full'>
                            <input type='password' placeholder={__('inputOpenAIKey')} onChange={inputOpenAIKey} value={openAIKey} />
                        </div> : null }
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