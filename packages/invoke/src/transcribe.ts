import type { EssentialCredentials, LanguageCode, Signer } from "@aws-s2t/sign";
import { generateSignedWsUrl } from "@aws-s2t/sign";
import { promiseWithResolvers, createReconciler } from "@aws-s2t/helpers";

import type { AmazonTranscribeSocMessage } from "./socket";
import { AmazonTranscribeSoc } from "./socket";

export type Transcribe = (rawChunks: RawAudioChunks) => Promise<string>;

export interface RawAudioChunks {
  value: Buffer[];
  sampleRate: number;
}

export type CreateTranscribeClient = (
  signer: Signer,
  credentials: EssentialCredentials,
  options: { region: string; languageCode: LanguageCode },
) => Transcribe;

/**
 * # createTranscribeClient
 *
 * @example
 * ```ts
 * import { Credentials, Signer } from "@aws-amplify/core";
 * import { createTranscribeClient } from "@aws-s2t/invoke";
 * // or
 * // import { createTranscribeClient } from "aws-s2t";
 *
 * const transcribe = createTranscribeClient(
 *   Signer,
 *   await Credentials.get(),
 *   { region: "us-east-1", languageCode: "en-US" },
 * );
 *
 * // send your audio rawChunks
 * const result = await transcribe(rawChunks);
 * console.log(result);
 * ```
 */
export const createTranscribeClient: CreateTranscribeClient = (signer, credentials, options) => {
  const signedUrl = generateSignedWsUrl(signer, credentials, options);

  return async function transcribe(rawChunks) {
    let currentResultId: string = "";

    const { promise, resolve } = promiseWithResolvers<void>();

    const { stack, flush, getResult } = createReconciler<AmazonTranscribeSocMessage, string>(
      (m) => {
        const raw = m.Transcript?.Results[0].Alternatives[0].Transcript;
        return raw ? decodeURIComponent(escape(raw)) : "";
      },
      (l, r) => l + r,
      "",
    );

    const socket = new AmazonTranscribeSoc(signedUrl, {
      onOpen: (e) => {
        rawChunks.value.forEach((value) => {
          socket.send({ value, sampleRate: rawChunks.sampleRate });
        });
        socket.close();
      },
      onMessage: (m) => {
        const result = m.Transcript?.Results[0];
        if (result) {
          !result.IsPartial && currentResultId === result.ResultId ? stack(m) : flush();
        }
        currentResultId = result?.ResultId ?? "";
      },
      onClose: () => {
        resolve();
      },
    });

    await promise;

    return getResult();
  };
};
