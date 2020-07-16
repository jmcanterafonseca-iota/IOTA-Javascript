const Iota = require("@iota/core");
const { mamFetchAll } = require("@iota/mam.js");
const { trytesToAscii } = require("@iota/converter");

const modes = ["public", "private", "restricted"];

const INTERVAL = 5000;
const CHUNK_SIZE = 10;

function fetchMamChannel(network, mode, root, sideKey, watch, limit) {
  let doWatch = watch;

  if (typeof watch === "undefined") {
    doWatch = false;
  }

  try {
    // Initialise IOTA API
    const api = Iota.composeAPI({ provider: network });
    retrieve(api, root, mode, sideKey, doWatch, limit);
  } catch (error) {
    console.error("Error while fetching MAM Channel: ", error);
    process.exit(-1);
  }
}

// limit is ignored if watch is on
function retrieve(api, root, mode, sideKey, watch, limit) {
  let currentRoot = root;

  let executing = false;

  let total = 0;

  const retrievalFunction = async () => {
    if (executing === true) {
      return;
    }

    executing = true;

    let finish = false;

    while (!finish) {
      const chunkSize = Math.min(CHUNK_SIZE, limit - total);

      try {
        // console.log('Current Root', currentRoot);
        const fetched = await mamFetchAll(
          api,
          currentRoot,
          mode,
          sideKey,
          chunkSize
        );

        fetched.forEach((result) => {
          console.log(JSON.parse(trytesToAscii(result.message)));
        });

        if (fetched.length > 0) {
          currentRoot = fetched[fetched.length - 1].nextRoot;
          total += fetched.length;
          if (total === limit) {
            finish = true;
          }
        } else {
          finish = true;
        }

        // console.log('Current Root', currentRoot);
      } catch (error) {
        console.error("Error while fetching MAM Channel: ", error);
        finish = true;
      }
    }

    executing = false;
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

  let limit = -1;

  if (!watch) {
    // It might be undefined
    const watchParam = process.argv[6];
    if (watchParam === "-w") {
      watch = true;
    } else {
      // It could be a number indicating the limit of messages to be retrieved
      limit = parseInt(watchParam);
      if (isNaN(limit)) {
        limit = Infinity;
      }
    }
  }

  fetchMamChannel(network, mode, root, sideKey, watch, limit);
} else {
  console.log("Usage: fetch-mam <mode> <network> <root> <sideKey> -w");
}
