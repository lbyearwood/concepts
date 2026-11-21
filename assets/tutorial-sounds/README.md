# Tutorial sound recordings

The user supplied these three selected MP3 recordings on 21 November 2026.
Original filenames and encoded bytes are retained. The manifest maps each
recording to its role and records byte hashes, decoded duration and sample rate.

- Correct answer: dragon-studio-correct-472358.mp3
- Incorrect answer: universfield-wrong-answer-126515.mp3
- Typing: dragon-studio-keyboard-typing-sound-effect-335503.mp3

The final user choice on 21 November 2026 is the original generated keyboard
clicks. The supplied keyboard MP3 remains stored but is inactive. Typing uses
the original quiet 18ms locally generated clicks on real character ticks.

The shared Sound on/off control governs all playback. Correct/wrong recordings
are downloaded/decoded when the pilot opens with sound enabled, before Tutorial
is expanded. Buffers are reused; no fresh fetch/decode is needed on a prepared
answer selection. Exceptionally early valid answers wait for the shared preload,
while obsolete requests remain cancelled. Navigation and mute stop active
effects. Original Downloads files and all three supplied MP3s are unchanged.
