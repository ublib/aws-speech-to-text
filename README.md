# aws-speech-to-text

Amazon Transcribe's speech to text client for TypeScript.

status: early development (**not published**)

## Usage

### Basic Usage

```sh
npm install aws-s2t

# install amplify core if you don't have it (for signing)
npm install @aws-amplify/core
```

```ts
import { Credentials, Signer } from "@aws-amplify/core";
import { createTranscribeClient } from "aws-s2t";

const transcribe = createTranscribeClient(Signer, await Credentials.get(), {
  region: "us-east-1",
  languageCode: "en-US",
});

// send your audio rawChunks
const result = await transcribe(rawChunks);
console.log(result);
```

### Use with Recorder on Browser

```sh
npm install @aws-s2t/record
```

```ts
import { Credentials, Signer } from "@aws-amplify/core";
import { createTranscribeClient } from "aws-s2t";
import { AudioRecorder } from "@aws-s2t/record";

const transcribe = createTranscribeClient(Signer, await Credentials.get(), {
  region: "us-east-1",
  languageCode: "en-US",
});

const recorder = new AudioRecorder({
  onStopped: async (rawChunks) => {
    const result = await transcribe(rawChunks);
    console.log(result);
  },
});

// bind actions
document
  .getElementById("start-btn")
  ?.addEventListener("click", () => recorder.start());
document
  .getElementById("stop-btn")
  ?.addEventListener("click", () => recorder.stop());
```

### Streaming

WIP
