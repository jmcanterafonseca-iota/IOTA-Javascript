import { Argv } from "yargs";

export default interface ICommand {
  name: string,
  subCommands: Record<string, ICommand>,
  description?: string,

  register(yargs): void,
  execute(parameters: Argv): boolean,
};
