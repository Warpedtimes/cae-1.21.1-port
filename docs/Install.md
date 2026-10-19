# Install

[Home](Home.md) | [Changes from 1.18.2](Changes-from-1.18.2.md) | [Known differences](Known-Differences.md) | [Credits](Credits.md)

This page covers **Create: Arcane Engineering (1.21.1 Port)**, version 1.0.0.

You need:

| | |
|---|---|
| Minecraft | 1.21.1 |
| NeoForge | 21.1.262 |
| Java | 21 |
| Memory | 8 GB given to the game (so a computer with 16 GB or more is best) |

You do not need to install Minecraft, NeoForge or Java by hand if you use Prism Launcher or the CurseForge app. The
pack file tells the launcher what to download.

## Client (playing)

The client download is **`CAE-1.21.1-Port-1.0.0-Client.zip`** on the
[Releases page](https://github.com/Warpedtimes/cae-1.21.1-port/releases). It is a CurseForge-format modpack: it lists
the mods, and your launcher downloads each one from CurseForge.

### Step by step with Prism Launcher

1. Install [Prism Launcher](https://prismlauncher.org/) and sign in with your Minecraft account.
2. Download `CAE-1.21.1-Port-1.0.0-Client.zip`.
3. In Prism, click **Add Instance**.
4. Choose **Import** on the left. Pick the file you downloaded (or drag it into the window).
5. Click **OK**. Prism downloads the mods. This can take a few minutes.
   If a window lists mods to download by hand (their authors block downloads from other apps), click each link to
   download it in your browser. Prism picks the files up from your Downloads folder by itself.
6. Right click the new instance and choose **Edit**, then **Settings**, then **Java**.
   Tick **Memory** and set the **maximum memory allocation** to **8192 MiB** (8 GB).
   Prism picks Java 21 for you. If it does not, point it at a Java 21 install.
7. Start the instance.

### Step by step with the CurseForge app

1. Download `CAE-1.21.1-Port-1.0.0-Client.zip`.
2. In the CurseForge app, open Minecraft, then **My Modpacks**, then **Create Custom Profile**.
3. Click **import** (the link under the profile form) and pick the file. The app downloads the mods.
4. Set the memory to 8 GB: **Settings**, then **Minecraft**, then **Java Settings**, then **Allocated Memory**.
5. Press **Play**.

### Memory

8 GB is the number the pack is made for. Less may work in a new world, but late game, shaders and big bases need it.
Do not give the game all of your computer's memory. Leave at least 4 GB for Windows and other programs.

### Shaders on or off

The pack comes with the **Complementary Reimagined** shader pack, and it is **on by default**.

To turn it off (do this if the game runs slowly):

1. In game, open **Options**, then **Video Settings**, then **Shader Packs**.
2. Pick **(off)** and click **Apply**.

To turn it on again, pick `ComplementaryReimagined_r5.9.3.zip` in the same screen.

### First launch

- The first start takes longer than later ones. Wait for the main menu.
- The title screen and the loading screen are custom. This is normal.
- A welcome message appears when you join. If item names or textures look missing, press **F3 + T** to reload them.
- Keys on a fresh install: **`** (the key under Escape) zooms, **N** toggles full brightness. You can change both in
  **Options, Controls, Key Binds**.
- Open the quest book to start. The first chapters tell you what to do.

### Things to avoid

- Do not add other Xaero's Minimap or World Map files on top of the ones in the pack. On a server, the mod versions
  must match exactly, or you are disconnected when you log in.
- Do not mix in mods made for 1.18.2, 1.20.1 or Forge. They will not load.

## Server

A dedicated server needs **`CAE-1.21.1-Port-1.0.0-Server.zip`**, not the client file. It leaves out client-only mods
(shaders, zoom, menus and so on) and has its own `README-server.txt`.

### Steps

1. Install **Java 21** (for example [Temurin](https://adoptium.net)). Check with `java -version`.
2. Install **Python 3** (only needed for the one-time setup).
3. Unzip `CAE-1.21.1-Port-1.0.0-Server.zip` into an empty folder.
4. In that folder, run `python setup.py` once. It downloads and runs the NeoForge **21.1.262** installer, then downloads
   the mods whose licences don't allow including them in the zip (from Modrinth and CurseForge, checked by checksum).
   A mod that fails to download is listed with its page, so you can fetch it by hand into `mods/`.
5. Read the [Minecraft EULA](https://aka.ms/MinecraftEULA) and, if you agree, set `eula=true` in `eula.txt`.
6. Start the server with `./start.sh` (Linux/macOS) or `start.bat` (Windows).
7. The first start builds a new world. This can take a while.

### Memory and the start scripts

`start.sh` and `start.bat` run NeoForge with the settings in `user_jvm_args.txt`. That file starts the server with
4 GB and lets it use up to 8 GB (`-Xms4G`, `-Xmx8G`), which handles a few players; the pack itself needs about 5 GB.
Raise `-Xmx` for more players.

Always use the Java 21 program for the command, not an older one. If `java` on your system is an older version, write
the full path to Java 21.

### The settings that matter

In `server.properties`:

| Setting | Value | Why |
|---|---|---|
| `allow-flight` | `true` | Some things in the pack let players fly. With this off, the server can kick them for "flying". |

Other things to know:

- **Whitelist and operators** are normal Minecraft settings. Use them as you would for any server.
- **Structures are many and large.** The first time players explore, the server makes new chunks. This costs time.
  You can pre-generate the world with Chunky (it is in the server pack).
  The pack pauses Chunky while players are online and continues when the server is empty, but only if you have started a
  Chunky task.
- **Xaero's maps** are included. Map sharing between players works through the server. Keep the server and client
  versions the same.
- Players and the server must run the **same pack version**.

## Updating

Back up your world before you update. Each release is a full pack: import the new Client zip as a **new** instance and
copy your `saves` folder over if you want to keep a world. On a server, unzip the new Server zip over the old folder,
run `python setup.py` again, and delete jars from `mods/` that the new release no longer lists. Check the
[Changelog](Changelog.md) first.
