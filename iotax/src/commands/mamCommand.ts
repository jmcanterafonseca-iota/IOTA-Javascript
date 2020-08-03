import { Arguments, Argv } from "yargs";
import ICommand from "../ICommand";
import ICommandParam from "../ICommandParam";
import FetchMamCommand from "./fetchMamCommand";
import PublishMamCommand from "./publishMamCommand";

const params: ICommandParam[] = [{
  name: "mode", options: {
    alias: "m",
    type: "string",
    description: "MAM Channel mode",
    choices: ["public", "private", "restricted"]
  }
}
];

const subCommands: Record<string, ICommand> = {
  fetch: new FetchMamCommand(),
  publish: new PublishMamCommand()
};

export default class MamCommand implements ICommand {
  public name: "mam";
  public subCommands: Record<string, ICommand> = subCommands;

  public execute(args: Arguments): boolean {
    return true;
  }

  public register(yargs: Argv): void {
    params.forEach(aParam => {
      yargs.option(aParam.name, aParam.options);
    });

    Object.keys(subCommands).forEach(name => {
      const command: ICommand = subCommands[name];

      command.register(yargs);
    });
  }
}
