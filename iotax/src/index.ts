import IotaxConfigurator from "./iotaxConfigurator";
import {Argv} from "yargs";
import IotaxExecutor from "./iotaxExecutor";

const args: Argv = IotaxConfigurator.configure();

// This will not execute if the command line is not syntactically and semantically correct
IotaxExecutor.execute(args);
