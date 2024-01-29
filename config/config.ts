import "dotenv/config";

const isLocalEnv = !process.env.ENV;
const isDevEnv = process.env.ENV === "dev";
const isProdEnv = process.env.ENV === "prod";

export interface Google {
  sheetId: string;
  tabName: string;
  private_key: string;
  client_email: string;
}

export interface Discord {
  publicKey: string;
  token: string;
  clientId: string;
  guildId: string;
}

export interface Config {
  google: Google;
  discord: Discord;
}

export const prodConfig: Config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENTID!,
    guildId: process.env.DISCORD_GUILDID!,
    publicKey: process.env.DISCORD_PUBLICKEY!,
  },
  google: {
    sheetId: process.env.GOOGLE_SHEETID!,
    tabName: process.env.GOOGLE_TABNAME!,
    private_key: process.env.GOOGLE_PRIVATEKEY?.split(String.raw`\n`)?.join(
      "\n"
    )!,
    client_email: process.env.GOOGLE_CLIENTEMAIL!,
  },
};

export const devConfig: Config = {
  discord: {
    token: isLocalEnv
      ? process.env.DEV_DISCORD_TOKEN!
      : process.env.DISCORD_TOKEN!,
    clientId: isLocalEnv
      ? process.env.DEV_DISCORD_CLIENTID!
      : process.env.DISCORD_CLIENTID!,
    guildId: isLocalEnv
      ? process.env.DEV_DISCORD_GUILDID!
      : process.env.DISCORD_GUILDID!,
    publicKey: isLocalEnv
      ? process.env.DEV_DISCORD_PUBLICKEY!
      : process.env.DISCORD_PUBLICKEY!,
  },
  google: {
    sheetId: isLocalEnv
      ? process.env.DEV_GOOGLE_SHEETID!
      : process.env.GOOGLE_SHEETID!,
    tabName: isLocalEnv
      ? process.env.DEV_GOOGLE_TABNAME!
      : process.env.GOOGLE_TABNAME!,
    private_key: (isLocalEnv
      ? process.env.DEV_GOOGLE_PRIVATEKEY
      : process.env.GOOGLE_PRIVATEKEY
    )
      ?.split(String.raw`\n`)
      ?.join("\n")!,
    client_email: isLocalEnv
      ? process.env.DEV_GOOGLE_CLIENTEMAIL!
      : process.env.GOOGLE_CLIENTEMAIL!,
  },
};

export const config: Config = isProdEnv ? prodConfig : devConfig;
