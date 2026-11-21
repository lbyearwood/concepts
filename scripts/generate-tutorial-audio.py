"""Generate static narration locally; pupils never download or run the voice model."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def digest(value):
    return hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', type=Path, required=True)
    parser.add_argument('--voices', type=Path, required=True)
    parser.add_argument('--only-line', type=int)
    args = parser.parse_args()
    import lameenc
    import numpy as np
    import onnxruntime as rt
    from kokoro_onnx import Kokoro

    guide = json.loads((ROOT / 'data/tutorial-guides.json').read_text(encoding='utf-8'))['problems']['problem-1']
    options = rt.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    session = rt.InferenceSession(str(args.model), sess_options=options, providers=['CPUExecutionProvider'])
    voice = Kokoro.from_session(session, str(args.voices))
    output = ROOT / 'assets/tutorial-audio/linear-search-string'
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'lines': {}}
    model_hash = digest(args.model.read_bytes())
    voices_hash = digest(args.voices.read_bytes())
    manifest.update(engine='Kokoro ONNX 0.6.1', voice=guide['voice']['name'], language='en-gb',
                    model_sha256=model_hash, voices_sha256=voices_hash)
    for number, line in enumerate(guide['lines'], 1):
        if args.only_line and number != args.only_line:
            continue
        target = (ROOT / line['audio']).resolve()
        if output.resolve() not in target.parents:
            raise ValueError('Audio target is outside the approved tutorial folder')
        narration = line['narration']
        narration = narration.replace('input()', 'the input function').replace('range(len(text))', 'a range based on that length')
        narration = narration.replace('len(text)', 'the length of text').replace('text[i]', 'indexing into text')
        identity = digest((narration + guide['voice']['name'] + model_hash + voices_hash).encode())
        previous = manifest['lines'].get(str(number), {})
        if previous.get('identity') == identity and target.exists() and previous.get('sha256') == digest(target.read_bytes()):
            print(f'Line {number}: unchanged', flush=True)
            continue
        print(f'Generating line {number}', flush=True)
        samples, rate = voice.create(narration, voice=guide['voice']['name'], speed=0.96, lang='en-gb')
        if not np.isfinite(samples).all() or len(samples) < rate * 2 or np.max(np.abs(samples)) < 0.01:
            raise ValueError(f'Invalid narration signal for line {number}')
        samples = samples * min(1.0, 0.98 / float(np.max(np.abs(samples))))
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(80)
        encoder.set_in_sample_rate(rate)
        encoder.set_channels(1)
        encoder.set_quality(2)
        encoded = bytes(encoder.encode((samples * 32767).astype('<i2').tobytes()) + encoder.flush())
        target.write_bytes(encoded)
        manifest['lines'][str(number)] = {'identity': identity, 'sha256': digest(encoded),
                                         'seconds': round(len(samples) / rate, 2), 'bytes': len(encoded),
                                         'transcript': narration}
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f'Line {number}: {len(samples) / rate:.1f}s, {len(encoded)} bytes', flush=True)


if __name__ == '__main__':
    main()
