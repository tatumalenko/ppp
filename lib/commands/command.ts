import { SlashCommandBuilder } from "discord.js";
import { Interaction } from "../common/Interaction";
import { CommandResult } from "../util/utils";

export interface Command {
  name: string;
  metadata: SlashCommandBuilder;
  handler: (interaction: Interaction) => Promise<CommandResult>;
}
