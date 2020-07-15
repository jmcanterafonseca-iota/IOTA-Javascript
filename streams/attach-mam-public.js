const Mam = require('@iota/mam');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');

const mode = 'public';
const providerName = 'devnet';

const mamExplorerLink = 'https://utils.iota.org/mam';

const seed = 'WDSEYIDVDHGRQMVAVMRLUJZOOWDRGFVJTCIUZCDHVRADMTPJIBKKCHIVOJBRIDGMBDWZYYNJOKEBPCZXP';

async function publish(network, packet, startIndex) {
  // Initialise MAM State
  let mamState = Mam.init(network, seed);
  const treeRoot = Mam.getRoot(mamState);

  mamState.channel.start = startIndex;

  // Create MAM Payload - STRING OF TRYTES
  const trytes = asciiToTrytes(packet);
  const message = Mam.create(mamState, trytes);

  // Attach the payload
  await Mam.attach(message.payload, message.root, 3, 9);

  return { 
            treeRoot: treeRoot,
            thisRoot: message.root, 
            nextIndex: mamState.channel.start 
  };
}


if (process.argv.length >= 4) {
  const network = process.argv[2];

  const messageObj = JSON.parse(process.argv[3]);
  messageObj.timestamp = new Date().toISOString();
  const message = JSON.stringify(messageObj);

  // It might be undefined
  let startIndex = process.argv[4];

  startIndex = startIndex || '0';
  startIndex = parseInt(startIndex);

  publish(network, message, startIndex).then(({treeRoot, thisRoot, nextIndex}) => {
    const result = {
      treeRoot: `${mamExplorerLink}/${treeRoot}/${mode}/${providerName}`,
      thisRoot: `${mamExplorerLink}/${thisRoot}/${mode}/${providerName}`,
      nextIndex: nextIndex
    }
    console.log(result);
  });
}
else {
  console.log('Usage: publish-mam-public <network> <message> <startIndex>');
}
