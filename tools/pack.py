"""Build the 1.21.1 NeoForge pack from pack/mods.json: download the jars, check their dependencies, lay out server and
client.

    python tools/pack.py fetch      download every jar into run/cache (skips ones already there)
    python tools/pack.py check      read each jar's neoforge.mods.toml (or mods.toml); report missing or out-of-range
                                    dependencies,
                                    duplicate mod IDs and incompatibilities, for the server set and the client set
    python tools/pack.py server     put the server set into run/server/mods
    python tools/pack.py client     put every mod into the Prism instance (creating it if needed)
    python tools/pack.py add mr:<slug>|cf:<projectId> <side> "<why>"
                                    add the newest 1.21.1 NeoForge build of a mod
    python tools/pack.py side "<name>" both|server|client
    python tools/pack.py drop "<name>" "<why>"
                                    take a mod out, recording why under "dropped"

`side` in pack/mods.json: "both", "server" (not needed on a client joining a server, still needed in singleplayer) or
"client" (never on the server). The client instance gets every mod, since it also runs singleplayer.
Jars that are not on CurseForge or Modrinth (our own core mod) go in pack/local/ and are added to both sets.
"""
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tomllib
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "pack", "mods.json")
LOCAL = os.path.join(ROOT, "pack", "local")
CACHE = os.path.join(ROOT, "run", "cache")
SERVER = os.path.join(ROOT, "run", "server")
INSTANCE_NAME = "CAE 1.21.1 Port"
# Where the Prism instance goes. Override with CAE_PRISM_INSTANCES (the folder that holds the instances).
def _prism_instances():
    env = os.environ.get("CAE_PRISM_INSTANCES")
    if env:
        return env
    if sys.platform == "win32":
        return os.path.join(os.environ.get("APPDATA", ""), "PrismLauncher", "instances")
    if sys.platform == "darwin":
        return os.path.expanduser("~/Library/Application Support/PrismLauncher/instances")
    return os.path.expanduser("~/.local/share/PrismLauncher/instances")


INSTANCE = os.path.join(_prism_instances(), INSTANCE_NAME)
CF_DOWNLOAD = "https://www.curseforge.com/api/v1/mods/{}/files/{}/download"
CF_FILTER = "gameVersionId=11779&gameFlavorId=6"   # CurseForge's ids for 1.21.1 and NeoForge
MR_FILTER = "loaders=%5B%22neoforge%22%5D&game_versions=%5B%221.21.1%22%5D"
# A Java 21 install, used only for the Prism instance's java path. Override with CAE_JAVA_HOME (or JAVA_HOME).
JAVA = (os.environ.get("CAE_JAVA_HOME") or os.environ.get("JAVA_HOME")
        or ("C:/Program Files/Java/jdk-21" if sys.platform == "win32" else "/usr/lib/jvm/java-21-openjdk")).replace("\\", "/")
JAVA_MAJOR = 65   # class-file version of Java 21


def load():
    return json.load(open(PACK, encoding="utf-8"))


def save(pack):
    pack["mods"].sort(key=lambda m: m["name"].lower())
    with open(PACK, "w", encoding="utf-8") as fh:
        json.dump(pack, fh, indent=1, ensure_ascii=False)
        fh.write("\n")


def get_json(url):
    out = subprocess.run(["curl", "-sSfL", "-A", "Mozilla/5.0", "--retry", "3", url], capture_output=True, check=True)
    return json.loads(out.stdout)


def add(ref, side, why, match=""):
    """Newest 1.21.1 NeoForge build; `match`, if given, is a string its file name must contain (to pin a version)."""
    pack = load()
    source, _, key = ref.partition(":")
    if source == "mr":
        proj = get_json(f"https://api.modrinth.com/v2/project/{key}")
        versions = get_json(f"https://api.modrinth.com/v2/project/{key}/version?{MR_FILTER}")
        found = [(v, f) for v in versions for f in v["files"] if f["primary"] and match in f["filename"]]
        if not found:
            sys.exit(f"{key}: no 1.21.1 NeoForge build on Modrinth matching {match!r}")
        v, f = found[0]
        mod = {"name": proj["title"], "mr": [v["project_id"], v["id"]], "file": f["filename"], "url": f["url"],
               "sha1": f["hashes"]["sha1"]}
    elif source == "cf":
        files = get_json(f"https://www.curseforge.com/api/v1/mods/{key}/files?pageSize=50&sort=dateCreated"
                         f"&sortDescending=true&{CF_FILTER}")["data"]
        files = [f for f in files if match in f["fileName"]]
        if not files:
            sys.exit(f"{key}: no 1.21.1 NeoForge build on CurseForge matching {match!r}")
        f = files[0]
        mod = {"name": f["displayName"], "cf": [int(key), f["id"]], "file": f["fileName"]}
    else:
        sys.exit("ref is mr:<slug> or cf:<projectId>")
    pack["mods"] = [m for m in pack["mods"] if m.get(source, [None])[0] != mod[source][0]]
    mod.update(side=side, why=why)
    pack["mods"].append(mod)
    save(pack)
    print("added", mod["name"], mod["file"])


def set_side(name, side):
    pack = load()
    mod = next((m for m in pack["mods"] if m["name"] == name), None)
    if not mod:
        sys.exit(f"no mod named {name!r}")
    mod["side"] = side
    save(pack)
    print(name, "->", side)


def drop(name, why):
    pack = load()
    keep = [m for m in pack["mods"] if m["name"] != name]
    if len(keep) == len(pack["mods"]):
        sys.exit(f"no mod named {name!r}")
    pack["mods"] = keep
    pack["dropped"][name] = why
    save(pack)
    print("dropped", name)


def cached(mod):
    return os.path.join(CACHE, mod["file"])


def local_jars():
    if not os.path.isdir(LOCAL):
        return []
    return [os.path.join(LOCAL, f) for f in sorted(os.listdir(LOCAL)) if f.endswith(".jar")]


def fetch():
    os.makedirs(CACHE, exist_ok=True)
    pack = load()
    for mod in pack["mods"]:
        path = cached(mod)
        if os.path.exists(path):
            continue
        url = CF_DOWNLOAD.format(*mod["cf"]) if "cf" in mod else mod["url"]
        print("get", mod["file"], flush=True)
        tmp = path + ".part"
        subprocess.run(["curl", "-sSfL", "-A", "Mozilla/5.0", "--retry", "3", "-o", tmp, url], check=True)
        if "sha1" in mod and hashlib.sha1(open(tmp, "rb").read()).hexdigest() != mod["sha1"]:
            os.remove(tmp)
            sys.exit(f"sha1 mismatch: {mod['file']}")
        os.replace(tmp, path)
    print("all", len(pack["mods"]), "jars cached")


# --- reading mods.toml -------------------------------------------------------------------------------------------

def _version_key(v):
    """Rough Maven ComparableVersion: numbers compare as numbers, words below numbers, missing parts as zero."""
    parts = re.findall(r"\d+|[a-zA-Z]+", v.split("+")[0])
    key = []
    for p in parts:
        key.append((1, int(p), "") if p.isdigit() else (0, 0, p.lower()))
    while key and key[-1] == (1, 0, ""):
        key.pop()
    return key


def in_range(version, spec):
    """Maven version range such as [6.0.0,6.1.0), [47,), 1.2 (meaning >= 1.2) or *."""
    spec = spec.strip()
    if not spec or spec == "*" or version is None:
        return True
    for one in re.findall(r"[\[(][^\])]*[\])]", spec) or [spec]:
        if not one[0] in "[(":
            if _version_key(version) >= _version_key(one):
                return True
            continue
        lo, _, hi = one[1:-1].partition(",")
        if "," not in one:
            if _version_key(version) == _version_key(lo):
                return True
            continue
        v = _version_key(version)
        ok = True
        if lo.strip():
            ok &= v >= _version_key(lo) if one[0] == "[" else v > _version_key(lo)
        if hi.strip():
            ok &= v <= _version_key(hi) if one[-1] == "]" else v < _version_key(hi)
        if ok:
            return True
    return False


def _read_toml(zf, jar_version):
    names = set(zf.namelist())
    toml = next((n for n in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml") if n in names), None)
    if not toml:
        return []
    raw = zf.read(toml).decode("utf-8", errors="replace")
    try:
        data = tomllib.loads(raw)
    except tomllib.TOMLDecodeError:
        # A few jars ship sloppy TOML (duplicate keys, stray tabs); fall back to the bits we need.
        data = {"mods": [{"modId": m} for m in re.findall(r'modId\s*=\s*"([^"]+)"', raw.split("[[dependencies")[0])],
                "dependencies": {}}
    out = []
    for m in data.get("mods", []):
        version = str(m.get("version", ""))
        if "${" in version:
            version = jar_version
        deps = []
        for d in (data.get("dependencies") or {}).get(m["modId"], []):
            kind = str(d.get("type", "")).lower() or ("required" if d.get("mandatory", False) else "optional")
            deps.append({"id": d.get("modId"), "kind": kind, "range": str(d.get("versionRange", "")),
                         "side": str(d.get("side", "BOTH")).upper()})
        out.append({"id": m["modId"], "version": version, "deps": deps})
    return out


def _jar_version(zf):
    try:
        mf = zf.read("META-INF/MANIFEST.MF").decode("utf-8", errors="replace")
    except KeyError:
        return None
    m = re.search(r"^Implementation-Version:\s*(\S+)", mf, re.M)
    return m.group(1) if m else None


def read_jar(path_or_bytes, name, nested=False):
    """Every mod a jar provides, including its jar-in-jar contents."""
    zf = zipfile.ZipFile(path_or_bytes if isinstance(path_or_bytes, str) else io.BytesIO(path_or_bytes))
    mods = [dict(m, jar=name, nested=nested) for m in _read_toml(zf, _jar_version(zf))]
    for inner in zf.namelist():
        if inner.startswith("META-INF/jarjar/") and inner.endswith(".jar"):
            mods += read_jar(zf.read(inner), f"{name} > {inner.rsplit('/', 1)[-1]}", nested=True)
    return mods


def newest_class(path_or_bytes):
    """Highest class-file major version in a jar and its jar-in-jars (61 = Java 17, 65 = Java 21)."""
    zf = zipfile.ZipFile(path_or_bytes if isinstance(path_or_bytes, str) else io.BytesIO(path_or_bytes))
    top = 0
    for info in zf.infolist():
        name = info.filename
        if name.endswith(".class") and not name.startswith("META-INF/versions/"):
            with zf.open(info) as fh:
                head = fh.read(8)
            if head[:4] == b"\xca\xfe\xba\xbe":
                top = max(top, int.from_bytes(head[6:8], "big"))
        elif name.startswith("META-INF/jarjar/") and name.endswith(".jar"):
            top = max(top, newest_class(zf.read(info)))
    return top


def check_set(label, jars, pack):
    provided, problems = {}, []
    for jar in jars:
        major = newest_class(jar)
        if major > JAVA_MAJOR:
            problems.append(f"{os.path.basename(jar)} has Java {major - 44} classes; the pack runs on Java 21")
    # FancyModLoader 4 is what NeoForge 21.1 reports for javafml/lowcodefml.
    builtin = {"minecraft": pack["minecraft"], "neoforge": pack["neoforge"], "javafml": "4", "lowcodefml": "4"}
    for jar in jars:
        for m in read_jar(jar, os.path.basename(jar)):
            prev = provided.get(m["id"])
            if prev and not prev["nested"] and not m["nested"]:
                problems.append(f"duplicate mod id {m['id']}: {prev['jar']} and {m['jar']}")
            if not prev or (prev["nested"] and not m["nested"]) or \
                    (prev["nested"] == m["nested"] and _version_key(m["version"] or "") > _version_key(prev["version"] or "")):
                provided[m["id"]] = m
    server = label == "server"
    for m in list(provided.values()):
        if m["nested"] and provided.get(m["id"]) is not m:
            continue
        for d in m["deps"]:
            if server and d["side"] == "CLIENT":
                continue
            have = builtin.get(d["id"]) or (provided[d["id"]]["version"] if d["id"] in provided else None)
            present = d["id"] in builtin or d["id"] in provided
            if d["kind"] in ("required", "mandatory"):
                if not present:
                    problems.append(f"{m['id']} ({m['jar']}) needs {d['id']} {d['range']}, which is missing")
                elif not in_range(have, d["range"]):
                    problems.append(f"{m['id']} ({m['jar']}) needs {d['id']} {d['range']}, have {have}")
            elif d["kind"] == "optional" and present and d["range"] and not in_range(have, d["range"]):
                problems.append(f"{m['id']} ({m['jar']}) works with {d['id']} {d['range']} only, have {have}")
            elif d["kind"] in ("incompatible", "discouraged") and present and in_range(have, d["range"]):
                problems.append(f"{m['id']} ({m['jar']}) is {d['kind']} with {d['id']} {d['range']} (have {have})")
    print(f"== {label}: {len(jars)} jars, {len(provided)} mod ids, {len(problems)} problems")
    for p in sorted(set(problems)):
        print("  " + p)
    return provided


def server_jars(pack):
    return [cached(m) for m in pack["mods"] if m["side"] != "client"] + local_jars()


def client_jars(pack):
    return [cached(m) for m in pack["mods"]] + local_jars()


def check():
    pack = load()
    check_set("server", server_jars(pack), pack)
    check_set("client", client_jars(pack), pack)


# --- laying out the server and the instance ----------------------------------------------------------------------

def place(jars, mods_dir):
    """Make mods_dir hold exactly these jars (hard links into the cache where possible)."""
    os.makedirs(mods_dir, exist_ok=True)
    want = {os.path.basename(j): j for j in jars}
    for f in os.listdir(mods_dir):
        if f.endswith(".jar") and f not in want:
            os.remove(os.path.join(mods_dir, f))
    for name, src in want.items():
        dst = os.path.join(mods_dir, name)
        if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src):
            continue
        if os.path.exists(dst):
            os.remove(dst)
        try:
            os.link(src, dst)
        except OSError:
            shutil.copy2(src, dst)
    print(f"{len(want)} jars in {mods_dir}")


OVERRIDES = os.path.join(ROOT, "pack", "overrides")
# Folders under overrides/ that the pack owns outright: anything in the target that isn't in overrides is removed.
# Everything else (config/ at large) is only added to or overwritten, since mods write their own files there.
MIRRORED = ["kubejs/startup_scripts", "kubejs/server_scripts", "kubejs/client_scripts", "kubejs/assets",
            "kubejs/data", "config/ftbquests"]
# Client-only overrides (the FancyMenu main menu and Drippy loading screen with their pictures): the instance gets
# them, the server package doesn't.
CLIENT_OVERRIDES = os.path.join(ROOT, "pack", "overrides-client")
CLIENT_MIRRORED = ["config/fancymenu/customization"]


def sync_overrides(dest, src=OVERRIDES, mirrored=MIRRORED, skip=()):
    """`skip`: folders (relative to src, "/"-separated) not to copy, unless a longer prefix in KEEP_UNDER_SKIP says so."""
    if not os.path.isdir(src):
        return
    copied = removed = 0
    for base, _, fs in os.walk(src):
        rel = os.path.relpath(base, src)
        rel_slash = rel.replace(os.sep, "/")
        if any(rel_slash == s or rel_slash.startswith(s + "/") for s in skip) and \
                not any(rel_slash == k or rel_slash.startswith(k + "/") for k in KEEP_UNDER_SKIP):
            continue
        os.makedirs(os.path.join(dest, rel), exist_ok=True)
        for f in fs:
            s, dst = os.path.join(base, f), os.path.join(dest, rel, f)
            if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(s) or \
                    os.path.getsize(dst) != os.path.getsize(s):
                shutil.copy2(s, dst)
                copied += 1
    for m in mirrored:
        root = os.path.join(dest, m)
        for base, _, fs in os.walk(root):
            for f in fs:
                rel = os.path.relpath(os.path.join(base, f), dest)
                if rel.replace(os.sep, "/").startswith("kubejs/server_scripts/sweep/"):
                    continue  # dev test suites (tools/sweep.py install); never part of the pack or the deploy
                if not os.path.exists(os.path.join(src, rel)):
                    os.remove(os.path.join(base, f))
                    removed += 1
    print(f"overrides: {copied} files copied, {removed} removed in {dest}")


KEEP_UNDER_SKIP = ["config/ftbquests"]


def server(*flags):
    """`server noconfig`: leave config/ and defaultconfigs/ out (quests still go in), for boots while configs are ported."""
    place(server_jars(load()), os.path.join(SERVER, "mods"))
    sync_overrides(SERVER, skip=("config", "defaultconfigs") if "noconfig" in flags else ())


def client():
    pack = load()
    os.makedirs(os.path.join(INSTANCE, "minecraft"), exist_ok=True)
    mmc = os.path.join(INSTANCE, "mmc-pack.json")
    if not os.path.exists(mmc):
        json.dump({"formatVersion": 1, "components": [
            {"uid": "net.minecraft", "version": pack["minecraft"], "important": True},
            {"uid": "net.neoforged", "version": pack["neoforge"]},
        ]}, open(mmc, "w"), indent=2)
        with open(os.path.join(INSTANCE, "instance.cfg"), "w") as cfg:
            cfg.write(f"[General]\nConfigVersion=1.2\nInstanceType=OneSix\nname={INSTANCE_NAME}\n"
                      f"iconKey=default\nOverrideJavaLocation=true\nJavaPath={JAVA}/bin/javaw.exe\n"
                      "OverrideMemory=true\nMinMemAlloc=2048\nMaxMemAlloc=8192\n")
    place(client_jars(pack), os.path.join(INSTANCE, "minecraft", "mods"))
    sync_overrides(os.path.join(INSTANCE, "minecraft"))
    sync_overrides(os.path.join(INSTANCE, "minecraft"), CLIENT_OVERRIDES, CLIENT_MIRRORED)
    shaders_off(os.path.join(INSTANCE, "minecraft"))


def shaders_off(game_dir):
    """The test client runs without shaders (they max out the PC's fans) and without Distant Horizons' far terrain
    (screenshot comparisons); the pack itself still ships both on."""
    path = os.path.join(game_dir, "config", "iris.properties")
    if os.path.exists(path):
        text = open(path, encoding="utf-8").read()
        open(path, "w", encoding="utf-8").write(re.sub(r"(?m)^enableShaders=.*$", "enableShaders=false", text))
    path = os.path.join(game_dir, "config", "DistantHorizons.toml")
    if os.path.exists(path):
        text = open(path, encoding="utf-8").read()
        if re.search(r"(?m)^\s*quickEnableRendering\s*=", text):
            text = re.sub(r"(?m)^(\s*)quickEnableRendering\s*=.*$", r"\1quickEnableRendering = false", text)
        else:
            text = re.sub(r"(?m)^\[client\]\s*$", "[client]\n\tquickEnableRendering = false", text, count=1)
        open(path, "w", encoding="utf-8").write(text)


if __name__ == "__main__":
    commands = {"fetch": fetch, "check": check, "server": server, "client": client, "add": add, "side": set_side,
                "drop": drop}
    commands[sys.argv[1]](*sys.argv[2:])
