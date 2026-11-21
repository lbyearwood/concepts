# Tutorial narration

These are prepared AI-generated British English narration clips for the
Linear search on a string pilot. The pupil-facing explanation text and questions
are in `data/tutorial-guides.json`. The manifest records each spoken transcript,
source identity, audio digest and duration. No pupil data is sent to a voice
service, and playback does not run an AI model or make paid AI calls.

Generation uses [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), whose
weights are released under Apache 2.0, through the MIT-licensed
[kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) package. The selected
voice is `bf_emma`. Model/voice files remain local generation tools and are not
included in the website download. The model author's training-data notices are
in the [official model card](https://huggingface.co/hexgrad/Kokoro-82M#creative-commons-attribution).

The authoring script is `scripts/generate-tutorial-audio.py`; its optional local
dependencies are in `scripts/requirements-narration.txt`. Pass the downloaded
official ONNX model and voice archive with `--model` and `--voices`. Re-running
skips clips whose text, voice/model identity and saved audio digest still match.
The normal website build only verifies the checked-in clips and never downloads
the model or regenerates audio for a pupil visit.
