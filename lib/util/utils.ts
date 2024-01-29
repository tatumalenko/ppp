import { APIGatewayProxyResult } from "aws-lambda";
import {
  InteractionResponseType,
  APIEmbed,
  RESTPostAPIWebhookWithTokenJSONBody,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
} from "discord-api-types/v10";
import { config } from "../../config/config";

export type CommandResult =
  | APIInteractionResponseChannelMessageWithSource
  | APIInteractionResponseDeferredChannelMessageWithSource;

function isString(data: unknown): data is string {
  return typeof data === "string";
}

export function throwError(errorMessage: string): never {
  throw new Error(errorMessage);
}

export class DiscordReply {
  public static message(
    content: string,
    embeds: APIEmbed[] = []
  ): APIInteractionResponseChannelMessageWithSource {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: this.bodyData(content),
    };
  }

  public static defer(
    content: string,
    embeds: APIEmbed[] = []
  ): APIInteractionResponseDeferredChannelMessageWithSource {
    return {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      data: this.bodyData(content),
    };
  }

  public static bodyData(
    content: string,
    embeds: APIEmbed[] = []
  ): RESTPostAPIWebhookWithTokenJSONBody {
    return {
      tts: false,
      content: content,
      embeds: embeds,
    };
  }
}

export class GatewayReply {
  public static success(
    content: string | CommandResult,
    statusCode?: number
  ): APIGatewayProxyResult {
    return {
      statusCode: statusCode ?? 200,
      body: JSON.stringify(
        isString(content) ? DiscordReply.message(content) : content
      ),
    };
  }

  public static pong(): APIGatewayProxyResult {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: InteractionResponseType.Pong }),
    };
  }

  public static clientError(
    content: string | CommandResult,
    statusCode?: number
  ): APIGatewayProxyResult {
    return {
      statusCode: statusCode ?? 400,
      body: JSON.stringify(
        isString(content) ? DiscordReply.message(content) : content
      ),
    };
  }

  public static authError(
    content: string | CommandResult,
    statusCode?: number
  ): APIGatewayProxyResult {
    return {
      statusCode: statusCode ?? 401,
      body: JSON.stringify(
        isString(content) ? DiscordReply.message(content) : content
      ),
    };
  }

  public static serverError(
    content: string | CommandResult,
    statusCode?: number
  ): APIGatewayProxyResult {
    return {
      statusCode: statusCode ?? 500,
      body: JSON.stringify(
        isString(content) ? DiscordReply.message(content) : content
      ),
    };
  }

  public static none(): APIGatewayProxyResult {
    return this.success("No command handler found.");
  }
}

export async function discordRequest(
  endpoint: string,
  options: RequestInit
): Promise<Response> {
  // append endpoint to root API URL
  const url = "https://discord.com/api/v10" + endpoint;
  // Stringify payloads
  //if (options.body) options.body = JSON.stringify(options.body);
  // Use node-fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${config.discord.token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent":
        "DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)",
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}
