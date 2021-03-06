/**
 *
 *    See  https://medium.com/@nodesource/understanding-worker-threads-in-node-js-2c854dfd291c
 *
 *    See https://blog.insiderattack.net/deep-dive-into-worker-threads-in-node-js-e75e10546b11
 *
 */

const { Worker } = require("worker_threads");

// Default Maximum number of workers launched
const MAX_WORKERS = 5;
// Ideal chunk per worker by default
const CHUNK_PER_WORKER = 10;

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
  .option("workers", {
    type: "number",
    default: MAX_WORKERS,
    description: "Number of workers",
  })
  .option("chunksize", {
    type: "number",
    default: CHUNK_PER_WORKER,
    description: "Chunk size for retrieval",
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

function main() {
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

  const from = argv.from || 0;
  const seed = argv.seed;

  const maxWorkers = argv.workers || MAX_WORKERS;
  const chunkPerWorker = argv.chunksize || CHUNK_PER_WORKER;

  // Ideal Maximum number of workers for the limit requested
  let numWorkers = Math.floor(limit / chunkPerWorker);

  if (limit % chunkPerWorker !== 0) {
    numWorkers += 1;
  }
  numWorkers = Math.min(maxWorkers, numWorkers);

  // The real chunk size for each worker
  const workerChunkSize = Math.floor(limit / numWorkers);

  console.log(numWorkers, " ", workerChunkSize);

  for (let k = 0; k < numWorkers; k++) {
    const workerFrom = from + k * workerChunkSize;
    let workerLimit = workerChunkSize;
    // Last worker has to be in charge of the remaining
    if (k === numWorkers - 1) {
      workerLimit += limit % numWorkers;
    }

    console.log(workerFrom, " ", workerLimit);

    const workerInitParams = {
      network,
      mode,
      root,
      from: workerFrom,
      sideKey,
      watch,
      limit: workerLimit,
      seed,
      chunksize: argv.chunksize,
    };

    const worker = new Worker("./exp/worker-mam-fetch.js", {
      workerData: workerInitParams,
    });
    worker.on("message", (message) => console.log(message));
  }
}

process.on("uncaughtException", (err) => {
  // handle the error safely
  console.error(err);
});

process.on("SIGINT", () => {
  process.exit(1);
});

main();
