import { APIGatewayEvent, SNSMessage } from "aws-lambda";
import {
  CommandResult,
  DiscordReply,
  discordRequest,
  throwError,
} from "../util/utils";
import {
  InteractionType,
  APIEmbed,
  APIChatInputApplicationCommandInteraction,
  APIInteraction,
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataOption,
  APIPingInteraction,
  APIApplicationCommandInteractionDataSubcommandOption,
  ApplicationCommandOptionType,
  APIApplicationCommandInteractionDataStringOption,
  APIApplicationCommandInteractionDataIntegerOption,
  Routes,
} from "discord-api-types/v10";
import { RequestMethod } from "discord.js";

function isPing(event: APIInteraction): event is APIPingInteraction {
  return event.type === InteractionType.Ping;
}

function isCommand(
  event: APIInteraction
): event is APIApplicationCommandInteraction {
  return event.type === InteractionType.ApplicationCommand;
}

function isSubcommandOption(
  option: APIApplicationCommandInteractionDataOption
): option is APIApplicationCommandInteractionDataSubcommandOption {
  return option.type === ApplicationCommandOptionType.Subcommand;
}

function isStringCommandOption(
  option: APIApplicationCommandInteractionDataOption
): option is APIApplicationCommandInteractionDataStringOption {
  return option.type === ApplicationCommandOptionType.String;
}

function isIntegerCommandOption(
  option: APIApplicationCommandInteractionDataOption
): option is APIApplicationCommandInteractionDataIntegerOption {
  return option.type === ApplicationCommandOptionType.Integer;
}

function isAPIGatewayEvent(
  event: APIGatewayEvent | SNSMessage
): event is APIGatewayEvent {
  return Object.keys(event).includes("body");
}

export class Interaction {
  private event: APIChatInputApplicationCommandInteraction;
  private options: Map<string, APIApplicationCommandInteractionDataOption> =
    new Map(); // command: Option
  private subOptions: Map<string, APIApplicationCommandInteractionDataOption> =
    new Map(); // subCommand: Option

  constructor(event: APIChatInputApplicationCommandInteraction) {
    this.event = event;
    if (isCommand(this.event)) {
      for (const option of this.event.data?.options ?? []) {
        this.options.set(option.name, option);

        if (isSubcommandOption(option)) {
          for (const subOption of option?.options ?? []) {
            this.subOptions.set(subOption.name, subOption);
          }
        }
      }
    }
  }

  public static of(event: APIGatewayEvent | SNSMessage): Interaction {
    if (isAPIGatewayEvent(event)) {
      return new Interaction(
        JSON.parse(
          event.body ?? throwError("invalid body")
        ) as APIChatInputApplicationCommandInteraction
      );
    } else {
      return new Interaction(
        JSON.parse(
          event.Message ?? throwError("invalid body")
        ) as APIChatInputApplicationCommandInteraction
      );
    }
  }

  public getEvent(): APIChatInputApplicationCommandInteraction {
    return this.event;
  }

  public isPing(): boolean {
    return isPing(this.event);
  }

  public isCommand(): boolean {
    return isCommand(this.event);
  }

  public getCommand(): string | undefined {
    if (isCommand(this.event)) {
      return this.event?.data?.name;
    }
    return undefined;
  }

  public getSubcommand(): string | undefined {
    if (isCommand(this.event)) {
      return this.event?.data?.options?.at(0)?.name;
    }
    return undefined;
  }

  public getString(name: string): string | undefined {
    if (isCommand(this.event)) {
      const option =
        this.options.get(name) ??
        this.subOptions.get(name) ??
        throwError(`${name} option invalid`);
      if (isStringCommandOption(option)) {
        return option.value;
      }
    }

    return undefined;
  }

  public getInteger(name: string): number | undefined {
    if (isCommand(this.event)) {
      const option =
        this.options.get(name) ??
        this.subOptions.get(name) ??
        throwError(`${name} option invalid`);
      if (isIntegerCommandOption(option)) {
        return option.value;
      }
    }

    return undefined;
  }

  public async reply(content: string, embeds: APIEmbed[] = []): Promise<void> {
    const response = await discordRequest(
      Routes.webhookMessage(this.event.application_id, this.event.token),
      {
        method: RequestMethod.Patch,
        body: JSON.stringify({
          content: content,
          components: [],
          embeds: embeds,
        }),
      }
    );
    console.log(response);
  }

  public defer(content: string, embeds: APIEmbed[] = []): CommandResult {
    return DiscordReply.message(content, embeds);
  }
}
