const Mam = require("@iota/mam");
const { asciiToTrytes } = require("@iota/converter");

const providerName = "devnet";

const mamExplorerLink = "https://utils.iota.org/mam";

const seed =
  "XZZ9UHUZTRAXEMUNCNMHAVAKA9ATADSBFXYAPKNKYFGPHRDOUPBVOXTOMYFVN9K9KHAFAMVXZOOTZ9FBU";

async function publish(mode, network, packet, startIndex, sideKey) {
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

const modes = ["public", "private", "restricted"];

if (process.argv.length >= 5) {
  const mode = process.argv[2];
  if (modes.indexOf(mode) === -1) {
    console.error(`Error: Mode must be one of: ${modes}`);
    process.exit(1);
  }

  const network = process.argv[3];

  const messageObj = JSON.parse(process.argv[4]);
  messageObj.timestamp = new Date().toISOString();
  const message = JSON.stringify(messageObj);

  // It might be undefined
  let startIndex = process.argv[5];
  startIndex = startIndex || "0";
  startIndex = parseInt(startIndex);

  // It might be undefined
  const sideKey = process.argv[6];
  if (mode === "restricted" && !sideKey) {
    console.error("Error: In restricted mode you need to provide a side key");
    process.exit(1);
  }

  publish(mode, network, message, startIndex, sideKey).then(
    ({ treeRoot, thisRoot, nextIndex }) => {
      const result = {
        treeRoot: formatExplorerURI(mode, treeRoot, sideKey),
        thisRoot: formatExplorerURI(mode, thisRoot, sideKey),
        nextIndex,
      };
      console.log(result);
    }
  );
} else {
  console.log(
    "Usage: publish-mam <mode> <network> <message> <startIndex> <sideKey>"
  );
}

function formatExplorerURI(mode, root, sideKey) {
  if (!sideKey) {
    return `${mamExplorerLink}/${root}/${mode}/${providerName}`;
  } else {
    return `${mamExplorerLink}/${root}/${mode}/${sideKey}/${providerName}`;
  }
}
