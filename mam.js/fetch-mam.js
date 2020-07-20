const Iota = require("@iota/core");
const { mamFetchAll, createChannel, channelRoot } = require("@iota/mam.js");
const { trytesToAscii, asciiToTrytes } = require("@iota/converter");

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

  await retrievalFunction();

  let intervalId;
  if (watch === true) {
    intervalId = setInterval(retrievalFunction, INTERVAL);
  }

  return intervalId;
}

const argv = require("yargs")
  .option("watch", {
    alias: "w",
    type: "boolean",
    default: false,
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
    default: Infinity,
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
  .help()
  .demandOption(["mode"])
  .conflicts({ devnet: ["comnet", "net"], comnet: ["devnet", "net"] })
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
    if (typeof argv.from !== "undefined" && argv.root) {
      throw new Error(
        "Start index (from) and MAM Channel root are incompatible parameters"
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
