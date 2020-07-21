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
  maxChunkSize,
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
      maxChunkSize,
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
function retrieve({
  api,
  root,
  mode,
  sideKey,
  watch,
  limit,
  from,
  seed,
  maxChunkSize,
}) {
  return new Promise((resolve, reject) => {
    let currentRoot = startRoot({ root, seed, mode, from, sideKey });

    let total = 0;

    let executing = false;

    const retrievalFunction = async () => {
      if (executing === true) {
        return;
      }

      executing = true;

      const chunkSize = Math.min(maxChunkSize, limit - total);

      try {
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
          if (total < limit) {
            setImmediate(retrievalFunction);
          }
        } else if (watch === true && !globalIntervalId) {
          const intervalId = setInterval(retrievalFunction, INTERVAL);
          resolve(intervalId);
        } else {
          resolve();
        }
        // console.log('Current Root', currentRoot);
      } catch (error) {
        console.error("Error while fetching MAM Channel: ", error);
        reject(error);
      } finally {
        executing = false;
      }
    };

    setImmediate(retrievalFunction);
  }); // end of promise
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

  const maxChunkSize = argv.chunksize || CHUNK_SIZE;

  return await fetchMamChannel({
    network,
    mode,
    root,
    from,
    sideKey,
    watch,
    limit,
    seed,
    maxChunkSize,
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
