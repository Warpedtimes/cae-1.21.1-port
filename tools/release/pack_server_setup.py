"""setup.py: one-time server setup (downloads and runs the NeoForge installer, fetches the mods not bundled).

    python setup.py

Needs Java 21 on PATH (`java -version`). Does not accept the Minecraft EULA for you: after it finishes, read
https://aka.ms/MinecraftEULA and set eula=true in eula.txt yourself, then start with start.sh / start.bat.
"""
import os
import re
import shutil
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
NEOFORGE = "@NEOFORGE@"
MINECRAFT = "@MINECRAFT@"
INSTALLER_URL = f"https://maven.neoforged.net/releases/net/neoforged/neoforge/{NEOFORGE}/neoforge-{NEOFORGE}-installer.jar"
UA = "Mozilla/5.0 (setup.py; Create Arcane Engineering server pack)"


def java_major():
    java = shutil.which("java")
    if not java:
        return None
    out = subprocess.run([java, "-version"], capture_output=True, text=True)
    m = re.search(r'version "(\d+)', out.stderr + out.stdout)
    return int(m.group(1)) if m else None


def main():
    os.chdir(HERE)
    major = java_major()
    if major is None or major < 21:
        sys.exit(f"Java 21 or newer is needed (found: {major}). Install Temurin 21 from https://adoptium.net and retry.")
    libs = os.path.join("libraries", "net", "neoforged", "neoforge", NEOFORGE)
    if not os.path.isdir(libs):
        print("downloading the NeoForge installer ...", flush=True)
        req = urllib.request.Request(INSTALLER_URL, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as resp, open("neoforge-installer.jar", "wb") as out:
            shutil.copyfileobj(resp, out)
        print(f"installing NeoForge {NEOFORGE} for Minecraft {MINECRAFT} ...", flush=True)
        subprocess.run([shutil.which("java"), "-jar", "neoforge-installer.jar", "--installServer"], check=True)
        os.remove("neoforge-installer.jar")
    import fetch_mods
    ok = fetch_mods.fetch_all("mods")
    if not os.path.exists("eula.txt"):
        with open("eula.txt", "w", encoding="utf-8") as fh:
            fh.write("# Read https://aka.ms/MinecraftEULA, then change the next line to eula=true\neula=false\n")
    print("\nDone." if ok else "\nDone, but some mods need downloading by hand (see above).")
    print("Next: set eula=true in eula.txt, then run start.sh (Linux/macOS) or start.bat (Windows).")


if __name__ == "__main__":
    main()
