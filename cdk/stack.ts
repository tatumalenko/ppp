import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { SnsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Config, prodConfig, devConfig } from "../config/config";

class PPP extends Construct {
  constructor(scope: Construct, id: string, config: Config, env: string) {
    super(scope, id);

    const topic = new Topic(this, "topic", {});
    const pppFunction = new NodejsFunction(this, "function", {
      entry: "./lib/handler/proxy.ts",
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.minutes(1),
      memorySize: 512,
      environment: {
        TOPIC_ARN: topic.topicArn,
        ENV: env,
        DISCORD_TOKEN: config.discord.token,
        DISCORD_CLIENTID: config.discord.clientId,
        DISCORD_GUILDID: config.discord.guildId,
        DISCORD_PUBLICKEY: config.discord.publicKey,
        GOOGLE_SHEETID: config.google.sheetId,
        GOOGLE_TABNAME: config.google.tabName,
        GOOGLE_PRIVATEKEY: config.google.private_key,
        GOOGLE_CLIENTEMAIL: config.google.client_email,
      },
    });
    new LambdaRestApi(this, "apigw", {
      handler: pppFunction,
    });
    const processorFunction = new NodejsFunction(this, "processor", {
      entry: "./lib/handler/processor.ts",
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.minutes(1),
      memorySize: 512,
      environment: {
        ENV: env,
        DISCORD_TOKEN: config.discord.token,
        DISCORD_CLIENTID: config.discord.clientId,
        DISCORD_GUILDID: config.discord.guildId,
        DISCORD_PUBLICKEY: config.discord.publicKey,
        GOOGLE_SHEETID: config.google.sheetId,
        GOOGLE_TABNAME: config.google.tabName,
        GOOGLE_PRIVATEKEY: config.google.private_key,
        GOOGLE_CLIENTEMAIL: config.google.client_email,
      },
    });
    processorFunction.addEventSource(new SnsEventSource(topic));
    const snsTopicPolicy = new PolicyStatement({
      actions: ["sns:publish"],
      resources: ["*"],
    });

    pppFunction.addToRolePolicy(snsTopicPolicy);
  }
}

export class PPPStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new PPP(this, "ppp", prodConfig, "prod");
    new PPP(this, "ppp-dev", devConfig, "dev");
  }
}
