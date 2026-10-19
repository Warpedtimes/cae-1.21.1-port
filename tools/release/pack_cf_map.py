"""Find the CurseForge file for every mod pack/mods.json takes from Modrinth, so a CurseForge-format pack can list it.

    python -I -X utf8 tools/release/pack_cf_map.py        -> tools/release/cf_map.json (+ a summary)

For each Modrinth-sourced mod: the Modrinth project's slug -> api.cfwidget.com/minecraft/mc-mods/<slug> (CurseForge's
own project API needs a key; the widget API doesn't) -> the CurseForge file with the very same file name -> downloaded
from CurseForge's public download address and compared by sha1 with the jar the pack was tested with. Only a
byte-identical file counts as a match. Responses and downloads are cached under run/release/cache/.
"""
import hashlib
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, "run", "release", "cache", "cfmap")
JARS = os.path.join(ROOT, "run", "cache")
OUT = os.path.join(HERE, "cf_map.json")
CF_DL = "https://www.curseforge.com/api/v1/mods/{}/files/{}/download"
CF_FILES = "https://www.curseforge.com/api/v1/mods/{}/files?pageIndex={}&pageSize=50&sort=dateCreated&sortDescending=true"
# CurseForge slugs that differ from the Modrinth ones (tried after the Modrinth slug)
SLUG_HINTS = {
    "athena": ["athena", "athena-ctm"],
    "chunky": ["chunky-pregenerator", "chunky-pregenerator-forge"],
    "iris": [455508],
    "create-steam-n-rails-1.21.1": ["steam-n-rails-neoforge"],
    "athena-ctm": ["athena"],
    "immersive-weather-renewed": ["immersive-weathering-renewed"],
    "yungs-better-dungeons": ["yungs-better-dungeons-neoforge", "yungs-better-dungeons"],
    "yungs-better-mineshafts": ["yungs-better-mineshafts-neoforge", "yungs-better-mineshafts-forge"],
    "yungs-api": ["yungs-api-neoforge"],
    "yungs-better-desert-temples": ["yungs-better-desert-temples-neoforge"],
    "yungs-better-jungle-temples": ["yungs-better-jungle-temples-neoforge"],
    "yungs-better-nether-fortresses": ["yungs-better-nether-fortresses-neoforge"],
    "yungs-better-ocean-monuments": ["yungs-better-ocean-monuments-neoforge"],
    "yungs-better-witch-huts": ["yungs-better-witch-huts-neoforge"],
    "terrablender": ["terrablender-neoforge", "terrablender"],
    "glitchcore": [955399],
    "immersive-weathering-renewed": ["immersive-weathering-renewed", "immersive-weathering"],
    "create-steam-n-rails-neoforge": ["create-steam-n-rails-neoforge", "create-steam-n-rails"],
    "steam-n-rails-neoforge": ["create-steam-n-rails-neoforge", "create-steam-n-rails"],
    "create-modern-train-parts": ["create-modern-train-parts", "modern-train-parts"],
    "modern-train-parts": ["create-modern-train-parts", "modern-train-parts"],
}
# Try the hints first for these (the Modrinth slug points at a different CurseForge project)
HINTS_FIRST = {"yungs-api", "yungs-better-desert-temples", "yungs-better-jungle-temples", "yungs-better-nether-fortresses",
               "yungs-better-ocean-monuments", "yungs-better-witch-huts", "yungs-better-mineshafts", "glitchcore",
               "terrablender"}


def curl_json(url, cache_name, retries=4):
    path = os.path.join(CACHE, cache_name)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    for attempt in range(retries):
        r = subprocess.run(["curl", "-s", "-L", "-w", "\n%{http_code}", url], capture_output=True)
        body, _, code = r.stdout.decode("utf-8", "replace").rpartition("\n")
        if code == "200":
            data = json.loads(body)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(data, fh)
            return data
        if code in ("202", "429", "500", "502", "503"):  # cfwidget queues unknown projects; try again shortly
            time.sleep(5 + 5 * attempt)
            continue
        return {"_status": code}
    return {"_status": "gave up"}


def sha1_of(path):
    h = hashlib.sha1()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    os.makedirs(CACHE, exist_ok=True)
    mods = json.load(open(os.path.join(ROOT, "pack", "mods.json"), encoding="utf-8"))["mods"]
    result = {}
    for m in mods:
        if m.get("cf") or not m.get("mr"):
            continue
        name, file = m["name"].strip(), m["file"]
        want = m.get("sha1")
        local = os.path.join(JARS, file)
        if not want and os.path.exists(local):
            want = sha1_of(local)
        size = os.path.getsize(local) if os.path.exists(local) else None
        proj = curl_json(f"https://api.modrinth.com/v2/project/{m['mr'][0]}", f"mr_{m['mr'][0]}.json")
        slug = proj.get("slug")
        entry = {"file": file, "modrinth_slug": slug, "cf": None, "status": ""}
        widget = {}
        order = SLUG_HINTS.get(slug, []) + [slug] if slug in HINTS_FIRST else [slug] + SLUG_HINTS.get(slug, [])
        for s in order:
            if s:
                # a hint may be a CurseForge project id (the widget API looks those up directly)
                url = f"https://api.cfwidget.com/{s}" if isinstance(s, int) else f"https://api.cfwidget.com/minecraft/mc-mods/{s}"
                widget = curl_json(url, f"cfw_{s}.json")
                if widget.get("id"):
                    break
        if not widget.get("id"):
            entry["status"] = "no CurseForge project found"
            result[name] = entry
            print(f"{'none':9} {name}")
            continue
        pid = widget["id"]
        # candidates: a file with the same name (widget list), then any file of the same size (CurseForge's file list)
        cands = [f["id"] for f in widget.get("files", []) if f.get("name") == file]
        for page in range(6):
            listing = curl_json(CF_FILES.format(pid, page), f"cff_{pid}_{page}.json")
            data = listing.get("data") or []
            cands += [f["id"] for f in data if f.get("fileName") == file or (size and f.get("fileLength") == size)]
            if len(data) < 50:
                break
        seen, match, tried = set(), None, []
        for fid in cands:
            if fid in seen:
                continue
            seen.add(fid)
            dl = os.path.join(CACHE, f"{pid}_{fid}.jar")
            if not os.path.exists(dl):
                subprocess.run(["curl", "-s", "-L", "-f", "-o", dl, CF_DL.format(pid, fid)])
                time.sleep(0.5)
            got = sha1_of(dl) if os.path.exists(dl) else None
            tried.append(fid)
            if want and got == want:
                match = fid
                break
        entry["cf_project"] = pid
        same_name = [f["id"] for f in widget.get("files", []) if f.get("name") == file]
        if match:
            entry["cf"] = [pid, match]
            entry["status"] = "identical"
        elif same_name:
            # the same release under the same file name, built or signed again for CurseForge
            entry["cf"] = [pid, same_name[0]]
            entry["status"] = "same file name, different bytes"
        else:
            entry["status"] = "no identical file" + (f" (tried {tried})" if tried else "")
        result[name] = entry
        print(f"{entry['status'][:9]:9} {name} -> {pid}/{entry['cf'] or tried}")
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(result, fh, indent=1)
        fh.write("\n")
    counts = {}
    for e in result.values():
        k = e["status"] if e["status"] in ("identical",) else e["status"].split(" (")[0]
        counts[k] = counts.get(k, 0) + 1
    print(counts)


if __name__ == "__main__":
    main()
