// Require the IOTA library
const Iota = require('@iota/core');
const Extract = require('@iota/extract-json');

// provider: 'https://nodes.thetangle.org'
// provider: 'https://nodes.devnet.iota.org'
async function readIOTATransaction(iotaNetwork, tailTransactionHash) {
  // Create a new instance of the IOTA API object
  // Use the `provider` field to specify which node to connect to
  const iota = Iota.composeAPI({
    provider: iotaNetwork
  });

  try {
    const bundle = await iota.getBundle(tailTransactionHash);
    console.log('Bundle: ', bundle);

    // Extract and parse the JSON messages from the transactions' `signatureMessageFragment` fields
    console.log(JSON.parse(Extract.extractJson(bundle)));
  }
  catch (err) {
    console.error(err);
  }
}

let iotaNetwork = 'https://nodes.devnet.iota.org';
let tailTransactionHash = 'HEVJGC9DCOCOWMOOXYZOLNNHYHPVEBI9CNAUBMALLVECCCFCYWYN9HHNLCBQGYIWJJXZE9AYPWCUAE999';

if (process.argv.length > 3) {
  iotaNetwork = process.argv[2];
  tailTransactionHash = process.argv[3];
}

readIOTATransaction(iotaNetwork, tailTransactionHash);
