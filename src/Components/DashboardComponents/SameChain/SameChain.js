"use client";
import React, { useState } from "react";
import "driver.js/dist/driver.css";
import textStyle from "./Type/textify.module.css";
import SendEth from "./Send/SendEth";
import SendToken from "./Send/SendToken";

function SameChain({ activeTab }) {
  const [isSendingEth, setIsSendingEth] = useState(true);
  const [isSendingToken, setIsSendingToken] = useState(false);
  const [listData, setListData] = useState([]);

  /*
  Funtion : To load SendEth component
  */
  const handleSendEthbuttonClick = () => {
    setIsSendingEth(true);
    setIsSendingToken(false);
  };

  /*
  Funtion : To load SendToken component
  */

  const handleImporttokenbuttonClick = () => {
    // console.log("import token");
    setIsSendingToken(true);
    setListData([]);
    setIsSendingEth(false);
  };

  return (
    <>
      <div className={textStyle.divtocoversametextdi}>
        {/* <div className={textStyle.divtocoversametextdiv}> */}
        <div className={textStyle.divforwholetoken}>
          <div className={textStyle.titlesametexttextarea}>
            <h2
              style={{
                padding: "10px",
                letterSpacing: "1px",
                fontSize: "20px",
                margin: "0px",
                fontWeight: "700",
              }}
            >
              Select or Import Token you want to Disperse
            </h2>
          </div>
          <div
            id="seend-eth"
            style={{
              padding: "30px 20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            className={textStyle.sametextmain}
          >
            <div id="send-eth" className={textStyle.sendethdiv}>
              <button
                id={isSendingEth ? textStyle.truee : textStyle.falsee}
                className={textStyle.buttontoaddformdata}
                onClick={handleSendEthbuttonClick}
              >
                Send TRX
              </button>
            </div>

            <div className={textStyle.importtokendiv}>
              <div style={{ margin: "10px 0px" }}>OR</div>

              <button
                style={{
                  backgroundColor: isSendingEth ? "" : "white",
                  color: isSendingEth ? "" : "#924afc",
                }}
                className={textStyle.buttontoaddformdataunload}
                onClick={() => handleImporttokenbuttonClick()}
              >
                Import Token
              </button>
            </div>
          </div>

          {isSendingEth ? (
            <SendEth
              activeTab={activeTab}
              listData={listData}
              setListData={setListData}
            />
          ) : null}

          {isSendingToken ? (
            <SendToken
              activeTab={activeTab}
              listData={listData}
              setListData={setListData}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

export default SameChain;
