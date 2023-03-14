import { __ } from '~lib/common';

type Props = {
    text: string;
    url: string;
}

export function Twitter({ text, url }: Props) {
    return <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target='_blank' className='button share twitter'>
        {__('btnTwitter')}
    </a>;
}