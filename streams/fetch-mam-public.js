const Mam = require('@iota/mam');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter'); 

const mode = 'public';

const seed = 'WDSEYIDVDHGRQMVAVMRLUJZOOWDRGFVJTCIUZCDHVRADMTPJIBKKCHIVOJBRIDGMBDWZYYNJOKEBPCZXP';


async function fetchMamChannel(network, root) {
  // Initialise MAM State
  Mam.init(network, seed);

  let currentRoot = root;

  while(true) {
    const result = await Mam.fetch(currentRoot, mode);

    result.messages.forEach(message => {
      console.log(JSON.parse(trytesToAscii(message)), '\n');
    });

    currentRoot = result.nextRoot;
  }
}

if (process.argv.length >= 4) {
  const network = process.argv[2];
  const root = process.argv[3];

  fetchMamChannel(network, root);
}
else {
  console.log('Usage: fetch-mam-public <network> <root>');
}
