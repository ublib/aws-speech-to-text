import { joinURL, withQuery } from "ufo";
import { LanguageCode } from "./languageCode";
import { Signer } from "./extern";

export interface EssentialCredentials {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
}

declare const SignedUrlMarker: unique symbol;
export type SignedWsUrl = string & { [SignedUrlMarker]: never };

/**
 * ! ref: https://docs.aws.amazon.com/transcribe/latest/dg/streaming-setting-up.html
 */
const PROTOCOL = "wss";

/**
 * ! ref: https://docs.aws.amazon.com/transcribe/latest/dg/streaming-setting-up.html
 */
const PORT = 8443;

/**
 * ! ref: https://docs.aws.amazon.com/transcribe/latest/dg/streaming-setting-up.html
 */
const PATH = "/stream-transcription-websocket";

/**
 * # generateSignedWsUrl
 *
 * generate signed url for [Amazon Transcribe Speech To Text WebSocket API](https://docs.aws.amazon.com/transcribe/latest/dg/streaming-setting-up.html)
 *
 * @param signer A Signer from `@aws-amplify/core`
 * @param credentials AWS credentials
 * @param options region and languageCode
 * @returns signed url
 *
 * @example
 * ```ts
 * import { Credentials, Signer } from "@aws-amplify/core";
 * import { generateSignedWsUrl } from "@aws-s2t/sign";
 *
 * const signedUrl = generateSignedWsUrl(
 *   Signer,
 *   await Credentials.get(),
 *   { region: "us-east-1", languageCode: "en-US" },
 * );
 * ```
 */
export function generateSignedWsUrl(
  signer: Signer,
  credentials: EssentialCredentials,
  options: { region: string; languageCode: LanguageCode },
): SignedWsUrl {
  //! ref: https://docs.aws.amazon.com/transcribe/latest/dg/streaming-setting-up.html
  const origin = `${PROTOCOL}://transcribestreaming.${options.region}.amazonaws.com:${PORT}`;
  const path = joinURL(origin, PATH);
  const urlWithParam = withQuery(path, {
    "media-encoding": "pcm",
    "sample-rate": getSampleRate(options.languageCode),
    "language-code": options.languageCode,
  });

  const signedUrl = signer.signUrl(
    urlWithParam,
    {
      access_key: credentials.accessKey,
      secret_key: credentials.secretKey,
      session_token: credentials.sessionToken,
    },
    { region: options.region, service: "transcribe" },
    300,
  );

  return signedUrl as SignedWsUrl;
}

//! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/main.js#L90
const getSampleRate = (languageCode: string): number => (["en-US", "es-US"].includes(languageCode) ? 44100 : 8000);
