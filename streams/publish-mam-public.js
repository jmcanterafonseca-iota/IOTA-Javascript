const Mam = require('@iota/mam');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');

const mode = 'public';
const providerName = 'devnet';

const mamExplorerLink = 'https://utils.iota.org/mam';

const seed = 'WDSEYIDVDHGRQMVAVMRLUJZOOWDRGFVJTCIUZCDHVRADMTPJIBKKCHIVOJBRIDGMBDWZYYNJOKEBPCZXP';

async function publish(network, packet, startIndex) {
  // Initialise MAM State
  let mamState = Mam.init(network, seed);
  mamState.channel.start = startIndex;

  console.log(mamState);

  // Create MAM Payload - STRING OF TRYTES
  const trytes = asciiToTrytes(packet);
  const message = Mam.create(mamState, trytes);

  // Attach the payload
  await Mam.attach(message.payload, message.root, 3, 9);

  return { 
            root: message.root, 
            nextRoot: mamState.channel.next_root, 
            nextIndex: mamState.channel.start 
  };
}


if (process.argv.length >= 4) {
  const network = process.argv[2];
  const message = JSON.stringify(JSON.parse(process.argv[3]));
  // It might be undefined
  let startIndex = process.argv[4];

  startIndex = startIndex || '0';
  startIndex = parseInt(startIndex);

  publish(network, message, startIndex).then(({root, nextRoot, nextIndex}) => {
    const result = {
      explorer: `${mamExplorerLink}/${root}/${mode}/${providerName}`,
      nextIndex: nextIndex,
      nextRoot: nextRoot
    }
    console.log(result);
  });
}
else {
  console.log('Usage: publish-mam-public <network> <message> <startIndex>');
}
