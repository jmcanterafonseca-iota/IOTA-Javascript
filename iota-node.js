// Require the IOTA library
const Iota = require("@iota/core");

// IOTA mainnet: 'https://nodes.thetangle.org'
// IOTA devnet: 'https://nodes.devnet.iota.org'
async function printIOTANodeInfo(iotaNetwork) {
  // Create a new instance of the IOTA API object
  // Use the `provider` field to specify which node to connect to
  const iota = Iota.composeAPI({
    provider: iotaNetwork,
  });

  // Call the `getNodeInfo()` method for information about the IOTA node and the Tangle
  try {
    const nodeInfo = await iota.getNodeInfo();
    console.log(nodeInfo);
  } catch (err) {
    console.log(err);
  }
}

let iotaNetwork = "https://nodes.devnet.iota.org";

if (process.argv.length > 2) {
  iotaNetwork = process.argv[2];
}

printIOTANodeInfo(iotaNetwork);
