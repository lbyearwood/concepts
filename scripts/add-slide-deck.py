"""Register one already approved student presentation using its topic and file ID.

Never grants publication permission or changes Google Drive. Review the generated
entry and page before committing. No Teacher editions or other private resources.
"""
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--topic", required=True, help="Existing GCSE topic, e.g. 1.2")
    parser.add_argument("--google-file-id", required=True)
    parser.add_argument("--approved-student", action="store_true", required=True,
                        help="Confirm this exact student deck already has public publication approval")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_-]{20,}", args.google_file_id):
        parser.error("Expected a native Google Slides file ID.")
    catalogue = json.loads((ROOT / "data/gcse-course.json").read_text(encoding="utf-8"))
    topic = next((t for u in catalogue["units"] for t in u["topics"]
                  if t["title"].split(" ", 1)[0] == args.topic), None)
    if not topic:
        parser.error("Topic is not in the existing GCSE course catalogue.")
    suffix = args.topic.replace(".", "-")
    config_path = ROOT / "data/slide-sync.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if any(d["key"] == "gcse-" + suffix for d in config["decks"]):
        parser.error("This topic already has a sync entry; review it in place.")
    config["decks"].append(dict(key="gcse-" + suffix, approvedStudent=True,
        title=topic["title"], googleFileId=args.google_file_id,
        output="assets/slide-decks/" + suffix,
        sourcePdf="assets/slide-decks/" + suffix + "/bootstrap.pdf"))
    config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Registered approved student deck. Run python scripts/build-course.py and review both changes.")


if __name__ == "__main__":
    main()
