import ICommandParam from "./ICommandParam";

const globalParams: ICommandParam[] = [
  {
    name: "devnet",
    options: {
      type: "boolean",
      description: "IOTA Devnet"
    }
  },
  {
    name: "comnet",
    options: {
      type: "boolean",
      description: "IOTA Comnet"
    }
  },
  {
    name: "net",
    options: {
      alias: "n",
      type: "string",
      description: "IOTA Network"
    }
  }
];

export default globalParams;
