"""Build the public release downloads into run/release/.

    python -I -X utf8 tools/release/build_packs.py

Reads tools/release/release.json (name, version, slug, ...), pack/mods.json, pack/overrides, pack/overrides-client,
pack/client-defaults, pack/local, the jars in run/cache/ and audit/release/mod_licenses.json (made by
tools/release/pack_licenses.py: the licence verdict per mod and the Modrinth download of each mod) and
tools/release/cf_map.json (made by tools/release/pack_cf_map.py: the CurseForge file of each Modrinth-sourced mod).
Writes:

  <file_prefix>-<version>-Client.zip   CurseForge-format modpack: the CurseForge app and Prism Launcher (Add Instance
                                       > Import) import it and download every mod from CurseForge themselves
  <file_prefix>-<version>-Server.zip   server pack (NeoForge installer is fetched by setup.py; mods bundled or fetched)
  SHA256SUMS.txt, build-report.json
  (--mrpack also writes <slug>-<version>.mrpack, a Modrinth-format pack; not released, see below)

FORMAT DECISION
  The Client download is a CurseForge-format zip: every one of the 210 mods has a CurseForge file (209 by project and
  file id, 66 of them found for the Modrinth-sourced mods by pack_cf_map.py, 62 byte-identical to the tested jars and
  4 the same release rebuilt), so the launcher fetches them all from CurseForge, and Prism handles any author who
  disabled third-party downloads with its own blocked-mods window. A Modrinth .mrpack can't point at CurseForge-only
  mods at all (it needed a separate helper for 19 of them), so it isn't released. Only our core jar and mods that are
  not on CurseForge and whose licence allows it (Immersive Weathering: Renewed, LGPL) go inside the zip; nothing All
  Rights Reserved is ever put inside a download.

release.json may also hold (all optional): "exclude_overrides": [paths under pack/ to leave out, e.g.
"overrides-client/shaderpacks/ComplementaryReimagined_r5.9.3.zip"], "bundle_unclear": false (true: ship the mods the
audit marks *unclear* too, only with the owner's say-so), "motd" for the server.
"""
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(os.path.dirname(HERE))
PACK = os.path.join(ROOT, "pack")
CACHE = os.path.join(ROOT, "run", "cache")
OUT = os.path.join(ROOT, "run", "release")
LICENSES = os.path.join(ROOT, "audit", "release", "mod_licenses.json")
FIXED_TIME = (2026, 10, 19, 0, 0, 0)

# Strings and file names that must never be in any output (a maintainer's private server, paths, secrets). The list
# itself would give them away, so it lives in an optional local file that isn't published:
# tools/release/private_strings.json = {"strings": [...], "names": [...]}.
FORBIDDEN = []
FORBIDDEN_NAMES = ["servers.dat", "servers.dat_old"]
_private = os.path.join(HERE, "private_strings.json")
if os.path.exists(_private):
    with open(_private, encoding="utf-8") as _fh:
        _p = json.load(_fh)
    FORBIDDEN += _p.get("strings", [])
    FORBIDDEN_NAMES += _p.get("names", [])
SKIP_FILES = {"servers.dat", "servers.dat_old", "laststate.txt", ".gitkeep", "Thumbs.db", ".DS_Store"}

# server.properties for a public server. allow-flight=true: flying items/armour (jetpacks and the like) otherwise get
# players kicked for "flying"; PORT-1.20.1.md recorded that the original pack's server needed it.
SERVER_PROPERTIES = """#Minecraft server properties (defaults for this pack; Minecraft adds every key not listed)
motd={motd}
server-port=25565
allow-flight=true
online-mode=true
enforce-secure-profile=true
enable-rcon=false
enable-query=false
enable-command-block=false
white-list=false
enforce-whitelist=false
level-name=world
level-seed=
difficulty=easy
gamemode=survival
pvp=true
max-players=20
spawn-protection=0
view-distance=10
simulation-distance=8
sync-chunk-writes=true
network-compression-threshold=256
player-idle-timeout=0
"""
JVM_ARGS = """# Memory: raise -Xmx if the server runs out (8 GB handles a few players; the pack itself needs about 5 GB).
-Xms4G
-Xmx8G
-XX:+UseG1GC
-XX:+ParallelRefProcEnabled
-XX:MaxGCPauseMillis=200
-XX:+UnlockExperimentalVMOptions
-XX:+DisableExplicitGC
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M
-XX:G1ReservePercent=20
-XX:G1HeapWastePercent=5
-XX:G1MixedGCCountTarget=4
-XX:InitiatingHeapOccupancyPercent=15
-XX:G1MixedGCLiveThresholdPercent=90
-XX:SurvivorRatio=32
-XX:+PerfDisableSharedMem
-XX:MaxTenuringThreshold=1
"""
START_SH = """#!/usr/bin/env sh
# Starts the server. Run setup.py once first.
cd "$(dirname "$0")" || exit 1
exec java @user_jvm_args.txt @libraries/net/neoforged/neoforge/{nf}/unix_args.txt nogui "$@"
"""
START_BAT = """@echo off
rem Starts the server. Run setup.py once first.
cd /d "%~dp0"
java @user_jvm_args.txt @libraries/net/neoforged/neoforge/{nf}/win_args.txt nogui %*
pause
"""
FETCH_BAT = """@echo off
rem Downloads the few mods this pack cannot link to (CurseForge-only ones). Run once after importing the pack.
cd /d "%~dp0"
where py >nul 2>nul && (py -3 fetch_mods.py & goto :done)
where python >nul 2>nul && (python fetch_mods.py & goto :done)
echo Python 3 is needed. Install it from https://www.python.org/downloads/ or download the jars listed in fetch_mods.json by hand into the mods folder.
:done
pause
"""
README_SERVER = """{name} {version}: dedicated server pack
{underline}

For Minecraft {mc}, NeoForge {nf}. Needs Java 21 and Python 3 (only to run setup.py).

SETUP (once)
  1. Install Java 21 (Temurin: https://adoptium.net) and check `java -version` says 21.
  2. In this folder run:   python setup.py
     It downloads the NeoForge {nf} installer from maven.neoforged.net and runs it, then downloads the
     mods that are not inside this zip (their licences do not allow re-uploading; they come from Modrinth and
     CurseForge, checked against sha1 where known). A mod that fails to download is listed with its page.
  3. Read the Minecraft EULA (https://aka.ms/MinecraftEULA) and, if you agree, set eula=true in eula.txt.
  4. Start: ./start.sh (Linux/macOS) or start.bat (Windows). The first start builds the world and takes a while.

PLAYERS
  Players use the matching client pack, {prefix}-{version}-Client.zip (import it in Prism Launcher or the
  CurseForge app), and need 8 GB of RAM allocated to the game. The server and client must be the same pack version.

WHAT IS IN HERE
  mods/                the freely licensed mods, plus the Create: Arcane Engineering core mod (cae-3.0.0.jar)
  config/ defaultconfigs/ kubejs/   the pack's configuration, quests and recipe scripts
  server.properties    sane public defaults. allow-flight=true is deliberate (flying items would otherwise kick
                       players). online-mode=true, RCON off, no whitelist: add your own with /whitelist or edit the file.
  user_jvm_args.txt    memory and GC flags (4-8 GB heap; raise -Xmx for more players)
  MOD-LICENSES.md      every mod, its licence and where it came from

BACKUPS AND UPDATES
  Back up the world folder before updating the pack. After an update re-run `python setup.py` to fetch changed mods,
  and delete old jars from mods/ that the new release no longer lists.

Credits: pack by FortnitePro420Xx ({original}); ported to 1.21.1 by its community porters. Every mod belongs to its
authors; see MOD-LICENSES.md.
"""
FETCH_README = """Create: Arcane Engineering pack: extra mod downloads
====================================================

A few mods in this pack are only published on CurseForge and their licences do not allow us to include them
here, and a .mrpack cannot link to CurseForge. Run fetch_mods.bat (Windows) or `python3 fetch_mods.py` (this folder
is the instance's Minecraft folder: in Prism right-click the instance > Folder > Minecraft) once after the first import.
It downloads the jars listed in fetch_mods.json into the mods folder. Do it before the first launch.
"""


def load_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def sha(path, algo):
    h = hashlib.new(algo)
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def zinfo(name, mode=0o644):
    zi = zipfile.ZipInfo(name, FIXED_TIME)
    zi.external_attr = mode << 16
    zi.compress_type = zipfile.ZIP_STORED if name.endswith((".jar", ".zip", ".png", ".ogg")) else zipfile.ZIP_DEFLATED
    return zi


def add_file(z, arc, src, mode=0o644):
    with open(src, "rb") as fh:
        z.writestr(zinfo(arc, mode), fh.read())


def add_text(z, arc, text, mode=0o644, crlf=False):
    if crlf:
        text = text.replace("\r\n", "\n").replace("\n", "\r\n")
    z.writestr(zinfo(arc, mode), text.encode("utf-8"))


def walk_files(base, rel, excluded):
    """(archive-relative path, absolute path) of every file under base, minus junk and excluded paths."""
    out = []
    for dirpath, dirs, files in os.walk(base):
        dirs.sort()
        for f in sorted(files):
            if f in SKIP_FILES:
                continue
            src = os.path.join(dirpath, f)
            relp = os.path.relpath(src, base).replace(os.sep, "/")
            if any((rel + "/" + relp).startswith(x) for x in excluded):
                continue
            out.append((relp, src))
    return out


class Plan:
    """What happens to each mod: embed (jar inside the pack), mr (Modrinth download), cf (CurseForge-only helper)."""

    def __init__(self, rel):
        self.rel = rel
        mods = load_json(os.path.join(PACK, "mods.json"))
        if not os.path.exists(LICENSES):
            import pack_licenses
            pack_licenses.main()
        lic = {r["file"]: r for r in load_json(LICENSES)["mods"]}
        self.items = []
        for m in mods["mods"]:
            r = lic.get(m["file"])
            jar = os.path.join(CACHE, m["file"])
            if r is None:
                sys.exit(f"{m['file']}: not in mod_licenses.json; run tools/release/pack_licenses.py")
            if not os.path.exists(jar):
                sys.exit(f"{m['file']}: jar missing from run/cache/ (run tools/pack.py's fetch); not downloading blindly")
            sha1 = sha(jar, "sha1")
            if sha1 != r["sha1"]:
                sys.exit(f"{m['file']}: jar changed since the licence audit; rerun tools/release/pack_licenses.py")
            verdict = r["verdict"]
            if verdict == "unclear" and rel.get("bundle_unclear"):
                verdict = "bundle"
            exact = (r.get("modrinth") or {}).get("file")
            alt = (r.get("modrinth_alt") or {}).get("file")
            self.items.append({"mod": m, "lic": r, "jar": jar, "sha1": sha1, "verdict": verdict, "exact": exact,
                               "alt": alt})
        self.local = [os.path.join(PACK, "local", f) for f in sorted(os.listdir(os.path.join(PACK, "local")))
                      if f.endswith(".jar")]

    @staticmethod
    def mode(it, embed_all):
        """embed / mr / cf for one mod."""
        if it["verdict"] == "bundle" and (embed_all or not it["exact"]):
            return "embed"
        if it["exact"]:
            return "mr"
        if it["alt"] and it["verdict"] != "bundle":
            return "mr"   # same release, uploaded to Modrinth separately by its author
        if it["mod"].get("cf"):
            return "cf"
        sys.exit(f"{it['mod']['file']}: no way to deliver it")

    @staticmethod
    def mr_file(it):
        return it["exact"] or it["alt"]


def cf_entry(it):
    m = it["mod"]
    return {"file": m["file"], "sha1": it["sha1"], "curseforge": m["cf"],
            "page": f"https://www.curseforge.com/projects/{m['cf'][0]}"}


def mr_entry(it):
    f = Plan.mr_file(it)
    return {"file": it["mod"]["file"], "url": f["url"], "sha1": f["sha1"]}


def license_text(rel, plan, embed_all, side_filter):
    L = [f"# Mods in {rel['name']} {rel['version']}\n",
         f"Pack by {rel['original_author']} ({rel['original_pack']}), ported to Minecraft {rel['minecraft']} / "
         f"{rel['loader'].capitalize()} {rel['loader_version']}. Every mod belongs to its authors and stays under its own "
         "licence; this list says what that licence is and whether the jar is inside the download or fetched from its "
         "source (never re-uploaded when the licence does not allow it).\n",
         "Source code for the GPL/LGPL/MPL mods is at the project links below (and in each project's source repository). "
         "`cae-3.0.0.jar` (Create: Arcane Engineering core) is covered by the original author's permission.\n",
         "| mod | licence | in this download | project |", "|---|---|---|---|"]
    for it in plan.items:
        if not side_filter(it["mod"]):
            continue
        r = it["lic"]
        mode = Plan.mode(it, embed_all)
        where = {"embed": "bundled", "mr": "downloaded from Modrinth", "cf": "downloaded from CurseForge"}[mode]
        mr = r.get("modrinth") or r.get("modrinth_alt") or {}
        link = mr.get("url") or r.get("curseforge") or ""
        lic = r["reason"] if it["verdict"] != "link-only" else "All Rights Reserved (not re-uploaded)"
        if it["verdict"] == "unclear" and it["verdict"] == r["verdict"]:
            lic = "see project (custom or conflicting licence; not re-uploaded): " + r["reason"]
        L.append(f"| {it['mod']['name'].strip()} | {lic} | {where} | {link} |")
    L.append("| Create: Arcane Engineering core (cae-3.0.0.jar) | by the pack author's permission | bundled | |")
    return "\n".join(L) + "\n"


def stat_embed(plan, embed_all, side_filter=lambda m: True):
    return [it for it in plan.items if side_filter(it["mod"]) and Plan.mode(it, embed_all) == "embed"]


CF_MAP = os.path.join(HERE, "cf_map.json")


def build_curseforge(rel, plan, excluded):
    """The Client download: a CurseForge-format modpack zip (manifest.json + overrides/). The CurseForge app and Prism
    Launcher (Add Instance > Import) both import it and download every listed mod from CurseForge themselves; Prism
    shows its blocked-mods window for any author who disabled third-party downloads. Every mod is listed by its
    CurseForge file: mods.json's own `cf` ids, or for the Modrinth-sourced ones the matching CurseForge file from
    tools/release/pack_cf_map.py (tools/release/cf_map.json). A mod with no CurseForge file goes inside the zip, which
    its licence must allow."""
    name = f"{rel['file_prefix']}-{rel['version']}-Client.zip"
    path = os.path.join(OUT, name)
    cf_map = {e["file"]: e for e in load_json(CF_MAP).values()}
    files, embedded = [], []
    for it in plan.items:
        m = it["mod"]
        ids = m.get("cf") or (cf_map.get(m["file"]) or {}).get("cf")
        if ids:
            files.append({"projectID": ids[0], "fileID": ids[1], "required": True})
        elif it["verdict"] == "bundle":
            embedded.append(it)
        else:
            sys.exit(f"{m['file']}: not on CurseForge and its licence doesn't allow shipping it ({it['verdict']})")
    manifest = {
        "minecraft": {"version": rel["minecraft"],
                      "modLoaders": [{"id": f"{rel['loader']}-{rel['loader_version']}", "primary": True}],
                      "recommendedRam": rel["recommended_memory_mb"]},
        "manifestType": "minecraftModpack", "manifestVersion": 1,
        "name": rel["name"], "version": rel["version"], "author": rel.get("author", ""),
        "files": files, "overrides": "overrides"}
    rows = "".join(f"<li>{it['mod']['name'].strip()}</li>" for it in plan.items)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        add_text(z, "manifest.json", json.dumps(manifest, indent=1))
        add_text(z, "modlist.html", f"<ul>{rows}</ul>\n")
        for it in embedded:
            add_file(z, "overrides/mods/" + it["mod"]["file"], it["jar"])
        for jar in plan.local:
            add_file(z, "overrides/mods/" + os.path.basename(jar), jar)
        for relp, src in walk_files(os.path.join(PACK, "overrides"), "overrides", excluded):
            add_file(z, "overrides/" + relp, src)
        for relp, src in walk_files(os.path.join(PACK, "overrides-client"), "overrides-client", excluded):
            add_file(z, "overrides/" + relp, src)
        # a fresh player's options.txt and the Quark bubble marker (SKIP_FILES keeps servers.dat out)
        for relp, src in walk_files(os.path.join(PACK, "client-defaults"), "client-defaults", excluded):
            add_file(z, "overrides/" + relp, src)
        add_text(z, "overrides/MOD-LICENSES.md", license_text(rel, plan, False, lambda m: True))
    return {"file": name, "mods_listed": len(files), "mods_embedded": len(embedded) + len(plan.local),
            "embedded_mb": round(sum(os.path.getsize(it["jar"]) for it in embedded) / 1048576, 1)}


def build_mrpack(rel, plan, full, excluded):
    name = f"{rel['slug']}-{rel['version']}" + ("-full" if full else "") + ".mrpack"
    path = os.path.join(OUT, name)
    files, embedded, gap = [], [], []
    for it in plan.items:
        m = it["mod"]
        mode = Plan.mode(it, full)
        if mode == "embed":
            embedded.append(it)
        elif mode == "mr":
            f = Plan.mr_file(it)
            side = m["side"]
            files.append({"path": "mods/" + m["file"],
                          "hashes": {"sha1": f["sha1"], "sha512": f["sha512"]},
                          "env": {"client": "required", "server": "unsupported" if side == "client" else "required"},
                          "downloads": [f["url"]], "fileSize": f["size"]})
        else:
            gap.append(it)
    files.sort(key=lambda f: f["path"].lower())
    index = {"formatVersion": 1, "game": "minecraft", "versionId": rel["version"], "name": rel["name"],
             "summary": f"{rel['name']}: Create: Arcane Engineering for Minecraft {rel['minecraft']} "
                        f"({rel['loader'].capitalize()}). Needs Java {rel['java']} and about "
                        f"{rel['recommended_memory_mb'] // 1024} GB of RAM for the game.",
             "files": files, "dependencies": {"minecraft": rel["minecraft"], rel["loader"]: rel["loader_version"]}}
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        add_text(z, "modrinth.index.json", json.dumps(index, indent=1))
        for it in embedded:
            # mods needed on the server too (side both/server) go into the shared overrides; client-only into client-overrides
            base = "client-overrides" if it["mod"]["side"] == "client" else "overrides"
            add_file(z, f"{base}/mods/{it['mod']['file']}", it["jar"])
        for jar in plan.local:
            add_file(z, "overrides/mods/" + os.path.basename(jar), jar)
        for relp, src in walk_files(os.path.join(PACK, "overrides"), "overrides", excluded):
            add_file(z, "overrides/" + relp, src)
        for relp, src in walk_files(os.path.join(PACK, "overrides-client"), "overrides-client", excluded):
            add_file(z, "client-overrides/" + relp, src)
        # a fresh player's options.txt and the Quark bubble marker; servers.dat (the owner's server) is skipped
        for relp, src in walk_files(os.path.join(PACK, "client-defaults"), "client-defaults", excluded):
            add_file(z, "client-overrides/" + relp, src)
        add_text(z, "overrides/MOD-LICENSES.md", license_text(rel, plan, full, lambda m: True))
        if gap:
            add_text(z, "overrides/fetch_mods.json", json.dumps([cf_entry(it) for it in gap], indent=1))
            add_file(z, "overrides/fetch_mods.py", os.path.join(HERE, "pack_fetch_mods.py"))
            add_text(z, "overrides/fetch_mods.bat", FETCH_BAT, crlf=True)
            add_text(z, "overrides/FETCH-MODS-README.txt", FETCH_README)
    return {"file": name, "mods_downloaded": len(files), "mods_embedded": len(embedded) + len(plan.local),
            "mods_fetch_helper": len(gap), "fetch_helper": [it["mod"]["name"] for it in gap],
            "embedded_mb": round(sum(os.path.getsize(it["jar"]) for it in embedded) / 1048576, 1)}


def build_server(rel, plan, excluded):
    name = f"{rel['file_prefix']}-{rel['version']}-Server.zip"
    path = os.path.join(OUT, name)
    sel = lambda m: m["side"] != "client"  # noqa: E731
    embedded, fetch = [], []
    for it in plan.items:
        if not sel(it["mod"]):
            continue
        mode = Plan.mode(it, True)
        if mode == "embed":
            embedded.append(it)
        elif mode == "mr":
            fetch.append(mr_entry(it))
        else:
            fetch.append(cf_entry(it))
    fetch.sort(key=lambda e: e["file"].lower())
    setup = open(os.path.join(HERE, "pack_server_setup.py"), encoding="utf-8").read()
    setup = setup.replace("@NEOFORGE@", rel["loader_version"]).replace("@MINECRAFT@", rel["minecraft"])
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for it in embedded:
            add_file(z, "mods/" + it["mod"]["file"], it["jar"])
        for jar in plan.local:
            add_file(z, "mods/" + os.path.basename(jar), jar)
        for relp, src in walk_files(os.path.join(PACK, "overrides"), "overrides", excluded):
            add_file(z, relp, src)
        add_text(z, "fetch_mods.json", json.dumps(fetch, indent=1))
        add_file(z, "fetch_mods.py", os.path.join(HERE, "pack_fetch_mods.py"))
        add_text(z, "setup.py", setup)
        add_text(z, "server.properties", SERVER_PROPERTIES.format(motd=rel.get("motd", rel["name"])))
        add_text(z, "user_jvm_args.txt", JVM_ARGS)
        add_text(z, "start.sh", START_SH.format(nf=rel["loader_version"]), mode=0o755)
        add_text(z, "start.bat", START_BAT.format(nf=rel["loader_version"]), crlf=True)
        title = f"{rel['name']} {rel['version']}"
        add_text(z, "README-server.txt", README_SERVER.format(
            name=rel["name"], version=rel["version"], underline="=" * (len(title) + 22), mc=rel["minecraft"],
            nf=rel["loader_version"], slug=rel["slug"], prefix=rel["file_prefix"], original=rel["original_pack"]))
        add_text(z, "MOD-LICENSES.md", license_text(rel, plan, True, sel))
    return {"file": name, "mods_embedded": len(embedded) + len(plan.local), "mods_fetched_by_setup": len(fetch),
            "embedded_mb": round(sum(os.path.getsize(it["jar"]) for it in embedded) / 1048576, 1)}


def scan(path):
    """Fail on forbidden strings in member names and in the content of every member except third-party jars."""
    bad = []
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            base = info.filename.rsplit("/", 1)[-1]
            if base in FORBIDDEN_NAMES:
                bad.append((info.filename, "forbidden file"))
            data = z.read(info.filename)
            if info.filename.endswith(".jar") and "cae-" not in base:
                continue   # third-party jars: names only
            if info.filename.endswith(".jar"):
                inner = zipfile.ZipFile(io.BytesIO(data))
                for ii in inner.infolist():
                    blob = inner.read(ii.filename) + ii.filename.encode()
                    for s in FORBIDDEN:
                        if s.encode() in blob:
                            bad.append((info.filename + "!" + ii.filename, s))
                continue
            blob = data + info.filename.encode()
            for s in FORBIDDEN:
                if s.encode() in blob:
                    bad.append((info.filename, s))
    return bad


def main():
    rel = load_json(os.path.join(HERE, "release.json"))
    os.makedirs(OUT, exist_ok=True)
    excluded = tuple(rel.get("exclude_overrides", []))
    plan = Plan(rel)
    report = {"release": {k: rel[k] for k in ("name", "version", "slug")}, "mods_in_pack": len(plan.items), "outputs": []}
    # the release ships two downloads: Client (CurseForge format) and Server. build_mrpack() can still make a Modrinth
    # .mrpack (`--mrpack`), but that format can't point at CurseForge-only mods (it needs the fetch_mods helper).
    report["outputs"].append(build_curseforge(rel, plan, excluded))
    report["outputs"].append(build_server(rel, plan, excluded))
    if "--mrpack" in sys.argv:
        report["outputs"].append(build_mrpack(rel, plan, False, excluded))
    sums = []
    problems = []
    for o in report["outputs"]:
        p = os.path.join(OUT, o["file"])
        o["bytes"] = os.path.getsize(p)
        o["sha256"] = sha(p, "sha256")
        sums.append(f"{o['sha256']}  {o['file']}")
        for where, s in scan(p):
            problems.append((o["file"], where, s))
        print(f"{o['file']}: {o['bytes'] / 1048576:.1f} MB; " + ", ".join(f"{k}={v}" for k, v in o.items()
                                                                         if k.startswith("mods_") or k == "embedded_mb"))
    with open(os.path.join(OUT, "SHA256SUMS.txt"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(sums) + "\n")
    report["forbidden_string_hits"] = problems
    with open(os.path.join(OUT, "build-report.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=1)
    if problems:
        for p in problems:
            print("FORBIDDEN:", p)
        sys.exit(1)
    print("no forbidden strings in any output")


if __name__ == "__main__":
    main()
