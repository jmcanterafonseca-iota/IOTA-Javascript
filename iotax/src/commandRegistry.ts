import ICommand from "./ICommand";
import MamCommand from "./commands/mamCommand";

const commandRegistry: Record<string, ICommand> = {
  'mam': new MamCommand()
};

export default commandRegistry;
