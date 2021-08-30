import "@metamask/legacy-web3"; // eslint-disable-line import/no-unassigned-import
import Web3 from "web3";
import MetaMaskOnboarding from "@metamask/onboarding";
import { NFTStorage } from 'nft.storage'


const nftAbi = require("../abi/BassTransaction.json");
const contractAddresses = require("../config.json");
try {
  web3 = new Web3(Web3.givenProvider || new Web3.providers.HttpProvider("http://localhost:8588"));
} catch (error) {
  alert(error)
}
const currentUrl = new URL(window.location.href);
const forwarderOrigin =
  currentUrl.hostname === "localhost" ? "http://localhost:9010" : undefined;

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

const nftContract = new web3.eth.Contract(nftAbi, contractAddresses.deployed.staging.BassTransaction);

// Dapp Status Section
const networkDiv = document.getElementById("network");
const chainIdDiv = document.getElementById("chainId");
const accountsDiv = document.getElementById("accounts");

// Basic Actions Section
const onboardButton = document.getElementById("connectButton");


const createButton = document.getElementById("createButton");


const mintButton = document.getElementById("mintButton");
const approveAllButton = document.getElementById("approveAllButton");
const transferButton = document.getElementById("transferButton");
const registerButton = document.getElementById("registerButton");


const songNameInput = document.getElementById("songName");
const descriptionInput = document.getElementById("Description");
const amountInput = document.getElementById("Amount");
const contentInput = document.getElementById("Content");
const imgInput = document.getElementById("Thumbnail");
const previewImg = document.getElementById("previewImg");

const ownTrack = document.getElementById("ownTrack");
const ownCollectionSelect = document.getElementById("ownCollectionSelect");
const mintTo = document.getElementById("mintTo");
const sendTo = document.getElementById("sendTo");

const colName = document.getElementById("colName");
const colAuthor = document.getElementById("colAuthor");
const colCopyIdSelect = document.getElementById("colCopyIdSelect");
const colImg = document.getElementById("colImg");
const colContent = document.getElementById("colContent");

const apiKey = 'NFT_STORAGE_APIKEY'
const client = new NFTStorage({ token: apiKey })


const initialize = async () => {
  let onboarding;
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin });
  } catch (error) {
    console.error(error);
  }

  let accounts;
  let tracks;
  let accountButtonsInitialized = false;

  const accountButtons = [
    createButton,
    mintButton,
  ];

  const isMetaMaskConnected = () => accounts && accounts.length > 0;

  const onClickInstall = () => {
    onboardButton.innerText = "Onboarding in progress";
    onboardButton.disabled = true;
    onboarding.startOnboarding();
  };

  const getTracks = async () => {
    if (accounts[0]) {
      tracks = await nftContract.methods.getTracksOfAuthor(accounts[0]).call();
      if (tracks.length == 0) {
        mintButton.disabled = true;
        approveAllButton.disabled = true;
      }
      console.log(tracks)
      let tracksOption = '';
      for (let i = 0; i < tracks.length; i++) {
        tracksOption += '<option value="' + tracks[i].id + '">' + tracks[i].name + '(' + tracks[i].id + ')</option>';
      }
      console.log(tracksOption)
      ownTrack.innerHTML = tracksOption;

    } else {
      mintButton.disabled = true;
      approveAllButton.disabled = true;
    }
  }

  const getCollections = async () => {

    if (accounts[0]) {
      let ownCollectionIds = await nftContract.methods.getCollectiblesOf(accounts[0]).call();
      if (ownCollectionIds.length == 0) {
        transferButton.disabled = true;
      }
      console.log(ownCollectionIds)
      let colOption = '';
      for (let i = 0; i < ownCollectionIds.length; i++) {
        colOption += '<option value="' + ownCollectionIds[i] + '">' + ownCollectionIds[i] + '</option>';
      }
      console.log(colOption)
      ownCollectionSelect.innerHTML = colOption;

      if (ownCollectionIds.length > 0)
        await showTrackInfo(ownCollectionIds[0])

    } else {
      transferButton.disabled = true;
    }
  }

  const showTrackInfo = async (id) => {
    let trackInfo = await nftContract.methods.trackInfo(id).call();
    if (trackInfo) {
      console.log(trackInfo)
      colName.value = trackInfo.name;
      colAuthor.value = trackInfo.authorName;
      colContent.src = "https://dweb.link/ipfs/" + trackInfo.demoHash;
      colContent.onload = function () {
        URL.revokeObjectURL(this.src);
      }
      await getIPFSCover(trackInfo.cover);
      await getCommonIds(accounts[0], id);
    }
  }

  const getCommonIds = async (acc, trackId) => {
    let commonIds = await nftContract.methods.getCommonIdOf(acc, trackId).call();
    if (commonIds.length == 0) {
      transferButton.disabled = true;
    }
    console.log(commonIds)
    let copyOption = '';
    for (let i = 0; i < commonIds.length; i++) {
      copyOption += '<option value="' + commonIds[i] + '">' + commonIds[i] + '</option>';
    }
    console.log(copyOption)
    colCopyIdSelect.innerHTML = copyOption;
    if (commonIds.length > 0) {
      transferButton.disabled = false;
    }
  }

  const getIPFSCover = async (url) => {

    const metadata = await fetchIPFSJSON(url);
    console.log('metadata: ', metadata)

    if (metadata.image) {
      metadata.image = makeGatewayURL(metadata.image);
      colImg.src = metadata.image

    }
    return metadata;
  }

  const onClickConnect = async () => {
    try {
      const newAccounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      handleNewAccounts(newAccounts);

    } catch (error) {
      console.error(error);
    }
  };

  function makeGatewayURL(ipfsURI) {
    return ipfsURI.replace(/^ipfs:\/\//, "https://dweb.link/ipfs/");
  }

  async function fetchIPFSJSON(ipfsURI) {
    const url = makeGatewayURL(ipfsURI);
    const resp = await fetch(url);
    return resp.json();
  }

  const clearTextDisplays = () => {
    // encryptionKeyDisplay.innerText = "";
    // encryptMessageInput.value = "";
    // ciphertextDisplay.innerText = "";
    // cleartextDisplay.innerText = "";
  };

  const updateButtons = () => {
    const accountButtonsDisabled =
      !isMetaMaskInstalled() || !isMetaMaskConnected();
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true;
      }
      clearTextDisplays();
    } else {
      createButton.disabled = false;
      mintButton.disabled = false;
      approveAllButton.disabled = false;
      registerButton.disabled = false;
    }

    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = "Click here to install MetaMask!";
      onboardButton.onclick = onClickInstall;
      onboardButton.disabled = false;
    } else if (isMetaMaskConnected()) {
      onboardButton.innerText = "Connected";
      onboardButton.disabled = true;
      if (onboarding) {
        onboarding.stopOnboarding();
      }
    } else {
      onboardButton.innerText = "Connect";
      onboardButton.onclick = onClickConnect;
      onboardButton.disabled = false;
    }
  };

  function handleFiles(e) {
    previewImg.src = URL.createObjectURL(e.target.files[0]);
    previewImg.onload = function () {
      URL.revokeObjectURL(this.src);
    }
  }

  function handleMusicPreview(e) {
    previewContent.src = URL.createObjectURL(e.target.files[0]);
    previewContent.onload = function () {
      URL.revokeObjectURL(this.src);
    }
  }

  function handleColSeletced(e) {
    showTrackInfo(e.target.value)
  }

  const initializeAccountButtons = () => {
    if (accountButtonsInitialized) {
      return;
    }
    accountButtonsInitialized = true;


    imgInput.addEventListener('change', handleFiles);
    Content.addEventListener('change', handleMusicPreview);
    ownCollectionSelect.addEventListener('change', handleColSeletced)

    getTracks();
    getCollections();
    createButton.onclick = async () => {

      try {

        const isRegistered = await nftContract.methods.isRegistered(accounts[0]).call()
        console.log(isRegistered)
        if (!isRegistered) {
          await nftContract.methods.register(accounts[0], 'asdin1ndnu0910n', 'metamask', 'sha')
            .send({ from: accounts[0] })
        }

        const AUTHOR = 'tester'
        const PACKED2 = await web3.eth.abi.encodeParameters(
          ['uint256', 'address[]', 'uint256[]', 'uint256[]'],
          [
            1,
            [accounts[0]],
            [1],
            [1, 5, 100],
          ],
        )
        const PACKED_HASH2 = await web3.utils.sha3(PACKED2)
        const signature2 = await web3.eth.sign(
          PACKED_HASH2,
          accounts[0]
        )

        let file = contentInput.files[0];
        let url = URL.createObjectURL(file);
        let contentResponse = await fetch(url)
        let contentBlob;
        if (contentResponse.ok) {
          contentBlob = await contentResponse.blob();
        }
        console.log(contentBlob)
        const contentCid = await client.storeBlob(contentBlob)
        console.log(contentCid)
        const imgMeta = await client.store({
          name: songNameInput.value,
          description: descriptionInput.value,
          image: imgInput.files[0]
        })
        console.log(imgMeta)
        let tx = await nftContract.methods.createTrack(
          AUTHOR,
          songNameInput.value,
          amountInput.value,
          descriptionInput.value,
          contentCid,
          imgMeta.url,
          0,
          PACKED2,
          signature2
        ).send({ from: accounts[0] })
        console.log(tx)
        location.reload()

      } catch (error) {
        console.error(error)
      }
    };


    mintButton.onclick = async () => {
      const isRegistered = await nftContract.methods.isRegistered(mintTo.value).call()
      console.log(isRegistered)
      if (!isRegistered) {
        alert('Transfer target is not registered.')
        return
      }
      console.log(ownTrack.value);
      const expiredTime = Math.round(Number(new Date()) / 1000) + 30 * 60
      console.log(expiredTime)
      const ORIGIN_HASH = await web3.utils.utf8ToHex('123456')
      const NEW_PACKED = await web3.eth.abi.encodeParameters(
        ['uint256', 'uint256', 'bytes32'],
        [1, expiredTime, ORIGIN_HASH]);
      console.log(NEW_PACKED)
      const PACKED_HASH = await web3.utils.sha3(NEW_PACKED)
      const signature = await web3.eth.sign(
        PACKED_HASH,
        accounts[0])
      let tx = await nftContract.methods.mintFirstEditionTo(
        ownTrack.value,
        mintTo.value,
        NEW_PACKED,
        signature
      ).send({ from: accounts[0] })
      console.log(tx)
      location.reload()
    };

    approveAllButton.onclick = async () => {
      let tx = await nftContract.methods.setApprovalForAll(
        mintTo.value, true
      ).send({ from: accounts[0] })
      console.log(tx)
    }

    transferButton.onclick = async () => {

      const isRegistered = await nftContract.methods.isRegistered(sendTo.value).call()
      console.log(isRegistered)
      if (!isRegistered) {
        alert('Transfer target is not registered.')
        return
      }
      console.log(ownTrack.value);
      const expiredTime = Math.round(Number(new Date()) / 1000) + 30 * 60
      console.log(expiredTime)
      const ORIGIN_HASH = await web3.utils.utf8ToHex('123456')
      const NEW_PACKED = await web3.eth.abi.encodeParameters(
        ['uint256', 'uint256', 'bytes32'],
        [colCopyIdSelect.value, expiredTime, ORIGIN_HASH]);
      console.log(NEW_PACKED)
      const PACKED_HASH = await web3.utils.sha3(NEW_PACKED)
      const signature = await web3.eth.sign(
        PACKED_HASH,
        accounts[0])
      let tx = await nftContract.methods.transfer(
        accounts[0],
        sendTo.value,
        ownCollectionSelect.value,
        1,
        NEW_PACKED,
        signature
      ).send({ from: accounts[0] })
      console.log(tx)
      location.reload()
    };

    registerButton.onclick = async () => {
      await nftContract.methods.register(accounts[0], 'asdin1ndnu0910n', 'metamask', 'sha')
        .send({ from: accounts[0] })
    }
  };

  function handleNewAccounts(newAccounts) {
    accounts = newAccounts;
    accountsDiv.innerHTML = accounts;
    if (isMetaMaskConnected()) {
      initializeAccountButtons();
    }
    updateButtons();
  }

  function handleNewChain(chainId) {
    chainIdDiv.innerHTML = chainId;
  }

  function handleNewNetwork(networkId) {
    networkDiv.innerHTML = networkId;
  }

  async function getNetworkAndChainId() {
    try {
      const chainId = await ethereum.request({
        method: "eth_chainId",
      });
      handleNewChain(chainId);

      const networkId = await ethereum.request({
        method: "net_version",
      });
      handleNewNetwork(networkId);
    } catch (err) {
      console.error(err);
    }
  }

  updateButtons();
  if (isMetaMaskInstalled()) {
    ethereum.autoRefreshOnNetworkChange = false;
    getNetworkAndChainId();

    ethereum.on("chainChanged", handleNewChain);
    ethereum.on("networkChanged", handleNewNetwork);
    ethereum.on("accountsChanged", handleNewAccounts);

    try {
      const newAccounts = await ethereum.request({
        method: "eth_accounts",
      });
      handleNewAccounts(newAccounts);
    } catch (err) {
      console.error("Error on init when getting accounts", err);
    }
  }
};

window.addEventListener("DOMContentLoaded", initialize);
