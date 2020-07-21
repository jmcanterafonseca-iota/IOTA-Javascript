const Iota = require("@iota/core");
const {
  mamFetchAll,
  createChannel,
  channelRoot,
  mamFetchCombined,
} = require("@iota/mam.js");
const { trytesToAscii } = require("@iota/converter");

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
  partitions,
}) {
  try {
    // Initialise IOTA API
    const api = Iota.composeAPI({ provider: network });

    if (partitions > 1) {
      return await retrievePartitionedCombined({
        api,
        mode,
        sideKey,
        limit,
        from,
        seed,
        partitions,
      });
    }

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

// Partitions a MAM Channel with the size specified
function createPartitions({ from, seed, partitionSize, sideKey, limit, mode }) {
  const partitions = [];

  let current = from;
  while (current < limit) {
    const channelState = createChannel(seed, 2, mode, sideKey);

    channelState.start = current;

    const channelDetails = {
      root: channelRoot(channelState),
      mode,
      sideKey,
    };
    partitions.push(channelDetails);

    current += partitionSize;
  }

  return partitions;
}

function retrievePartitionedCombined({
  api,
  mode,
  sideKey,
  limit,
  from,
  seed,
  partitions,
}) {
  return new Promise((resolve, reject) => {
    let partitionSize = Math.floor(limit / partitions);

    if (partitionSize === 0) {
      partitionSize = limit;
    }

    if (typeof from === "undefined") {
      from = 0;
    }

    const channels = createPartitions({
      from,
      seed,
      partitionSize,
      sideKey,
      limit,
      mode,
    });

    let total = 0;

    const retrievalFunction = async () => {
      try {
        const fetched = await mamFetchCombined(api, channels);

        for (let k = 0; k < fetched.length; k++) {
          console.log(JSON.parse(trytesToAscii(fetched[k].message)));
          channels[k].root = fetched[k].nextRoot;
        }

        if (fetched.length > 0) {
          total += fetched.length;
          if (total < limit) {
            setImmediate(retrievalFunction);
          }
        } else {
          resolve();
        }
      } catch (error) {
        console.error("Error while fetching MAM Channel: ", error);
        reject(error);
      }
    };

    setImmediate(retrievalFunction);
  });
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

const argv = require("yargs")
  .option("watch", {
    alias: "w",
    type: "boolean",
    description: "Watch the MAM Channel",
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
  .option("root", {
    alias: "r",
    type: "string",
    description: "MAM Channel's root",
  })
  .option("sidekey", {
    type: "string",
    description: "Sidekey for restricted channels",
    default: null,
  })
  .option("limit", {
    alias: "l",
    type: "number",
    description: "Maximum number of messages to be fetched",
  })
  .option("from", {
    alias: "f",
    type: "number",
    description: "Start Index for retrieval",
  })
  .option("seed", {
    alias: "s",
    type: "string",
    description: "MAM Channel's seed",
  })
  .option("chunksize", {
    type: "number",
    description: "Chunksize for retrieval",
  })
  .option("partitions", {
    type: "number",
    description: "Number of partitions to use when fetching",
    default: 1,
  })
  .help()
  .demandOption(["mode"])
  .conflicts({
    devnet: ["comnet", "net"],
    comnet: ["devnet", "net"],
    root: ["from"],
    limit: ["watch"],
    partitions: ["watch"],
  })
  // eslint-disable-next-line no-shadow
  .check((argv) => {
    if (argv.mode === "restricted" && !argv.sidekey) {
      throw new Error("Missing sidekey for fetching a MAM restricted channel");
    }
    if (!argv.net && !argv.devnet && !argv.comnet) {
      throw new Error(
        "Missing network. Use --devnet, --comnet or provide a custom URL using --net"
      );
    }
    if (typeof argv.from !== "undefined" && !argv.seed) {
      throw new Error(
        "Missing seed. Seed must be provided when start index (from) is provided"
      );
    }
    if (typeof argv.from === "undefined" && !argv.root && !argv.seed) {
      throw new Error("Missing MAM Channel's root or seed");
    }
    return true;
  }).argv;

async function main() {
  let network = argv.net;

  if (argv.devnet) {
    network = "https://nodes.devnet.iota.org";
  }

  if (argv.comnet) {
    network = "https://nodes.comnet.thetangle.org";
  }

  const mode = argv.mode;
  const root = argv.root;
  const sideKey = argv.sidekey;
  let watch = argv.watch;
  if (typeof watch === "undefined") {
    watch = false;
  }
  const limit = argv.limit || Infinity;

  const from = argv.from;
  const seed = argv.seed;

  const maxChunkSize = argv.chunksize || CHUNK_SIZE;

  const partitions = argv.partitions;

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
    partitions,
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

main().then(
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
