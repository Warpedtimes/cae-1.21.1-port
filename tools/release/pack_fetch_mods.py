"""fetch_mods.py: downloads the mod jars a pack could not ship or list for the launcher itself.

Shipped inside the client .mrpack packs (for the few CurseForge-only mods an .mrpack cannot link) and the server pack
(for every mod that is not bundled). It reads fetch_mods.json next to it:

    [{"file": "x.jar", "url": "https://...", "sha1": "...", "curseforge": [projectId, fileId], "page": "https://..."}]

and saves each jar into ./mods (or --mods-dir), skipping files already there with the right sha1. Entries with a
"url" are fetched from it; entries with only "curseforge" use CurseForge's public download address. Python 3.8+,
standard library only (uses curl when it is installed, which handles CurseForge's CDN most reliably).

    python fetch_mods.py                 # from the instance's Minecraft folder or the server folder
    python fetch_mods.py --mods-dir D    # somewhere else

A file that cannot be fetched is listed with its CurseForge page so it can be downloaded by hand.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (fetch_mods.py; Create Arcane Engineering pack)"
CF = "https://www.curseforge.com/api/v1/mods/{}/files/{}/download"


def sha1_of(path):
    h = hashlib.sha1()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url, dest):
    curl = shutil.which("curl")
    if curl:
        r = subprocess.run([curl, "-sSfL", "-A", UA, "--retry", "3", "-o", dest, url], capture_output=True)
        if r.returncode == 0:
            return None
        err = r.stderr.decode("utf-8", "replace").strip()
    else:
        err = "no curl"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as out:
            shutil.copyfileobj(resp, out)
        return None
    except Exception as e:  # noqa: BLE001
        return f"{err}; {e}"


def fetch_all(mods_dir, listing=None):
    listing = listing or os.path.join(HERE, "fetch_mods.json")
    entries = json.load(open(listing, encoding="utf-8"))
    os.makedirs(mods_dir, exist_ok=True)
    failed = []
    for e in entries:
        dest = os.path.join(mods_dir, e["file"])
        if os.path.exists(dest) and (not e.get("sha1") or sha1_of(dest) == e["sha1"]):
            print("have ", e["file"])
            continue
        url = e.get("url") or CF.format(*e["curseforge"])
        print("get  ", e["file"], flush=True)
        tmp = dest + ".part"
        err = download(url, tmp)
        if err is None and e.get("sha1") and sha1_of(tmp) != e["sha1"]:
            err = "checksum mismatch"
        if err is not None:
            if os.path.exists(tmp):
                os.remove(tmp)
            failed.append((e, err))
            continue
        os.replace(tmp, dest)
    print(f"{len(entries) - len(failed)} of {len(entries)} mods in place in {mods_dir}")
    for e, err in failed:
        print(f"FAILED {e['file']}: {err}\n       download it by hand: {e.get('page') or e.get('url')}")
    return not failed


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--mods-dir", default="mods")
    args = ap.parse_args()
    sys.exit(0 if fetch_all(args.mods_dir) else 1)


if __name__ == "__main__":
    main()
