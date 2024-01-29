import { SlashCommandBuilder } from "discord.js";
import { APIEmbed, APIInteractionGuildMember } from "discord-api-types/v10";
import { Interaction } from "../common/Interaction";
import items from "../data/items";
import storages from "../data/storages";
import { CommandResult, throwError } from "../util/utils";
import { Command } from "./command";
import SheetsClient from "../util/sheets";
import { config } from "../../config/config";

const sheetsClient = new SheetsClient();
const commandName = "stock";

enum SubCommand {
  Edit = "edit",
  Move = "move",
}

enum EditOption {
  Item = "item",
  Location = "location",
  Quantity = "quantity",
}

enum MoveOption {
  Item = "item",
  OldLocation = "old-location",
  NewLocation = "new-location",
  Quantity = "quantity",
}

enum EmbedColor {
  LimeGreen = 8584966,
  Red = 15548997,
}

function nameValue(name: string, value: string) {
  return {
    name,
    value,
  };
}

function mentionUser(member: APIInteractionGuildMember) {
  return `<@${member.user.id}>`;
}

function editStockEmbed(
  item: string,
  oldQuantity: number,
  newQuantity: number,
  location: string,
  member: APIInteractionGuildMember
): APIEmbed {
  return {
    title: "EDIT STOCK",
    description: "The following stock was edited successfully.",
    color: EmbedColor.LimeGreen,
    fields: [
      nameValue("Item", item),
      nameValue("Quantity Edited", (newQuantity - oldQuantity).toString()),
      nameValue("Old Quantity", oldQuantity.toString()),
      nameValue("New Quantity", newQuantity.toString()),
      nameValue("Location", location),
    ],
    author: {
      name: member.user.username,
    },
  };
}

function moveStockEmbed(
  item: string,
  oldLocationOldQuantity: number,
  oldLocationNewQuantity: number,
  newLocationOldQuantity: number,
  newLocationNewQuantity: number,
  movedQuantity: number,
  oldLocation: string,
  newLocation: string,
  member: APIInteractionGuildMember
): APIEmbed {
  return {
    title: "MOVE STOCK",
    description: "The following stock was moved successfully.",
    color: EmbedColor.LimeGreen,
    fields: [
      nameValue("Item", item),
      nameValue("Quantity Moved", movedQuantity.toString()),
      nameValue("Previous Location", oldLocation),
      nameValue("New Location", newLocation),
      nameValue(
        `${oldLocation} Old Quantity`,
        oldLocationOldQuantity.toString()
      ),
      nameValue(
        `${oldLocation} New Quantity`,
        oldLocationNewQuantity.toString()
      ),
      nameValue(
        `${newLocation} Old Quantity`,
        newLocationOldQuantity.toString()
      ),
      nameValue(
        `${newLocation} New Quantity`,
        newLocationNewQuantity.toString()
      ),
    ],
    author: {
      name: member.user.username,
    },
  };
}

function errorEmbed(text: string, member: APIInteractionGuildMember): APIEmbed {
  return {
    title: "ERROR",
    description: "The stock command failed with an error.",
    color: EmbedColor.Red,
    fields: [nameValue("Reason", text)],
    author: {
      name: member.user.username,
    },
  };
}

async function handleEditSubCommand(interaction: Interaction): Promise<void> {
  const member = interaction.getEvent().member ?? throwError("invalid member");
  const usedCommandText = `${mentionUser(
    member
  )} used the \`/stock edit\` command`;
  const input = {
    item:
      interaction.getString(EditOption.Item) ??
      throwError("input.item cannot be null"),
    location:
      interaction.getString(EditOption.Location) ??
      throwError("input.location cannot be null"),
    quantity:
      interaction.getInteger(EditOption.Quantity) ??
      throwError("input.quantity cannot be null"),
  };
  const storage =
    storages.find((storage) => storage.id === input.location) ??
    throwError(`No matching option for '${input.location}' in storages data`);
  const item =
    items.find((item) => item.id === input.item) ??
    throwError(`No matching option for '${input.item}' in items data`);
  const cell = `${storage.column}${item.row}`;

  const oldQuantity = Number(
    await sheetsClient.getCell(
      config.google.sheetId,
      config.google.tabName,
      cell
    )
  );
  const newQuantity = oldQuantity + input.quantity;
  const isNegativeQuantity = newQuantity < 0;

  if (isNegativeQuantity) {
    await interaction.reply(usedCommandText, [
      errorEmbed(
        `Did not update \`${item.name}\` since new quantity would be negative.
            Location = \`${storage.name}\`
            Edited = \`${input.quantity}\`
            Current = \`${oldQuantity}\`
            New = \`${newQuantity}\``,
        member
      ),
    ]);
  } else {
    const _ = await sheetsClient.updateCell(
      config.google.sheetId,
      config.google.tabName,
      cell,
      newQuantity
    );
    await interaction.reply(usedCommandText, [
      editStockEmbed(item.name, oldQuantity, newQuantity, storage.name, member),
    ]);
  }
}

async function handleMoveSubCommand(interaction: Interaction): Promise<void> {
  const member = interaction.getEvent().member ?? throwError("invalid member");
  const usedCommandText = `${mentionUser(
    member
  )} used the \`/stock move\` command`;
  const input = {
    item:
      interaction.getString(MoveOption.Item) ??
      throwError("input.item cannot be null"),
    oldLocation:
      interaction.getString(MoveOption.OldLocation) ??
      throwError("input.old-location cannot be null"),
    newLocation:
      interaction.getString(MoveOption.NewLocation) ??
      throwError("input.new-location cannot be null"),
    quantity:
      interaction.getInteger(MoveOption.Quantity) ??
      throwError("input.quantity cannot be null"),
  };
  const item =
    items.find((item) => item.id === input.item) ??
    throwError(`No matching option for '${input.item}' in items data`);
  const oldLocation =
    storages.find((storage) => storage.id === input.oldLocation) ??
    throwError(
      `No matching option for '${input.oldLocation}' in storages data`
    );
  const newLocation =
    storages.find((storage) => storage.id === input.newLocation) ??
    throwError(
      `No matching option for '${input.newLocation}' in storages data`
    );
  const isSameLocation = oldLocation === newLocation;
  if (isSameLocation) {
    await interaction.reply(usedCommandText, [
      errorEmbed(
        `Did not update \`${item.name}\` since storage is the same, should be different storages.
            Location = \`${oldLocation.name}\``,
        member
      ),
    ]);
    return;
  }

  const isInputQuantityNegative = input.quantity < 0;
  if (isInputQuantityNegative) {
    await interaction.reply(usedCommandText, [
      errorEmbed(
        `Did not update \`${item.name}\` since moved quantity is negative, should always be positive.
            Moved = \`${input.quantity}\``,
        member
      ),
    ]);
    return;
  }

  const oldLocationCell = `${oldLocation.column}${item.row}`;
  const newLocationCell = `${newLocation.column}${item.row}`;

  const oldLocationQuantity = Number(
    await sheetsClient.getCell(
      config.google.sheetId,
      config.google.tabName,
      oldLocationCell
    )
  );
  const newLocationQuantity = Number(
    await sheetsClient.getCell(
      config.google.sheetId,
      config.google.tabName,
      newLocationCell
    )
  );
  const oldLocationNewQuantity = oldLocationQuantity - input.quantity;
  const isOldLocationQuantityNowNegative = oldLocationNewQuantity < 0;
  const newLocationNewQuantity = newLocationQuantity + input.quantity;

  if (isOldLocationQuantityNowNegative) {
    await interaction.reply(usedCommandText, [
      errorEmbed(
        `Did not update \`${item.name}\` since new quantity would be negative.
            Location = \`${oldLocation}\`
            Moved = \`${input.quantity}\`
            Current = \`${oldLocationQuantity}\`
            New = \`${oldLocationNewQuantity}\``,
        member
      ),
    ]);
  } else {
    await sheetsClient.updateCell(
      config.google.sheetId,
      config.google.tabName,
      oldLocationCell,
      oldLocationNewQuantity
    );
    await sheetsClient.updateCell(
      config.google.sheetId,
      config.google.tabName,
      newLocationCell,
      newLocationNewQuantity
    );
    await interaction.reply(usedCommandText, [
      moveStockEmbed(
        item.name,
        oldLocationQuantity,
        oldLocationNewQuantity,
        newLocationQuantity,
        newLocationNewQuantity,
        input.quantity,
        oldLocation.name,
        newLocation.name,
        member
      ),
    ]);
  }
}

export default {
  name: commandName,
  metadata: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Stock Inventory")
    .addSubcommand((subCommand) =>
      subCommand
        .setName(SubCommand.Edit)
        .setDescription("Edit (add/remove) items from stock inventories")
        .addStringOption((option) =>
          option
            .setName(EditOption.Item)
            .setDescription("Item being added/removed from inventory")
            .setRequired(true)
            .addChoices(
              ...items.map((item) => ({ name: item.name, value: item.id }))
            )
        )
        .addStringOption((option) =>
          option
            .setName(EditOption.Location)
            .setDescription("Inventory location item added/removed to/from")
            .setRequired(true)
            .addChoices(
              ...storages.map((storage) => ({
                name: storage.name,
                value: storage.id,
              }))
            )
        )
        .addIntegerOption((option) =>
          option
            .setName(EditOption.Quantity)
            .setDescription(
              "Quantity of item being added/removed from inventory"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName(SubCommand.Move)
        .setDescription("Move items from one stock inventory to another")
        .addStringOption((option) =>
          option
            .setName(MoveOption.Item)
            .setDescription("Item being moved from inventory")
            .setRequired(true)
            .addChoices(
              ...items.map((item) => ({ name: item.name, value: item.id }))
            )
        )
        .addStringOption((option) =>
          option
            .setName(MoveOption.OldLocation)
            .setDescription(
              "Old inventory location that items are being moved from"
            )
            .setRequired(true)
            .addChoices(
              ...storages.map((storage) => ({
                name: storage.name,
                value: storage.id,
              }))
            )
        )
        .addStringOption((option) =>
          option
            .setName(MoveOption.NewLocation)
            .setDescription(
              "New inventory location that items are being moved to"
            )
            .setRequired(true)
            .addChoices(
              ...storages.map((storage) => ({
                name: storage.name,
                value: storage.id,
              }))
            )
        )
        .addIntegerOption((option) =>
          option
            .setName(MoveOption.Quantity)
            .setDescription(
              "Quantity of item being added/removed from inventory"
            )
            .setRequired(true)
        )
    ),
  handler: async (interaction: Interaction): Promise<CommandResult> => {
    console.log(interaction);
    const subCommand = interaction.getSubcommand();
    switch (subCommand) {
      case SubCommand.Edit:
        await handleEditSubCommand(interaction);
      case SubCommand.Move:
        await handleMoveSubCommand(interaction);
      default:
        throwError(`subcommand ${subCommand} invalid`);
    }
  },
} as Command;
