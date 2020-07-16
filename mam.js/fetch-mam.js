const Iota = require("@iota/core");
const { mamFetchAll } = require("@iota/mam.js");
const { trytesToAscii } = require("@iota/converter");

const modes = ["public", "private", "restricted"];

const INTERVAL = 5000;

function fetchMamChannel(network, mode, root, sideKey) {
  try {
    // Initialise IOTA API
    const api = Iota.composeAPI({ provider: network });
    retrieve(api, root, mode, sideKey);
  } catch (error) {
    console.error("Error while fetching MAM Channel: ", error);
    process.exit(-1);
  }
}

function retrieve(api, root, mode, sideKey) {
  let currentRoot = root;

  setInterval(async () => {
    try {
      // console.log('Current Root', currentRoot);

      const fetched = await mamFetchAll(api, currentRoot, mode, sideKey);

      fetched.forEach((result) => {
        console.log(JSON.parse(trytesToAscii(result.message)), "\n");
      });

      if (fetched.length > 0) {
        currentRoot = fetched[fetched.length - 1].nextRoot;
      }

      // console.log('Current Root', currentRoot);
    } catch (error) {
      console.error("Error while fetching MAM Channel: ", error);
    }
  }, INTERVAL);
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
    process.exit(1);
  }

  fetchMamChannel(network, mode, root, sideKey);
} else {
  console.log("Usage: fetch-mam <mode> <network> <root> <sideKey>");
}
