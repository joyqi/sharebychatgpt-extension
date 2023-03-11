import { useState } from "react";
import { sendToBackground } from '@plasmohq/messaging';

function IndexPopup() {
  const [data, setData] = useState("")

  async function getDom() {
    const resp = await sendToBackground({
      name: "scrape"
    });

    setData(resp);
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
      <textarea value={data} />
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
