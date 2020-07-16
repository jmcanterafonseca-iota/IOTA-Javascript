const Iota = require("@iota/core");
const { mamFetchAll } = require("@iota/mam.js");
const { trytesToAscii } = require("@iota/converter");

const modes = ["public", "private", "restricted"];

const INTERVAL = 4000;
const CHUNK_SIZE = 5;

function fetchMamChannel(network, mode, root, sideKey, watch) {
  let doWatch = watch;

  if (typeof watch === "undefined") {
    doWatch = false;
  }

  try {
    // Initialise IOTA API
    const api = Iota.composeAPI({ provider: network });
    retrieve(api, root, mode, sideKey, doWatch);
  } catch (error) {
    console.error("Error while fetching MAM Channel: ", error);
    process.exit(-1);
  }
}

function retrieve(api, root, mode, sideKey, watch) {
  let currentRoot = root;

  let executing = false;

  const retrievalFunction = async () => {
    if (executing === true) {
      return;
    }

    executing = true;

    let finish = false;

    while (!finish) {
      try {
        // console.log('Current Root', currentRoot);
        const fetched = await mamFetchAll(
          api,
          currentRoot,
          mode,
          sideKey,
          CHUNK_SIZE
        );

        fetched.forEach((result) => {
          console.log(JSON.parse(trytesToAscii(result.message)));
        });

        if (fetched.length > 0) {
          currentRoot = fetched[fetched.length - 1].nextRoot;
        } else {
          finish = true;
        }

        // console.log('Current Root', currentRoot);
      } catch (error) {
        console.error("Error while fetching MAM Channel: ", error);
        finish = true;
        executing = false;
      }
      executing = false;
    }
  };

  if (watch === true) {
    setInterval(retrievalFunction, INTERVAL);
  } else {
    retrievalFunction();
  }
}

if (process.argv.length >= 5) {
  const network = process.argv[3];

  let watch = false;

  const mode = process.argv[2];
  if (modes.indexOf(mode) === -1) {
    console.error(`Error: Mode must be one of: ${modes}`);
    process.exit(1);
  }

  const root = process.argv[4];

  // It might be undefined or the watch flag
  let sideKey = process.argv[5];
  if (!sideKey) {
    if (mode === "restricted") {
      console.error("Error: Restricted mode requires a side key");
      process.exit(1);
    }
  } else if (sideKey === "-w" && mode === "restricted") {
    console.error("Error: Restricted mode requires a side key");
    process.exit(1);
  } else if (sideKey === "-w") {
    sideKey = null;
    watch = true;
  }

  console.log(watch);

  if (!watch) {
    // It might be undefined
    const watchParam = process.argv[6];
    if (watchParam === "-w") {
      watch = true;
    }
  }

  fetchMamChannel(network, mode, root, sideKey, watch);
} else {
  console.log("Usage: fetch-mam <mode> <network> <root> <sideKey> -w");
}
