import globalParams from "./globalParams";
import commandRegistry from "./commandRegistry";
import ICommand from "./ICommand";
import yargs, { Arguments } from "yargs";

export default class IotaxConfigurator {
  public static configure(): Arguments {
    globalParams.forEach(aParam => {
      yargs.option(aParam.name, aParam.options);
    });

    Object.keys(commandRegistry).forEach(name => {
      const command :ICommand = commandRegistry[name];

      yargs.command(command.name, command.description, (yargs) => {
        command.register(yargs);
      });
    });

    yargs.help();

    return yargs();
  }
}
