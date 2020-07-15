/////////////////////////////////////////////////
// Send a microtransaction
////////////////////////////////////////////////

const Iota = require("@iota/core");

// Define the depth that the node will use for tip selection
const depth = 3;
// Define the minimum weight magnitude for the network
const minimumWeightMagnitude = 10;

// Create a wrapping function so you can use async/await
async function transfer(network, seed, receivingAddress, amount) {
  const iota = Iota.composeAPI({
    provider: network,
  });

  // Define an input transaction object
  // that sends 1 i to your new address
  const transfers = [
    {
      value: amount,
      address: receivingAddress,
    },
  ];

  console.log(`Sending ${amount}i to ${receivingAddress}`);

  try {
    // Construct bundle and convert to trytes
    const trytes = await iota.prepareTransfers(seed, transfers);
    // Send bundle to node.
    const response = await iota.sendTrytes(
      trytes,
      depth,
      minimumWeightMagnitude
    );

    console.log("Bundle sent");
    response.map((tx) => console.log(tx));
  } catch (error) {
    console.log(error);
  }
}

if (process.argv.length >= 6) {
  const network = process.argv[2];
  const seed = process.argv[3];
  const receivingAddress = process.argv[4];
  const amount = parseFloat(process.argv[5]);

  transfer(network, seed, receivingAddress, amount);
} else {
  console.log(
    `Usage: iota-value-transaction <network> <seed> <receivingAddress> <amount>`
  );
}
