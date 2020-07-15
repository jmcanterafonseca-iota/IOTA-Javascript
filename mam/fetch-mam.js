const Mam = require("@iota/mam");
const { trytesToAscii } = require("@iota/converter");

const modes = ["public", "private", "restricted"];

async function fetchMamChannel(network, mode, root, sideKey) {
  // Initialise MAM State
  Mam.init(network);

  let currentRoot = root;

  while (true) {
    const result = await Mam.fetch(currentRoot, mode, sideKey);

    result.messages.forEach((message) => {
      console.log(JSON.parse(trytesToAscii(message)), "\n");
    });

    currentRoot = result.nextRoot;
  }
}

if (process.argv.length >= 5) {
  const network = process.argv[3];

  const mode = process.argv[2];
  if (modes.indexOf(mode) === -1) {
    console.error(`Error: Mode must be one of: ${modes}`);
    process.exit(1);
  }

  const root = process.argv[4];

  // It might be undefined
  const sideKey = process.argv[5];
  if (!sideKey && mode === "restricted") {
    console.error("Error: Restricted mode requires a side key");
  }

  fetchMamChannel(network, mode, root, sideKey);
} else {
  console.log("Usage: fetch-mam <mode> <network> <root> <sideKey>");
}
