////////////////////////////////////////////////
// Check the balance of an address
////////////////////////////////////////////////

// Require the IOTA library
const Iota = require("@iota/core");

async function checkBalance(network, address) {
  try {
    // Connect to a node
    const iota = Iota.composeAPI({
      provider: network,
    });
    const result = await iota.getBalances([address]);

    console.log(result.balances[0]);
  } catch (err) {
    console.error(err);
  }
}

if (process.argv.length >= 4) {
  const network = process.argv[2];
  const address = process.argv[3];

  checkBalance(network, address);
} else {
  console.log(`Usage: iota-check-balance <network> <address>`);
}
