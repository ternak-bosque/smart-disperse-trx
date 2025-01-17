"use client";
import React from "react";
import Textify from "../Type/Textify";
import Listify from "../Type/Listify";
import Uploadify from "../Type/Uploadify";
import { useState, useEffect } from "react";
import textStyle from "../Type/textify.module.css";
import { ethers } from "ethers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import ExecuteEth from "../Execute/ExecuteEth";
import Modal from "react-modal";
import warning from "@/Assets/warning.webp";
import Image from "next/image";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import ExecuteSwap from "../Execute/ExecuteSwap";
import Swap from "../swap/Swap";

function SendEth({ activeTab, listData, setListData }) {
  const [ethToUsdExchangeRate, setEthToUsdExchangeRate] = useState(null); //store ETH to USD exchange rate
  const [totalTrx, setTotalTrx] = useState(null); // store total amount of Ether in the transaction
  const [remaining, setRemaining] = useState(null); // store remaining amount after deducting already sent value
  const [trxBalance, setTrxBalance] = useState(null); // store user's Ether balance
  const [loading, setLoading] = useState(false); //indicate whether a request is being processed or not
  const [labels, setLabels] = useState([]);
  const [allNames, setAllNames] = useState([]);
  const [allAddresses, setAllAddresses] = useState([]);
  const [errormsg, setErrormsg] = useState("");
  const [errorModalIsOpen, setErrorModalIsOpen] = useState(false);
  const { address: TronAddress, connected, wallet } = useWallet();

  const renderComponent = (tab) => {
    switch (tab) {
      case "text":
        return (
          <Textify
            listData={listData}
            setListData={setListData}
            allNames={allNames}
            allAddresses={allAddresses}
          />
        );
      case "list":
        return (
          <Listify
            listData={listData}
            setListData={setListData}
            allNames={allNames}
            allAddresses={allAddresses}
          />
        );
      case "csv":
        return (
          <Uploadify
            listData={listData}
            setListData={setListData}
            allNames={allNames}
            allAddresses={allAddresses}
          />
        );
      default:
        return (
          <Textify
            listData={listData}
            setListData={setListData}
            allNames={allNames}
            allAddresses={allAddresses}
          />
        );
    }
  };

  // For fetching the Exchange rate of Trx to USD to display value in USD
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=USD"
        );
        const data = await response.json();
        const rate = data.USD;

        setEthToUsdExchangeRate(rate);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };
    fetchExchangeRate();
  }, [listData]);

  /* For getting the user Balance
   */

  const getTrxBalance = async () => {
    if (typeof window !== "undefined") {
      const { tronWeb } = window;

      if (TronAddress) {
        // Fetch TRX balance
        const trxBalance = await tronWeb.trx.getBalance(TronAddress);
        let balance = ethers.utils.parseUnits(String(trxBalance), 0);
        // console.log(balance);
        // console.log(trxBalance);
        setTrxBalance(balance);
      }
    }
  };

  const handleDeleteRow = (index) => {
    const updatedList = [...listData];
    updatedList.splice(index, 1);
    setListData(updatedList);
  };

  /*
  For Calculating the total amount of sending ETH
  */
  useEffect(() => {
    const calculateTotal = () => {
      let totalTrx = ethers.BigNumber.from(0);
      if (listData.length > 0) {
        listData.forEach((data) => {
          console.log(data.value);
          totalTrx = totalTrx.add(data.value);
        });
      }

      setTotalTrx(totalTrx);
    };

    calculateTotal();
  }, [listData]);

  /* for getting values on render */
  useEffect(() => {
    if (TronAddress) {
      getTrxBalance();
    }
  }, [TronAddress]);

  useEffect(() => {
    calculateRemaining();
  }, [totalTrx]);

  const calculateRemaining = () => {
    console.log("calculating...");
    console.log(trxBalance, totalTrx);
    if (TronAddress) {
      if (trxBalance && totalTrx) {
        // const totalTrx = ethers.utils.formatUnits(totalTrx, 6);
        console.log(trxBalance, totalTrx);
        const remaining = trxBalance.sub(totalTrx);

        setRemaining(ethers.utils.formatUnits(remaining, 6));
      }
    } else {
      setRemaining(null);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const result = await fetch(`api/all-user-data?address=${TronAddress}`);
      const response = await result.json();
      const usersData = response.result;
      const names = usersData.map((user) => (user.name ? user.name : ""));
      const addresses = usersData.map((user) =>
        user.address ? user.address : ""
      );
      setAllNames(names);

      setAllAddresses(addresses);

      setLabels([]);
      return { names, addresses };
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  useEffect(() => {
    console.log(TronAddress);
    if (TronAddress) {
      fetchUserDetails();
    }
  }, [TronAddress]);

  const setLabelValues = (index, name) => {
    const updatedLabels = [...labels]; // Create a copy of the labels array
    updatedLabels[index] = name; // Update the value at the specified index
    // console.log(updatedLabels);
    setLabels(updatedLabels);
  };

  const onAddLabel = async (index, recipientAddress) => {
    const userData = {
      userid: TronAddress,
      name: labels[index],
      address: recipientAddress,
    };
    console.log(userData);
    try {
      // console.log("entered into try block");
      let result = await fetch(
        `api/all-user-data?address=${recipientAddress}`,
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );

      result = await result.json();
      console.log(result);
      if (typeof result.error === "string") {
        setErrorModalIsOpen(true);
        toast.warn("Name Already Exist! Please Enter Unique Name.");
        setErrormsg(result.error);
      } else {
        if (result.success) {
          alert("Added to MongoDB");
          toast.success("Label Added successfully");
        }
      }
    } catch (error) {
      // setNameErrorModalIsOpen(true);
      setErrormsg("Some Internal Error Occured");
      console.error("Error:", error);
    }
    const { names, addresses } = await fetchUserDetails();
    // console.log(names, addresses);

    const updatedListData = await listData.map((item) => {
      if (
        (item.label === undefined || item.label === "") &&
        addresses.includes(item.address)
      ) {
        const index = addresses.indexOf(item.address);
        // console.log(index);
        item.label = names[index];
      }
      return item;
    });

    await setListData(updatedListData);
  };

  useEffect(() => {
    calculateRemaining();
  });

  return (
    <>
      {renderComponent(activeTab)}
      {listData.length > 0 ? (
        <div>
          <div className={textStyle.tablecontainer}>
            <div
              className={textStyle.titleforlinupsametext}
              style={{ padding: "5px 0px" }}
            >
              <h2
                style={{
                  padding: "10px",
                  letterSpacing: "1px",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                Your Transaction Lineup
              </h2>
            </div>
            <div className={textStyle.scrollabletablecontainer}>
              <table
                className={textStyle.tabletextlist}
                style={{ padding: "30px 20px" }}
              >
                <thead className={textStyle.tableheadertextlist}>
                  <tr>
                    <th
                      className={textStyle.fontsize12px}
                      style={{ letterSpacing: "1px", padding: "8px" }}
                    >
                      Receiver Address
                    </th>
                    <th
                      className={textStyle.fontsize12px}
                      style={{ letterSpacing: "1px", padding: "8px" }}
                    >
                      Label
                    </th>
                    <th
                      className={textStyle.fontsize12px}
                      style={{ letterSpacing: "1px", padding: "8px" }}
                    >
                      Amount(TRX)
                    </th>
                    <th
                      className={textStyle.fontsize12px}
                      style={{ letterSpacing: "1px", padding: "8px" }}
                    >
                      Amount(USD)
                    </th>
                    {/* <th
                      className={textStyle.fontsize12px}
                      style={{ letterSpacing: "1px", padding: "8px" }}
                    >
                      Warnings
                    </th> */}
                    <th
                      className={textStyle.fontsize12px}
                      style={{ letterSpacing: "1px", padding: "8px" }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listData.length > 0
                    ? listData.map((data, index) => (
                        <tr key={index}>
                          <td
                            id={textStyle.fontsize10px}
                            style={{ letterSpacing: "1px", padding: "8px" }}
                          >
                            {data.address}
                          </td>
                          <td
                            id={textStyle.fontsize10px}
                            style={{ letterSpacing: "1px", padding: "8px" }}
                          >
                            {data.label ? (
                              data.label
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={labels[index] ? labels[index] : ""}
                                  style={{
                                    borderRadius: "8px",
                                    padding: "10px",
                                    color: "white",
                                    border: "none",
                                    background:
                                      "linear-gradient(90deg, rgba(97, 39, 193, .58) .06%, rgba(63, 47, 110, .58) 98.57%)",
                                  }}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    // Regular expression to allow only alphanumeric characters without spaces
                                    const regex = /^[a-zA-Z0-9]*$/;

                                    if (
                                      regex.test(inputValue) &&
                                      inputValue.length <= 10
                                    ) {
                                      setLabelValues(index, inputValue);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      onAddLabel(index, data.address);
                                    }
                                  }}
                                />
                                {/* <input
  type="button"
  onClick={(e) => {
    onAddLabel(index, data.address);
  }}
/> */}
                              </>
                            )}
                          </td>
                          <td
                            id={textStyle.fontsize10px}
                            style={{ padding: "8px" }}
                          >
                            <div
                              id={textStyle.fontsize10px}
                              style={{
                                width: "fit-content",
                                margin: "0 auto",
                                background:
                                  "linear-gradient(269deg, #0FF 2.32%, #1BFF76 98.21%)",
                                color: "black",
                                borderRadius: "10px",
                                padding: "10px 10px",
                                fontSize: "12px",
                                letterSpacing: "1px",
                              }}
                            >
                              {`${(+ethers.utils.formatUnits(
                                data.value,
                                6
                              )).toFixed(6)} TRX`}
                            </div>
                          </td>
                          <td id="font-size-10px" style={{ padding: "8px" }}>
                            <div
                              id="font-size-10px"
                              style={{
                                width: "fit-content",
                                margin: "0 auto",
                                background:
                                  "linear-gradient(90deg, #00d2ff 0%, #3a47d5 100%)",
                                color: "white",
                                borderRadius: "10px",
                                padding: "10px 10px",
                                fontSize: "12px",
                                letterSpacing: "1px",
                              }}
                            >
                              {`${(
                                ethers.utils.formatUnits(data.value, 6) *
                                ethToUsdExchangeRate
                              ).toFixed(2)} $`}
                            </div>
                          </td>

                          {/* <td style={{ letterSpacing: "1px", padding: "8px" }}>
                            <span
                              className={textStyle.warningIcon}
                              title="This is a contract address"
                            >
                              {data.isContract ? (
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                              ) : null}
                            </span>
                          </td> */}

                          <td style={{ letterSpacing: "1px", padding: "8px" }}>
                            <button
                              className={textStyle.deletebutton}
                              onClick={() => handleDeleteRow(index)}
                            >
                              <FontAwesomeIcon icon={faTrashAlt} />
                            </button>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
      {listData.length > 0 ? (
        <div style={{ paddingBottom: "30px" }}>
          <div className={textStyle.titleforaccountsummarytextsame}>
            <h2
              style={{
                padding: "10px",
                letterSpacing: "1px",
                fontSize: "20px",
                fontWeight: "700",
              }}
            >
              Account Summary
            </h2>
          </div>
          <div id={textStyle.tableresponsive}>
            <table
              className={`${textStyle["showtokentablesametext"]} ${textStyle["tabletextlist"]}`}
            >
              <thead className={textStyle.tableheadertextlist}>
                <tr style={{ width: "100%", margin: "0 auto" }}>
                  <th className={textStyle.accountsummaryth}>
                    Total Amount(TRX)
                  </th>
                  <th className={textStyle.accountsummaryth}>
                    Total Amount(USD)
                  </th>
                  <th className={textStyle.accountsummaryth}>Your Balance</th>
                  <th className={textStyle.accountsummaryth}>
                    Remaining Balance
                  </th>
                </tr>
              </thead>
              <tbody className={textStyle.tbodytextifyaccsum}>
                <tr>
                  <td id={textStyle.fontsize10px}>
                    <div
                      id="font-size-10px"
                      className={textStyle.textAccSum}
                      style={{
                        width: "fit-content",
                        margin: "0 auto",
                        background:
                          "linear-gradient(269deg, #0FF 2.32%, #1BFF76 98.21%)",
                        color: "black",
                        borderRadius: "10px",
                        padding: "10px 10px",
                        fontSize: "12px",
                        letterSpacing: "1px",
                      }}
                    >
                      {TronAddress
                        ? totalTrx
                          ? `${(+ethers.utils.formatUnits(totalTrx, 6)).toFixed(
                              6
                            )} TRX`
                          : null
                        : null}
                    </div>
                  </td>
                  <td id={textStyle.fontsize10px}>
                    {" "}
                    <div
                      id={textStyle.fontsize10px}
                      style={{
                        width: "fit-content",
                        margin: "0 auto",

                        background:
                          "linear-gradient(90deg, #00d2ff 0%, #3a47d5 100%)",
                        color: "white",
                        borderRadius: "10px",
                        padding: "10px 10px",
                        fontSize: "12px",
                        letterSpacing: "1px",
                      }}
                    >
                      {totalTrx
                        ? `${(
                            ethers.utils.formatUnits(totalTrx, 6) *
                            ethToUsdExchangeRate
                          ).toFixed(2)} $`
                        : null}
                    </div>
                  </td>
                  <td id={textStyle.fontsize10px}>
                    <div
                      id="font-size-10px"
                      style={{
                        width: "fit-content",
                        margin: "0 auto",
                        color: "white",
                        borderRadius: "10px",
                        letterSpacing: "1px",
                      }}
                    >
                      {TronAddress
                        ? trxBalance
                          ? `${(+ethers.utils.formatUnits(
                              trxBalance,
                              6
                            )).toFixed(6)} TRX`
                          : null
                        : null}
                    </div>
                  </td>
                  <td
                    id={textStyle.fontsize10px}
                    className={`showtoken-remaining-balance ${
                      remaining < 0 ? "showtoken-remaining-negative" : ""
                    }`}
                  >
                    <div
                      id={textStyle.fontsize10px}
                      // className="font-size-12px"
                      style={{
                        width: "fit-content",
                        margin: "0 auto",
                        background:
                          remaining < 0
                            ? "red"
                            : "linear-gradient(269deg, #0FF 2.32%, #1BFF76 98.21%)",
                        color: remaining < 0 ? "white" : "black",
                        borderRadius: "10px",
                        padding: "10px 10px",
                        fontSize: "12px",
                      }}
                    >
                      {TronAddress
                        ? remaining === null
                          ? null
                          : `${(+remaining).toFixed(6)} TRX`
                        : null}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Modal
            id={textStyle.popupwarning}
            className={textStyle.popupforpayment}
            isOpen={errorModalIsOpen}
            onRequestClose={() => setErrorModalIsOpen(false)}
            contentLabel="Error Modal"
          >
            <Image src={warning} alt="none" width={100} height={100} />
            <h2>Warning!</h2>
            <p>{errormsg}</p>
            <p>Please try different name</p>
            <button onClick={() => setErrorModalIsOpen(false)}>Close</button>
          </Modal>
        </div>
      ) : null}
      <div>
        {listData.length > 0 ? (
          <ExecuteEth
            listData={listData}
            setListData={setListData}
            trxBalance={trxBalance}
            totalTrx={totalTrx}
            loading={loading}
            setLoading={setLoading}
          />
        ) : null}
        {/* {listData.length > 0 ? (
          <Swap
            listData={listData}
            setListData={setListData}
            trxBalance={trxBalance}
            totalTrx={totalTrx}
            loading={loading}
            setLoading={setLoading}
          />
        ) : null} */}
      </div>
    </>
  );
}

export default SendEth;
