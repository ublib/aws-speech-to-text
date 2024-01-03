import bufferFrom from "buffer-from";

export class MicStream {
  static BUFFER_SIZE = 4096;
  static INPUT_CHANNEL = 1;
  static OUTPUT_CHANNEL = 1;
  private _context: AudioContext;
  private _scriptProcessor: ScriptProcessorNode;
  private _source: MediaStreamAudioSourceNode;

  constructor(private _stream: MediaStream) {
    this._context = new AudioContext();
    this._scriptProcessor = this._context.createScriptProcessor(
      MicStream.BUFFER_SIZE,
      MicStream.INPUT_CHANNEL,
      MicStream.OUTPUT_CHANNEL,
    );
    this._scriptProcessor.connect(this._context.destination);
    this._source = this._context.createMediaStreamSource(this._stream);
    this._source.connect(this._scriptProcessor);
  }

  public setAudioprocessHandler(handler: (e: Buffer) => void) {
    this._scriptProcessor.onaudioprocess = (e) => {
      const raw = bufferFrom(e.inputBuffer.getChannelData(0).buffer);
      handler(raw);
    };
  }

  public cleanUp() {
    this._source.disconnect();
    this._scriptProcessor.disconnect();
    if (this._context.state !== "closed") {
      this._context.close();
    }
  }

  // getters

  get sampleRate(): number {
    return this._context.sampleRate;
  }
}
