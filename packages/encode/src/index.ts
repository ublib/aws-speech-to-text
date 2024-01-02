/**
 * ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/audioUtils.js#L1
 */
export function pcmEncode(input: Float32Array): ArrayBuffer {
  let offset = 0;
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * ! ref: https://github.com/amazon-archives/amazon-transcribe-websocket-static/blob/6a0b97f1c667b649c31cd9b550c37795a5c7ce25/lib/audioUtils.js#L12
 */
export function downSampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number = 44100,
  outputSampleRate: number = 16000,
): Float32Array {
  if (outputSampleRate === inputSampleRate) {
    return buffer;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);

    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}
