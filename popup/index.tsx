import { usePort } from '@plasmohq/messaging/hook';
import { useEffect, useState } from 'react';

function IndexPopup() {
  const scrapePort = usePort('chatgpt');
  const [data, setData] = useState('');

  useEffect(() => {
    if (typeof scrapePort.data === 'undefined') {
      return;
    }

    setData(data + scrapePort.data);
  }, [scrapePort.data]);

  async function getDom() {
    scrapePort.send({})
  }

  return (
    <div
      style={{
        display: "flex",
        width: 400,
        height: 400,
        flexDirection: "column",
        padding: 16
      }}>
      <textarea style={{ height: 200 }} value={data} />
      <button onClick={getDom}>Get DOM</button>
      <h2>
        Welcome to your{" "}
        <a href="https://www.plasmo.com" target="_blank">
          Plasmo
        </a>{" "}
        Extension!
      </h2>
      <a href="https://docs.plasmo.com" target="_blank">
        View Docs
      </a>
    </div>
  )
}

export default IndexPopup
