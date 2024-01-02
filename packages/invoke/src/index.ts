export type {
  AmazonTranscribeSocHooks,
  AmazonTranscribeSocMessage,
  AmazonTranscribeSocMessageResult,
  AmazonTranscribeSocMessageResultAlternative,
  AmazonTranscribeSocMessageResultAlternativeItem,
  AudioEventMessage,
  RawAudioChunk,
} from "./socket";
export { AmazonTranscribeSoc, getAudioEventMessage } from "./socket";

export type { Transcribe, RawAudioChunks, CreateTranscribeClient } from "./transcribe";
export { createTranscribeClient } from "./transcribe";
