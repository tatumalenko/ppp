import { APIGatewayEvent } from "aws-lambda";
import { config } from "../../config/config";
import nacl from "tweetnacl";
import { throwError } from "./utils";

export class Auth {
  public static isVerified(event: APIGatewayEvent): boolean {
    const signature =
      event.headers["x-signature-ed25519"] ?? throwError("signature invalid");
    const timestamp =
      event.headers["x-signature-timestamp"] ?? throwError("timestamp invalid");
    const strBody = event.body ?? throwError("body invalid");
    const publicKey =
      config.discord.publicKey ?? throwError("invalid publicKey");
    console.log(
      `signature=${signature}, timestamp=${timestamp}, publicKey=${publicKey}`
    );

    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + strBody),
      Buffer.from(signature, "hex"),
      Buffer.from(config.discord.publicKey, "hex")
    );

    return isVerified;
  }
}
