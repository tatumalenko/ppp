#!/usr/bin/env node
import yargs, { Argv } from "yargs";
import { register } from "./registerCommands";
import { devConfig, prodConfig } from "../config/config";

enum Env {
  Dev = "dev",
  Prod = "prod",
}

const argv = yargs(process.argv.slice(2))
  .options({
    env: {
      type: "string",
      choices: [Env.Dev, Env.Prod] as const,
      demandOption: true,
    },
  })
  .parseSync();

(async () => {
  const config = argv.env === Env.Dev ? devConfig : prodConfig;
  await register(config);
})();
