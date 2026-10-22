package com.caeport.cae.client;

import com.illusivesoulworks.veinmining.common.platform.ClientServices;
import com.illusivesoulworks.veinmining.common.veinmining.VeinMiningKey;
import com.mojang.logging.LogUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import net.minecraft.ChatFormatting;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.network.chat.Component;
import net.minecraft.network.chat.MutableComponent;
import net.neoforged.fml.loading.FMLPaths;

/**
 * Vein Mining's key toggles vein mining on and off (owner's request, 21 Oct 2026). Vein Mining 5.0.0-beta.2 reads its
 * key only in the HOLD_KEY_DOWN activation mode; in the default STANDING mode it vein mines whenever the player isn't
 * crouching and the key did nothing. This replaces its client tick: the key flips the state, and the state goes to the
 * server every 5 ticks as before (the server forgets it after 20). Vein mining starts on, as it was; the choice is kept
 * in config/cae-veinmining.txt. The activation modes in veinmining-client.toml no longer matter.
 */
public final class VeinMiningToggle {
    private static final Path FILE = FMLPaths.CONFIGDIR.get().resolve("cae-veinmining.txt");
    private static Boolean on;

    private VeinMiningToggle() {
    }

    public static boolean isOn() {
        if (on == null) {
            try {
                on = !Files.readString(FILE).trim().equals("off");
            } catch (IOException e) {
                on = true;
            }
        }
        return on;
    }

    public static void tick() {
        Minecraft mc = Minecraft.getInstance();
        LocalPlayer player = mc.player;
        if (mc.level == null || player == null) {
            return;
        }
        boolean toggled = false;
        while (VeinMiningKey.get().consumeClick()) {
            on = !isOn();
            toggled = true;
        }
        if (toggled) {
            save();
            player.displayClientMessage(Component.translatable(on ? "cae.veinmining.on" : "cae.veinmining.off")
                    .withStyle(on ? ChatFormatting.GREEN : ChatFormatting.RED), true);
        }
        if (toggled || mc.level.getGameTime() % 5 == 0) {
            ClientServices.PLATFORM.sendC2SState(isOn());
        }
    }

    /** The line Vein Mining adds to the tooltip of enchanted tools. */
    public static MutableComponent tutorial() {
        KeyMapping key = VeinMiningKey.get();
        String state = isOn() ? "on" : "off";
        if (key.isUnbound()) {
            return Component.translatable("cae.veinmining.tooltip." + state + ".no_key");
        }
        return Component.translatable("cae.veinmining.tooltip." + state,
                key.getTranslatedKeyMessage().copy().withStyle(ChatFormatting.YELLOW));
    }

    private static void save() {
        try {
            Files.writeString(FILE, on ? "on\n" : "off\n");
        } catch (IOException e) {
            LogUtils.getLogger().warn("Couldn't save the vein mining toggle to {}", FILE, e);
        }
    }
}
