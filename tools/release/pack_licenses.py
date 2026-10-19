"""Licence audit for every mod in pack/mods.json (read-only lookups; responses cached in run/release/cache/).

    python -I -X utf8 tools/release/pack_licenses.py            -> audit/release/mod_licenses.json and .md

Sources per mod: the jar's META-INF/neoforge.mods.toml (license, authors, mod id), Modrinth (found by the jar's sha1,
so CurseForge-sourced mods that are also on Modrinth are matched too: project licence, source and issues links, team),
and the CurseForge widget API (api.cfwidget.com, a public mirror of the project page: licence text, owner). The
CurseForge site API does not expose `allowModDistribution` without an API key, so it is not used.

Verdicts (conservative: anything not clearly redistributable is not bundled):
  bundle      every source that states a licence states a permissive/copyleft one that allows redistribution
              (MIT, Apache, BSD, ISC, Unlicense, CC0, zlib, MPL, LGPL, GPL, CC-BY, CC-BY-SA)
  link-only   All Rights Reserved / proprietary / custom restrictive / no licence anywhere
  unclear     sources disagree, NC/ND Creative Commons, or a licence text we cannot classify
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import tomllib
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, "run", "cache")
LOCAL = os.path.join(ROOT, "pack", "local")
RCACHE = os.path.join(ROOT, "run", "release", "cache")
OUT = os.path.join(ROOT, "audit", "release")


def curl(args, cache_name=None):
    path = os.path.join(RCACHE, cache_name) if cache_name else None
    if path and os.path.exists(path):
        return open(path, "rb").read()
    out = subprocess.run(["curl", "-sSLg", "-A", "Mozilla/5.0 (cae-port licence audit)", "--retry", "3"] + args,
                         capture_output=True)
    if out.returncode != 0:
        return None
    if path:
        open(path, "wb").write(out.stdout)
        time.sleep(0.3)
    return out.stdout


def jar_info(jar):
    """license, authors, mod ids and display names from the jar's mods.toml (jar-in-jar covered by the parent)."""
    z = zipfile.ZipFile(jar)
    for name in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml"):
        if name in z.namelist():
            try:
                t = tomllib.loads(z.read(name).decode("utf-8", "replace"))
            except Exception as e:  # noqa: BLE001
                return {"toml_error": str(e)}
            mods = t.get("mods") or []
            authors = []
            for m in mods:
                if m.get("authors"):
                    authors.append(str(m["authors"]))
            if t.get("authors"):
                authors.append(str(t["authors"]))
            nested = [n for n in z.namelist() if n.startswith("META-INF/jarjar/") and n.endswith(".jar")]
            return {"license": str(t.get("license", "")).strip(), "authors": sorted(set(authors)),
                    "mod_ids": [m.get("modId") for m in mods], "display": [m.get("displayName") for m in mods],
                    "homepage": next((m.get("displayURL") for m in mods if m.get("displayURL")), t.get("displayURL")),
                    "jarjar": [os.path.basename(n) for n in nested]}
    return {"toml_error": "no mods.toml"}


PERMISSIVE = [
    (r"\bmit\b", "MIT"), (r"apache", "Apache-2.0"), (r"\bbsd", "BSD"), (r"\bisc\b", "ISC"), (r"unlicense", "Unlicense"),
    (r"\bcc0\b|public domain|creative commons zero", "CC0"), (r"\bzlib\b", "zlib"), (r"\bmpl\b|mozilla public", "MPL-2.0"),
    (r"\blgpl|lesser general public", "LGPL"), (r"\bagpl|affero", "AGPL"), (r"\bgpl|general public license", "GPL"),
    (r"cc[- ]by(?![- ]?n[cd])|attribution(?!.*non)", "CC-BY"), (r"cc[- ]by[- ]sa", "CC-BY-SA"),
    (r"\bfair\b", "FAIR"),
]
RESTRICTIVE = r"all rights? reserved|\barr\b|proprietary|licenseref-all-rights|^custom|no license|unlicensed|\bcustom\b"
NCND = r"cc[- ]by[- ]n[cd]|non[- ]?commercial|no[- ]?derivs?|\bnc\b"


def classify(text):
    """-> (class, spdx-ish label) with class in permissive / restrictive / ncnd / unknown / none"""
    t = (text or "").strip()
    if not t:
        return "none", ""
    low = t.lower()
    if re.search(NCND, low):
        return "ncnd", t
    if re.search(RESTRICTIVE, low):
        return "restrictive", t
    for pat, label in PERMISSIVE:
        if re.search(pat, low):
            return "permissive", t
    return "unknown", t


def decide(sources):
    """sources: list of (source name, licence text) that exist. -> verdict, reason"""
    classes = [(s, classify(t)) for s, t in sources if (t or "").strip()]
    if not classes:
        return "link-only", "no licence stated by any source (treated as All Rights Reserved)"
    kinds = {c[0] for _, c in classes}
    desc = "; ".join(f"{s}: {c[1]}" for s, c in classes)
    if kinds == {"permissive"}:
        return "bundle", desc
    if kinds == {"restrictive"}:
        return "link-only", desc
    if kinds <= {"restrictive", "none"}:
        return "link-only", desc
    return "unclear", desc


def ask_note(row):
    """Why an 'unclear' mod needs a human, in a few words (read the licence itself before relying on this)."""
    txt = " ".join([row["reason"]]).lower()
    notes = []
    if re.search(r"nc-nd|nc-sa|noncommercial|non-commercial|nc ", txt):
        notes.append("Creative Commons NonCommercial (ND/SA variants): a free download is non-commercial, but ND/SA "
                     "conditions and 'redistribution of the unmodified jar' need the author's terms checked")
    if re.search(r"cc-by-nd", txt):
        notes.append("CC BY-ND: unmodified redistribution is allowed with credit, but one source says All Rights Reserved")
    if re.search(r"stardust|supplementaries|dsmsl|polyform|tr7zw|terrarium|dont-be|don't be|create-mod|mmpl|minecraft mod public|"
                 r"licenseref-multiple|see github|academic free|cddl|multiple-oss", txt):
        notes.append("custom or unusual licence: read its text (most such licences allow modpack/redistribution with conditions)")
    if re.search(r"all[- ]rights", txt) and re.search(r"mit|lgpl|gpl|cc-by|agpl|afl|academic", txt):
        notes.append("sources disagree (one says All Rights Reserved, another a free licence): ask the author or take the "
                     "Modrinth/jar licence at face value")
    if re.search(r"https?://", txt):
        notes.append("jar only links to a licence file: open it")
    return "; ".join(dict.fromkeys(notes)) or "sources disagree or licence not recognised"


def alt_lookup(mod):
    """A CurseForge-sourced mod whose jar is not on Modrinth by hash: is the same release (same file name) uploaded
    there separately? Then the Modrinth file can stand in for the CurseForge one in an .mrpack. Returns None if not."""
    import urllib.parse
    q = re.sub(r"\[.*?\]|\(.*?\)", "", mod["name"]).strip()
    key = re.sub(r"[^a-z0-9]", "", mod["file"].lower())
    facets = urllib.parse.quote('[["project_type:mod"],["versions:1.21.1"],["categories:neoforge"]]')
    r = curl([f"https://api.modrinth.com/v2/search?query={urllib.parse.quote(q)}&limit=4&facets={facets}"],
             "mr_search_" + re.sub(r"[^A-Za-z0-9]", "_", mod["file"]) + ".json")
    try:
        hits = json.loads(r).get("hits", [])
    except Exception:  # noqa: BLE001
        return None
    for h in hits[:3]:
        pid = h["project_id"]
        r = curl([f"https://api.modrinth.com/v2/project/{pid}/version?game_versions=%5B%221.21.1%22%5D"
                  "&loaders=%5B%22neoforge%22%5D"], f"mr_versions_{pid}.json")
        for v in json.loads(r):
            for f in v["files"]:
                if f["filename"] == mod["file"]:
                    pr = json.loads(curl([f"https://api.modrinth.com/v2/project/{pid}"], f"mr_project_{pid}.json"))
                    lic = pr.get("license") or {}
                    return {"project": pid, "slug": pr.get("slug"), "version": v["id"], "license_id": lic.get("id", ""),
                            "license_name": lic.get("name", ""), "source_url": pr.get("source_url"),
                            "url": f"https://modrinth.com/mod/{pr.get('slug')}",
                            "file": {"url": f["url"], "filename": f["filename"], "size": f["size"],
                                     "sha1": f["hashes"]["sha1"], "sha512": f["hashes"]["sha512"]}}
    del key
    return None


def main():
    os.makedirs(RCACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    pack = json.load(open(os.path.join(ROOT, "pack", "mods.json"), encoding="utf-8"))
    mods = pack["mods"]
    infos = {}
    for m in mods:
        jar = os.path.join(CACHE, m["file"])
        sha1 = hashlib.sha1(open(jar, "rb").read()).hexdigest()
        infos[m["file"]] = {"sha1": sha1, **jar_info(jar)}
    # Modrinth: bulk lookup by sha1, then bulk project data
    body = json.dumps({"hashes": [i["sha1"] for i in infos.values()], "algorithm": "sha1"})
    bp = os.path.join(RCACHE, "mr_version_files.json")
    if not os.path.exists(bp):
        r = curl(["-X", "POST", "-H", "Content-Type: application/json", "-d", body,
                  "https://api.modrinth.com/v2/version_files"])
        open(bp, "wb").write(r)
    vf = json.load(open(bp, encoding="utf-8"))
    pids = sorted({v["project_id"] for v in vf.values()})
    mr_proj = {}
    for i in range(0, len(pids), 40):
        chunk = pids[i:i + 40]
        r = curl(["https://api.modrinth.com/v2/projects?ids=" + json.dumps(chunk).replace(" ", "").replace(chr(34), "%22")],
                 f"mr_projects_{i}.json")
        for p in json.loads(r):
            mr_proj[p["id"]] = p
    members = {}
    for pid in pids:
        r = curl([f"https://api.modrinth.com/v2/project/{pid}/members"], f"mr_members_{pid}.json")
        try:
            members[pid] = [u["user"]["username"] for u in json.loads(r)]
        except Exception:  # noqa: BLE001
            members[pid] = []
    rows = []
    for m in mods:
        info = infos[m["file"]]
        row = {"name": m["name"], "file": m["file"], "side": m["side"], "sha1": info["sha1"],
               "curseforge": f"https://www.curseforge.com/projects/{m['cf'][0]}" if "cf" in m else None,
               "cf_ids": m.get("cf"), "mr_ids": m.get("mr"), "mod_ids": info.get("mod_ids"),
               "jar_license": info.get("license", ""), "jar_authors": info.get("authors", []),
               "jarjar": info.get("jarjar", [])}
        v = vf.get(info["sha1"])
        if v:
            p = mr_proj.get(v["project_id"], {})
            lic = p.get("license") or {}
            row["modrinth"] = {"project": v["project_id"], "slug": p.get("slug"), "title": p.get("title"),
                               "license_id": lic.get("id", ""), "license_name": lic.get("name", ""),
                               "license_url": lic.get("url"), "source_url": p.get("source_url"),
                               "team": members.get(v["project_id"], []),
                               "url": f"https://modrinth.com/mod/{p.get('slug')}"}
            f = next((f for f in v["files"] if f["hashes"].get("sha1") == info["sha1"]), None)
            if f:
                row["modrinth"]["file"] = {"url": f["url"], "filename": f["filename"], "size": f["size"],
                                           "sha1": f["hashes"]["sha1"], "sha512": f["hashes"]["sha512"]}
        else:
            row["modrinth"] = None
            row["modrinth_alt"] = alt_lookup(m)
        if "cf" in m:
            r = curl([f"https://api.cfwidget.com/{m['cf'][0]}"], f"cfw_{m['cf'][0]}.json")
            try:
                w = json.loads(r)
                mem = w.get("members") or []
                row["cfwidget"] = {"title": w.get("title"), "license": (w.get("license") or "").strip(),
                                   "owner": [u.get("username") for u in mem], "url": (w.get("urls") or {}).get("curseforge")}
            except Exception:  # noqa: BLE001
                row["cfwidget"] = None
        else:
            row["cfwidget"] = None
        srcs = [("jar", row["jar_license"])]
        if row["modrinth"]:
            lic = row["modrinth"]["license_id"] or row["modrinth"]["license_name"]
            srcs.append(("modrinth", lic))
        if row["cfwidget"]:
            srcs.append(("curseforge", row["cfwidget"]["license"]))
        if row.get("modrinth_alt"):
            srcs.append(("modrinth (same version, separate upload)", row["modrinth_alt"]["license_id"]))
        row["verdict"], row["reason"] = decide(srcs)
        row["evidence"] = [s for s, t in srcs if (t or "").strip()]
        row["ask_note"] = ask_note(row) if row["verdict"] == "unclear" else ""
        rows.append(row)
    # our own mod
    own = {"name": "Create: Arcane Engineering core (cae-3.0.0.jar)", "file": "cae-3.0.0.jar", "side": "both",
           "verdict": "bundle", "reason": "our own mod (source core/); covered by the original author's permission to share this port",
           "jar_license": "", "jar_authors": [], "modrinth": None, "cfwidget": None}
    out = {"generated_by": "tools/release/pack_licenses.py", "mods": rows, "local": [own]}
    json.dump(out, open(os.path.join(OUT, "mod_licenses.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    render_md(out)
    print("rows", len(rows))
    from collections import Counter
    print(Counter(r["verdict"] for r in rows))


def where(r):
    """Where a player's launcher can fetch this exact release from."""
    if r.get("modrinth"):
        return "Modrinth (same bytes)"
    if r.get("modrinth_alt"):
        return "Modrinth (same release, separate upload) + CurseForge"
    return "CurseForge only" if r.get("cf_ids") else "?"


def render_md(out):
    from collections import Counter
    rows = out["mods"]
    cnt = Counter(r["verdict"] for r in rows)
    L = []
    L.append("# Mod licence audit (19 Oct 2026)\n")
    L.append("Generated by `tools/release/pack_licenses.py` from `pack/mods.json`, the jars in `run/cache/`, Modrinth "
             "(matched by jar sha1) and the CurseForge widget API. Machine-readable copy: `mod_licenses.json`.\n")
    L.append("## Summary\n")
    L.append(f"{len(rows)} mods in `pack/mods.json` (jar-in-jar libraries are covered by their parent jar) plus our own "
             "`cae-3.0.0.jar`.\n")
    L.append("| verdict | mods | meaning |\n|---|---|---|")
    L.append(f"| bundle | {cnt['bundle']} | every source that states a licence states a free one (MIT, Apache, BSD, LGPL, GPL, MPL, "
             "CC0, Unlicense ...): may be shipped inside the download |")
    L.append(f"| link-only | {cnt['link-only']} | All Rights Reserved, or no licence found anywhere: the launcher must download "
             "it from CurseForge/Modrinth |")
    L.append(f"| unclear | {cnt['unclear']} | sources disagree, NonCommercial/NoDerivatives Creative Commons, or a custom licence: "
             "treated as link-only until the owner decides |")
    L.append("| (own) | 1 | `cae-3.0.0.jar` (source `core/`): covered by the original author's permission to share this port |\n")
    L.append("Decision rule: a mod is *bundle* only if no source calls it All Rights Reserved and at least one names a free "
             "licence. Conflicts, NC/ND and custom licences are *unclear*; ARR or nothing is *link-only*. The CurseForge "
             "site API refuses project data without a key, so CurseForge's per-project `allowModDistribution` flag could "
             "not be read; *bundle* verdicts for CurseForge-only mods rest on the licence in the jar's `neoforge.mods.toml` "
             "alone (marked `jar only` below). A CurseForge author can in theory disable third-party distribution of a file "
             "that is under an open licence; the licence still governs, but this is the residual risk.\n")
    ko = [r for r in rows if r["verdict"] != "bundle"]
    L.append("## Mods the owner would need to ask about to bundle everything\n")
    L.append(f"{len(ko)} mods (link-only + unclear). Authors/contact: see the project links in the tables below.\n")
    L.append("| mod | verdict | licence evidence | note |\n|---|---|---|---|")
    for r in sorted(ko, key=lambda r: (r["verdict"], r["name"].lower())):
        L.append(f"| {r['name'].strip()} | {r['verdict']} | {r['reason']} | {r.get('ask_note') or 'ARR / no licence: ask for written permission'} |")
    L.append("")
    L.append("## Bundle (free licences)\n")
    L.append("GPL/LGPL/MPL/CC-BY mods bring conditions when redistributed: keep the licence notice, and offer the source "
             "(the project links below are where the source lives; each jar's licence file is inside the jar). "
             "MIT/Apache/BSD/Unlicense/CC0 need only the notice, which stays inside the jars.\n")
    L.append("| mod | licence | source / project | authors (jar) | evidence |\n|---|---|---|---|---|")
    for r in sorted((r for r in rows if r["verdict"] == "bundle"), key=lambda r: r["name"].lower()):
        mr = r.get("modrinth") or {}
        link = mr.get("source_url") or mr.get("url") or r.get("curseforge") or ""
        ev = "+".join(r["evidence"])
        if r["evidence"] == ["jar"]:
            ev = "jar only"
        auth = ", ".join(r["jar_authors"]) or ", ".join(mr.get("team", []))
        L.append(f"| {r['name'].strip()} | {r['reason']} | {link} | {auth[:60]} | {ev} |")
    L.append("")
    L.append("## Link-only and unclear: where the launcher gets them\n")
    L.append("| mod | verdict | side | where |\n|---|---|---|---|")
    for r in sorted(ko, key=lambda r: (r["verdict"], r["name"].lower())):
        L.append(f"| {r['name'].strip()} | {r['verdict']} | {r['side']} | {where(r)} |")
    L.append("")
    L.append("## Notes\n")
    L.append("- Own mod: `cae-3.0.0.jar` is built from `core/` and is covered by the original author's permission "
             "(FortnitePro420Xx) to share this port publicly.")
    L.append("- Sodium (Polyform Shield) and Iris (LGPL) are separate things: Iris is *bundle*, Sodium is *unclear*.")
    L.append("- Shaderpack `ComplementaryReimagined_r5.9.3.zip` (in `pack/overrides-client/shaderpacks`) is not a mod and not "
             "covered here; Complementary Reimagined has its own custom licence, which the owner "
             "should read before the zip is shipped inside a download. The release builder can leave it out with "
             "`release.json` `exclude_overrides`.")
    L.append("")
    open(os.path.join(OUT, "mod_licenses.md"), "w", encoding="utf-8").write("\n".join(L))


if __name__ == "__main__":
    main()
