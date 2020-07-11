const Iota = require('@iota/core');

const DEFAULT_NETWORK = 'https://nodes.devnet.iota.org';

async function generateAddress(network) {

  // Connect to a node
  const iota = Iota.composeAPI({
    provider: network
  });

  // Define the security level of the address
  const securityLevel = 2;

  // The seed that will be used to generate an address
  const seed =
    'PUETPSEITFEVEWCWBTSIZM9NKRGJEIMXTULBACGFRQK9IMGICLBKW9TTEVSDQMGWKBXPVCBMMCXWMNPDX';

  // If this address is spent, this method returns the next unspent address with the lowest index
  // address is an array of addresses
  try {
    const address = await iota.getNewAddress(seed, {
      index: 100,
      securityLevel: securityLevel,
      total: 4
    });

    console.log(`Your address is: ${address}`);
    console.log(`Address Length: ${address[0].length}`);
  }
  catch (err) {
    console.log(err);
  }
}

let network = DEFAULT_NETWORK;

if (process.argv.length > 2) {
  network = process.argv[2];
}

generateAddress(network);
