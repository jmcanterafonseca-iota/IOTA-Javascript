const Iota = require("@iota/core");
const {
  channelRoot,
  createChannel,
  createMessage,
  mamAttach,
} = require("@iota/mam.js");
const { asciiToTrytes } = require("@iota/converter");

const providerName = "devnet";

const mamExplorerLink = "https://utils.iota.org/mam";

const modes = ["public", "private", "restricted"];

async function publish({ seed, mode, network, packet, startIndex, sideKey }) {
  // console.log("Publish: ", arguments[0]);
  // Initialise MAM State
  const channelState = createChannel(seed, 2, mode, sideKey);

  const treeRoot = channelRoot(channelState);

  channelState.start = startIndex;
  const mamMessage = createMessage(channelState, asciiToTrytes(packet));

  // And then attach the message, tagging it if required.
  // Attaching will return the actual transactions attached to the tangle if you need them.
  const api = Iota.composeAPI({ provider: network });
  await mamAttach(api, mamMessage, 3, 9);

  return {
    treeRoot,
    thisRoot: mamMessage.address,
    nextIndex: channelState.start,
  };
}

if (process.argv.length >= 6) {
  const seed = process.argv[2];

  const mode = process.argv[3];
  if (modes.indexOf(mode) === -1) {
    console.error(`Error: Mode must be one of: ${modes}`);
    process.exit(1);
  }

  const network = process.argv[4];

  const messageObj = JSON.parse(process.argv[5]);
  messageObj.timestamp = new Date().toISOString();
  const message = JSON.stringify(messageObj);

  // It might be undefined
  let startIndex = process.argv[6];
  startIndex = startIndex || "0";
  startIndex = parseInt(startIndex);

  // It might be undefined
  const sideKey = process.argv[7];
  if (mode === "restricted" && !sideKey) {
    console.error("Error: In restricted mode you need to provide a side key");
    process.exit(1);
  }

  publish({ mode, seed, network, packet: message, startIndex, sideKey }).then(
    ({ treeRoot, thisRoot, nextIndex }) => {
      const result = {
        seed,
        treeRoot: formatExplorerURI(mode, treeRoot, sideKey),
        thisRoot: formatExplorerURI(mode, thisRoot, sideKey),
        nextIndex,
      };
      console.log(result);
    }
  );
} else {
  console.log(
    "Usage: publish-mam <seed> <mode> <network> <message> <startIndex> <sideKey>"
  );
}

function formatExplorerURI(mode, root, sideKey) {
  if (!sideKey) {
    return `${mamExplorerLink}/${root}/${mode}/${providerName}`;
  } else {
    return `${mamExplorerLink}/${root}/${mode}/${sideKey}/${providerName}`;
  }
}
