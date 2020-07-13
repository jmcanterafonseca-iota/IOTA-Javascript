const Iota = require('@iota/core');

const DEFAULT_NETWORK = 'https://nodes.devnet.iota.org';

// The seed that will be used to generate an address
const DEFAULT_SEED =
'PUETPSEITFEVEWCWBTSIZM9NKRGJEIMXTULBACGFRQK9IMGICLBKW9TTEVSDQMGWKBXPVCBMMCXWMNPDX';

async function generateAddress(network) {

  // Connect to a node
  const iota = Iota.composeAPI({
    provider: network
  });

  // Define the security level of the address
  const securityLevel = 2;

  // If this address is spent, this method returns the next unspent address with the lowest index
  // address is an array of addresses
  try {
    const address = await iota.getNewAddress(seed, {
      index: 1,
      securityLevel: securityLevel,
      total: 1
    });

    console.log(`Your address is: ${address}`);
    console.log(`Address Length: ${address[0].length}`);
  }
  catch (err) {
    console.log(err);
  }
}

let network = DEFAULT_NETWORK;
let seed = DEFAULT_SEED;

if (process.argv.length > 3) {
  network = process.argv[2];
  seed = process.argv[3];
}

generateAddress(network, seed);
