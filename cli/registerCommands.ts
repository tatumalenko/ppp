import { REST, Routes } from "discord.js";
import commands from "../lib/commands/commands";
import { Config } from "../config/config";

export async function register(config: Config) {
  try {
    const rest = new REST().setToken(config.discord.token);
    console.log(
      `Started refreshing ${commands.length} application (/) commands for guild ${config.discord.guildId}.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = (await rest.put(
      Routes.applicationGuildCommands(
        config.discord.clientId,
        config.discord.guildId
      ),
      { body: commands.map((command) => command.metadata.toJSON()) }
    )) as any[];

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
}
