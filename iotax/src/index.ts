import yargs, { Arguments } from "yargs";
import IotaxConfigurator from "./iotaxConfigurator";
import IotaxExecutor from "./iotaxExecutor";

const args: Arguments = IotaxConfigurator.parseCommandLine(yargs);

// This will not execute if the command line is not syntactically and semantically correct
IotaxExecutor.execute(args);
