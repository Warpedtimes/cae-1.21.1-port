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

You do not need to install Minecraft, NeoForge or Java by hand if you use Prism Launcher. The pack file tells Prism
what to download.

## Client (playing)

### Step by step with Prism Launcher

1. Install [Prism Launcher](https://prismlauncher.org/) and sign in with your Minecraft account.
2. Download the pack file from the Releases page of this repository.
   TODO(owner): put the exact file name here (a `.mrpack` or a CurseForge `.zip`, whichever is released).
3. In Prism, click **Add Instance**.
4. Choose **Import** on the left. Pick the file you downloaded (or drag it into the window).
5. Click **OK**. Prism downloads the mods. This can take a few minutes.
6. Right click the new instance and choose **Edit**, then **Settings**, then **Java**.
   Tick **Memory** and set the **maximum memory allocation** to **8192 MiB** (8 GB).
   Prism picks Java 21 for you. If it does not, point it at a Java 21 install.
7. Start the instance.

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

A dedicated server needs the **server pack**, not the client file. The server pack leaves out client-only mods
(shaders, zoom, menus and so on).

### Steps

1. Install **Java 21**. Check with `java -version`.
2. Download the server pack from the Releases page and unzip it into an empty folder.
   TODO(owner): put the exact server pack file name here, and say whether it already contains the NeoForge server files
   or only the mods and configs.
3. Install the NeoForge server if the pack does not already contain it. Download the NeoForge **21.1.262** installer and
   run it in the server folder:

   `java -jar neoforge-21.1.262-installer.jar --install-server`

4. Accept the Minecraft EULA by setting `eula=true` in `eula.txt`.
5. Set the memory and start the server (see the next section).
6. The first start builds a new world. This can take a while.

### Start script

NeoForge writes the Java arguments into files. The start command is:

- Windows: `java @user_jvm_args.txt @libraries/net/neoforged/neoforge/21.1.262/win_args.txt nogui`
- Linux: `java @user_jvm_args.txt @libraries/net/neoforged/neoforge/21.1.262/unix_args.txt nogui`

Put the memory setting in `user_jvm_args.txt`, for example:

```
-Xms4G
-Xmx8G
```

TODO(owner): confirm the server memory to recommend (8 GB is the number tested for players), and say if the server pack
includes ready-made start scripts.

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

Back up your world before you update. Import the new release as a **new** Prism instance and copy your `saves` folder over
if you want to keep a world. Check the [Changelog](Changelog.md) first.
TODO(owner): say how updates are shipped (full pack only, or also an update zip).
