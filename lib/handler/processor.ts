import { Context, Handler, SNSEvent, SNSMessage } from "aws-lambda";
import { Interaction } from "../common/Interaction";
import commands from "../commands/commands";

async function handleMessage(message: SNSMessage) {
  const interaction = Interaction.of(message);

  for (const command of commands) {
    if (command.name !== interaction.getCommand()) continue;
    await command.handler(interaction);
  }
}

export const handler: Handler = async (
  event: SNSEvent,
  context: Context
): Promise<void> => {
  try {
    console.log(event);
    for (const message of event.Records) {
      await handleMessage(message.Sns);
    }
  } catch (error) {
    console.error(error);
  }
};
