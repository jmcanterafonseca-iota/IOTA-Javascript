import ICommand from "../ICommand";
import ICommandParam from "../ICommandParam";
import FetchMamCommand from "./fetchMamCommand";
import PublishMamCommand from "./publishMamCommand";
import { Argv } from "yargs";

const params: ICommandParam[] = [
  {
    name: "m",
    options: {
      alias: "r",
      type: "string",
      description: "MAM Channel's root",
    }
  }
];

const subCommands: Record<string, ICommand> = {
  'fetch': new FetchMamCommand(),
  'publish': new PublishMamCommand()
}

export default class MamCommand implements ICommand {
  name: 'mam';
  subCommands: Record<string, ICommand> = subCommands;

  public execute(parameters: Argv): boolean {
    return true;
  }

  public register(yargs): void {
    Object.keys(subCommands).forEach(name => {
      const command: ICommand = subCommands[name];

      command.register(yargs);
    });
  }
};
