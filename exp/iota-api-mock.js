const channel = new MamChannel().with({
  provider: "",
  mode: "",
  seed: "",
  sideKey: "",
  root: "",
  from: "",
});

const network = new IotaNetwork.with({
  provider: "",
});

const transaction = new IotaDataTransaction.with({
  provider: "",
  seed: "",
  message: "",
});

const address = new IotaAddress.with({});

const result = transaction.send();
const status = transaction.status();

const { root, nextIndex, explorer } = channel.publish(index);

const { fetched } = channel.fetch(limit);
