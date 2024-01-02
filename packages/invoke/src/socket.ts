import { EventStreamCodec, Message } from "@smithy/eventstream-codec";
import { toUtf8, fromUtf8 } from "@smithy/util-utf8";

import { downSampleBuffer, pcmEncode } from "@aws-s2t/encode";
import { SignedTranscribeWsUrl } from "@aws-s2t/sign";

export interface AmazonTranscribeSocHooks {
  onOpen?: (e: Event) => void;
  onMessage?: (e: AmazonTranscribeSocMessage) => void;
  onError?: (e: unknown) => void;
  onClose?: (e: CloseEvent) => void;
}

export interface AmazonTranscribeSocMessage {
  Transcript?: {
    Results: AmazonTranscribeSocMessageResult[];
  };
}

export interface AmazonTranscribeSocMessageResult {
  Alternatives: AmazonTranscribeSocMessageResultAlternative[];
  ChannelId: number;
  EndTime: number;
  IsPartial: boolean;
  ResultId: string;
  StartTime: number;
}

export interface AmazonTranscribeSocMessageResultAlternative {
  Items: AmazonTranscribeSocMessageResultAlternativeItem[];
  Transcript: string;
}

export interface AmazonTranscribeSocMessageResultAlternativeItem {
  Content: string;
  EndTime: number;
  StartTime: number;
  Type: string;
  VocabularyFilterMatch: boolean;
}

/**
 * # AmazonTranscribeSoc
 *
 * @example
 * ```ts
 * import { Credentials, Signer } from "@aws-amplify/core";
 * import { generateSignedWsUrl } from "@aws-s2t/sign";
 * import { AmazonTranscribeSoc } from "@aws-s2t/invoke";
 *
 * const signedUrl = generateSignedWsUrl(
 *   Signer,
 *   await Credentials.get(),
 *   { region: "us-east-1", languageCode: "en-US" },
 * );
 *
 * const socket = new AmazonTranscribeSoc(signedUrl, {
 *   onOpen: e => {
 *     // rawChunks: your audio chunks
 *     rawChunks.forEach(value => {
 *       socket.send({ value, sampleRate: rawChunks.sampleRate });
 *     });
 *   },
 *   onMessage: e => {
 *     console.log(e);
 *   },
 * })
 * ```
 *
 */
export class AmazonTranscribeSoc {
  private _socket: WebSocket;
  private _eventStreamCodec: EventStreamCodec;

  constructor(
    private _signedUrl: SignedTranscribeWsUrl,
    private _hooks: AmazonTranscribeSocHooks
  ) {
    this._eventStreamCodec = new EventStreamCodec(toUtf8, fromUtf8);

    this._socket = new WebSocket(this.signedUrl);
    this._socket.binaryType = "arraybuffer";

    this._socket.onopen = (e) => {
      this._hooks.onOpen?.(e);
    };

    this._socket.onmessage = (m) => {
      const messageWrapper = this._eventStreamCodec.decode(Buffer.from(m.data));
      // ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/main.js#L104
      // eslint-disable-next-line prefer-spread, @typescript-eslint/no-explicit-any
      const messageBody = JSON.parse(
        String.fromCharCode.apply(String, messageWrapper.body as any)
      );
      if (messageWrapper.headers[":message-type"].value === "event") {
        this._hooks.onMessage?.(messageBody);
      }
    };

    this._socket.onerror = (e) => {
      this._hooks.onError?.(e);
    };

    this._socket.onclose = (e) => {
      this._hooks.onClose?.(e);
    };
  }

  public send(rawAudioChunk: RawAudioChunk) {
    const binary = convertAudioToBinaryMessage(
      rawAudioChunk,
      this._eventStreamCodec
    );
    if (!binary) return;
    if (this._socket.readyState === this._socket.OPEN) {
      this._socket.send(binary);
    }
  }

  public close() {
    if (this._socket.readyState !== this._socket.OPEN) return;
    const emptyMessage = getAudioEventMessage(Buffer.from(Buffer.from([])));
    const emptyBuffer = this._eventStreamCodec.encode(emptyMessage as Message);
    this._socket.send(emptyBuffer);
  }

  // getters
  get signedUrl(): string {
    return this._signedUrl;
  }

  get rawSocket(): WebSocket {
    return this._socket;
  }
}

/**
 * ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/main.js#L208
 */
export const getAudioEventMessage = (buffer: Buffer): AudioEventMessage => ({
  headers: {
    ":message-type": {
      type: "string",
      value: "event",
    },
    ":event-type": {
      type: "string",
      value: "AudioEvent",
    },
  },
  body: buffer,
});

/**
 * ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/main.js#L208
 */
export type AudioEventMessage = {
  headers: {
    ":message-type": {
      type: string;
      value: string;
    };
    ":event-type": {
      type: string;
      value: string;
    };
  };
  body: Buffer;
};

/**
 * ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/main.js#L90
 */
const SAMPLE_RATE: number = 44100;

export interface RawAudioChunk {
  value: Buffer;
  sampleRate: number;
}

/**
 * ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/main.js#L189
 */
const convertAudioToBinaryMessage = (
  rawAudioChunk: RawAudioChunk,
  eventStreamCodec: EventStreamCodec
): Uint8Array | undefined => {
  const raw = new Float32Array(rawAudioChunk.value.buffer);
  if (raw == null) return;

  const downSampledBuffer = downSampleBuffer(
    raw,
    rawAudioChunk.sampleRate,
    SAMPLE_RATE
  );
  const pcmEncodedBuffer = pcmEncode(downSampledBuffer);
  const audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer));
  const binary = eventStreamCodec.encode(audioEventMessage as Message);
  return binary;
};
