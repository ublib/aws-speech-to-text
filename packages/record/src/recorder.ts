import AudioRecorderPolyfill from "audio-recorder-polyfill";
import { RawAudioChunks } from "@aws-s2t/invoke";

import { MicStream } from "./micStream";

export interface AudioRecorderOption {
  onStarted?: () => void;
  onStreaming?: (stream: MediaStream) => void;
  onStopped?: (rawChunks: RawAudioChunks) => void;
  onError?: (e: unknown) => void;
}

// NOTE: https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia#%E4%BE%8B%E5%A4%96
export class AudioRecorder {
  private currentStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private rawMicStream: MicStream | null = null;
  private rawChunks: Buffer[] = [];

  constructor(private opt?: AudioRecorderOption) {}

  start() {
    this.cleanUp();
    this.opt?.onStarted?.();
    window.navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.initMicStream(stream);
        this.opt?.onStreaming?.(stream);
        this.initRecorder(stream);
        this.recorder?.start();
      })
      .catch((e) => {
        this.opt?.onError?.(e);
      });
  }

  stop() {
    this.recorder?.stop();
  }

  cleanUp() {
    this.rawMicStream?.cleanUp();
    this.rawChunks = [];
    this.currentStream?.getTracks().forEach((track) => track.stop());
  }

  private initRecorder(stream: MediaStream) {
    this.currentStream = stream;
    this.recorder = new AudioRecorderPolyfill(stream);

    if (!this.recorder) {
      return;
    }
    this.recorder.addEventListener("stop", () => {
      this.opt?.onStopped?.({ value: this.rawChunks, sampleRate: this.rawMicStream?.sampleRate ?? 0 });
      this.cleanUp();
    });
  }

  private initMicStream(stream: MediaStream) {
    this.rawMicStream = new MicStream(stream);
    this.rawMicStream.setAudioprocessHandler((raw) => {
      this.rawChunks.push(raw);
    });
  }
}
