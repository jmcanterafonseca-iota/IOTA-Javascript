import {Arguments, Argv} from "yargs";
import ICommand from "../ICommand";
import ICommandParam from "../ICommandParam";

const params: ICommandParam[] = [
  /* TD: To be defined */
];

export default class PublishMamCommand implements ICommand {
  public subCommands: null;
  public name: "publish";

  public execute(args: Arguments): boolean {
    return true;
  }

  public register(yargs: Argv): void {
    params.forEach(aParam => {
      yargs.option(aParam.name, aParam.options);
    });
  }
}
