// Require the IOTA library
const Iota = require('@iota/core');
const Converter = require('@iota/converter');

// provider: 'https://nodes.thetangle.org'
// provider: 'https://nodes.devnet.iota.org'
async function makeIOTATransaction(iotaNetwork) {
  // Create a new instance of the IOTA API object
  // Use the `provider` field to specify which node to connect to
  const iota = Iota.composeAPI({
    provider: iotaNetwork
  });


  const depth = 3;
  const minimumWeightMagnitude = 9;

  // Define a seed and an address. It does not need to belong to anyone or have IOTA tokens.
  // They must only contain a maximum of 81 trytes or 90 trytes with a valid checksum
  const address =
    'HEQLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWOR99D';

  const seed =
    'PUEOTSEITFEVEWCWBTSIZM9NKRGJEIMXTULBACGFRQK9IMGICLBKW9TTEVSDQMGWKBXPVCBMMCXWMNPDX';

  // Define a message to send.
  // This message must include only ASCII characters.
  const message = JSON.stringify({ message: "Hello JMCF" });
  // This is still valid JSON as it is between quotes
  const message2 = '"hello, how are you doing"';

  // Convert the message to trytes
  const messageInTrytes = Converter.asciiToTrytes(message);
  const messageInTrytes2 = Converter.asciiToTrytes(message2);

  // Define a zero-value transaction object that sends the message to the address
  const transfers = [
    {
      value: 0,
      address: address,
      message: messageInTrytes
    }/*,
        {
            value: 0,
            address: address,
            message: messageInTrytes2
        }*/
  ];

  // Create a bundle from the `transfers` array and send the transaction to the node
  try {
    // The seed allows to identify from which address the transfer should be done
    // i.e. to generated the proper private key
    const trytes = await iota.prepareTransfers(seed, transfers);
    const bundles = await iota.sendTrytes(trytes, depth, minimumWeightMagnitude);
    console.log(bundles);

    bundles.forEach(bundle => {
      console.log(`Hash: ${bundle.hash}`);
    });
  }
  catch (err) {
    console.error(err)
  };
}

let iotaNetwork = 'https://nodes.devnet.iota.org';

if (process.argv.length > 2) {
  iotaNetwork = process.argv[2];
}

makeIOTATransaction(iotaNetwork);
