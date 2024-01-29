import {
  APIGatewayEvent,
  APIGatewayProxyResult,
  Context,
  Handler,
} from "aws-lambda";
import { DiscordReply, GatewayReply } from "../util/utils";
import { Interaction } from "../common/Interaction";
import commands from "../commands/commands";
import { Auth } from "../util/auth";
import { SNS } from "aws-sdk";

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(event);

    if (!Auth.isVerified(event)) {
      return GatewayReply.authError("invalid signature");
    }

    const interaction = Interaction.of(event);

    if (interaction.isPing()) {
      return GatewayReply.pong();
    } else if (interaction.isCommand()) {
      for (const command of commands) {
        if (command.name !== interaction.getCommand()) continue;
        const params = {
          Message: JSON.stringify(interaction.getEvent(), null, 2),
          Subject: "Discord PPP bot command",
          TopicArn: process.env.TOPIC_ARN,
        };
        await new SNS({ apiVersion: "2010-03-31" }).publish(params).promise();
        return GatewayReply.success(DiscordReply.defer("*⏳ Loading...*"));
      }
      return GatewayReply.none();
    } else {
      return GatewayReply.none();
    }
  } catch (error) {
    console.error(error);
    return GatewayReply.serverError(JSON.stringify(error));
  }
};
