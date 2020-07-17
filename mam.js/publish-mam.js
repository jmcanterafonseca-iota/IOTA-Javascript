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

async function publish({ seed, mode, network, packet, startIndex, sideKey }) {
  // console.log("Publish: ", arguments[0]);

  try {
    // Initialise IOTA API
    const api = Iota.composeAPI({ provider: network });

    // Go to the corresponding channel
    const channelState = createChannel(seed, 2, mode, sideKey);
    const treeRoot = channelRoot(channelState);

    channelState.start = startIndex;
    const mamMessage = createMessage(channelState, asciiToTrytes(packet));

    // And then attach the message, tagging it if required.
    // Attaching will return the actual transactions attached to the tangle if you need them.
    await mamAttach(api, mamMessage, 3, 9);

    return {
      treeRoot,
      thisRoot: mamMessage.address,
      nextIndex: channelState.start,
    };
  } catch (error) {
    console.error("Error while publishing to MAM Channel: ", error);
    process.exit(1);
    return -1;
  }
}

function formatExplorerURI(mode, root, sideKey) {
  if (!sideKey) {
    return `${mamExplorerLink}/${root}/${mode}/${providerName}`;
  } else {
    return `${mamExplorerLink}/${root}/${mode}/${sideKey}/${providerName}`;
  }
}

const argv = require("yargs")
  .option("seed", {
    alias: "s",
    type: "string",
    description: "IOTA Seed",
  })
  .option("net", {
    alias: "n",
    type: "string",
    description: "IOTA Network",
  })
  .option("devnet", {
    type: "boolean",
    description: "IOTA Devnet",
  })
  .option("comnet", {
    type: "boolean",
    description: "IOTA Comnet",
  })
  .option("mode", {
    alias: "m",
    type: "string",
    description: "MAM Channel mode",
    choices: ["public", "private", "restricted"],
  })
  .option("message", {
    alias: "msg",
    type: "string",
    description: "JSON message to be published",
  })
  .option("index", {
    alias: "i",
    type: "number",
    default: 0,
    description: "Start index used to publish",
  })
  .option("sidekey", {
    type: "string",
    alias: "sk",
    description: "Side key for restricted channels",
    default: null,
  })
  .help()
  .demandOption(["seed", "mode", "message"])
  .conflicts({ devnet: ["comnet", "net"], comnet: ["devnet", "net"] })
  // eslint-disable-next-line no-shadow
  .check((argv) => {
    if (argv.mode === "restricted" && !argv.sidekey) {
      throw new Error(
        "Missing sidekey for publishing to a MAM restricted channel"
      );
    }
    if (!argv.net && !argv.devnet && !argv.comnet) {
      throw new Error(
        "Missing network. Use --devnet, --comnet or provide a custom URL using --net"
      );
    } else {
      return true;
    }
  }).argv;

async function main() {
  let network = argv.net;

  if (argv.devnet) {
    network = "https://nodes.devnet.iota.org";
  }

  if (argv.comnet) {
    network = "https://nodes.comnet.thetangle.org";
  }

  const seed = argv.seed;
  const mode = argv.mode;

  const messageObj = JSON.parse(argv.message);
  messageObj.timestamp = new Date().toISOString();
  const message = JSON.stringify(messageObj);
  const startIndex = argv.index;
  const sideKey = argv.sidekey;

  const { treeRoot, thisRoot, nextIndex } = await publish({
    mode,
    seed,
    network,
    packet: message,
    startIndex,
    sideKey,
  });

  const result = {
    seed,
    treeRoot: formatExplorerURI(mode, treeRoot, sideKey),
    thisRoot: formatExplorerURI(mode, thisRoot, sideKey),
    nextIndex,
  };

  return result;
}

main().then(
  (result) => {
    console.log(result);
    process.exit(0);
  },
  (error) => {
    console.error("Error:", error);
    process.exit(1);
  }
);

process.on("uncaughtException", (err) => {
  // handle the error safely
  console.error(err);
});
