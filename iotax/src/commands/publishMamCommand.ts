import ICommandParam from "../ICommandParam";
import ICommand from "../ICommand";

const params: ICommandParam[] = [
  /** TODO: To be defined */
];

export default class PublishMamCommand implements ICommand {
  subCommands: null;
  name: "publish";

  public execute(): boolean {
    return true;
  }

  public register(yargs): void {
    params.forEach(aParam => {
      yargs.option(aParam.options, aParam.options);
    });
  }
}
