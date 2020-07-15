const Mam = require("@iota/mam");
const { asciiToTrytes } = require("@iota/converter");

const providerName = "devnet";

const mamExplorerLink = "https://utils.iota.org/mam";

const modes = ["public", "private", "restricted"];

async function publish({ seed, mode, network, packet, startIndex, sideKey }) {
  // console.log("Publish: ", arguments[0]);
  // Initialise MAM State
  let mamState = Mam.init(network, seed);

  mamState = Mam.changeMode(mamState, mode, sideKey);

  const treeRoot = Mam.getRoot(mamState);

  mamState.channel.start = startIndex;

  // Create MAM Payload - STRING OF TRYTES
  const trytes = asciiToTrytes(packet);
  const message = Mam.create(mamState, trytes);

  // Attach the payload
  await Mam.attach(message.payload, message.address, 3, 9);

  return {
    treeRoot,
    thisRoot: message.address,
    nextIndex: mamState.channel.start,
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

  publish({ mode, seed, network, packet: message, startIndex }).then(
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
