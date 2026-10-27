"""Read-only verification of the preview's bundled backend and credential boundary."""
import argparse
import hashlib
from pathlib import Path
from zipfile import ZipFile

parser = argparse.ArgumentParser()
parser.add_argument("apk", type=Path)
parser.add_argument("--api-url", required=True)
args = parser.parse_args()
with ZipFile(args.apk) as archive:
    bundle = archive.read("assets/index.android.bundle")
    if args.api_url.encode() not in bundle:
        raise SystemExit("APK does not contain the expected shared API origin. Rebuild it.")
    if b"mongodb+srv://" in bundle or b"mongodb://" in bundle:
        raise SystemExit("A database URI was found in the client bundle; do not distribute this APK.")
    architectures = sorted({name.split("/")[1] for name in archive.namelist() if name.startswith("lib/")})
    if not {"arm64-v8a", "x86_64"}.issubset(architectures):
        raise SystemExit("Expected phone and emulator architectures are missing.")
print(f"Backend verified: {args.api_url}")
print(f"Architectures: {', '.join(architectures)}")
print("No MongoDB connection URI in the JavaScript bundle.")
print(f"APK SHA-256: {hashlib.file_digest(args.apk.open('rb'), 'sha256').hexdigest()}")
