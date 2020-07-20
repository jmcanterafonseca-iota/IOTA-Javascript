const Iota = require("@iota/core");
const { mamFetchAll, createChannel, channelRoot } = require("@iota/mam.js");
const { trytesToAscii } = require("@iota/converter");
const { parentPort } = require("worker_threads");

const INTERVAL = 5000;
const CHUNK_SIZE = 10;

async function fetchMamChannel({
  network,
  mode,
  root,
  from,
  sideKey,
  watch,
  limit,
  seed,
}) {
  try {
    // Initialise IOTA API
    const api = Iota.composeAPI({ provider: network });
    return await retrieve({
      api,
      root,
      mode,
      sideKey,
      watch,
      limit,
      from,
      seed,
    });
  } catch (error) {
    console.error("Error while fetching MAM Channel: ", error);
    return null;
  }
}

/* Calculates the start root. from can be different than 0 and in that case a seed has to be provided */
function startRoot({ root, seed, mode, from, sideKey }) {
  if (typeof from === "undefined" && root) {
    return root;
  } else {
    if (typeof from === "undefined") {
      from = 0;
    }
    const channelState = createChannel(seed, 2, mode, sideKey);
    channelState.start = from;

    return channelRoot(channelState);
  }
}

// limit is ignored if watch is on
async function retrieve({
  api,
  root,
  mode,
  sideKey,
  watch,
  limit,
  from,
  seed,
}) {
  let currentRoot = startRoot({ root, seed, mode, from, sideKey });

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

        // eslint-disable-next-line no-await-in-loop
        const fetched = await mamFetchAll(
          api,
          currentRoot,
          mode,
          sideKey,
          chunkSize
        );

        fetched.forEach((result) => {
          parentPort.postMessage(JSON.parse(trytesToAscii(result.message)));
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

  await retrievalFunction();

  let intervalId;
  if (watch === true) {
    intervalId = setInterval(retrievalFunction, INTERVAL);
  }

  return intervalId;
}

async function main(argv) {
  const network = argv.network;
  const mode = argv.mode;
  const root = argv.root;
  const sideKey = argv.sideKey;
  const watch = argv.watch;
  const limit = argv.limit;

  const from = argv.from;
  const seed = argv.seed;

  return await fetchMamChannel({
    network,
    mode,
    root,
    from,
    sideKey,
    watch,
    limit,
    seed,
  });
}

process.on("uncaughtException", (err) => {
  // handle the error safely
  console.error(err);
});

process.on("SIGINT", () => {
  if (globalIntervalId) {
    clearInterval(globalIntervalId);
  }
  process.exit(1);
});

let globalIntervalId;

parentPort.once("message", (argv) => {
  main(argv).then(
    (intervalId) => {
      globalIntervalId = intervalId;
      if (!intervalId) {
        process.exit(0);
      }
    },
    (error) => {
      console.error("Error: ", error);
      process.exit(1);
    }
  );
});
