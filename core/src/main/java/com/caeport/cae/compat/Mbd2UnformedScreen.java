package com.caeport.cae.compat;

import com.lowdragmc.lowdraglib2.gui.holder.ModularUIScreen;
import com.lowdragmc.lowdraglib2.gui.ui.ModularUI;
import com.lowdragmc.lowdraglib2.gui.ui.UI;
import com.lowdragmc.lowdraglib2.gui.ui.style.StylesheetManager;
import com.lowdragmc.mbd2.api.blockentity.IMachineBlockEntity;
import com.lowdragmc.mbd2.api.pattern.PatternPreview;
import com.lowdragmc.mbd2.common.machine.MBDMultiblockMachine;
import com.mojang.logging.LogUtils;
import com.caeport.cae.Cae;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.entity.player.PlayerInteractEvent;
import org.slf4j.Logger;

/**
 * Multiblocked (1.18.2, 1.0.9) opened a screen on a controller that was not formed: its structure page, a 3D preview of
 * the pattern with the parts it needs. (Sneaking with an empty hand showed the in-world hologram instead, and a held
 * catalyst tried to form it; Multiblocked2 does both of those itself.) Multiblocked2 opens nothing for an unformed
 * controller, so this opens the same thing from its own pattern preview, {@link PatternPreview}, the page its JEI category
 * shows. It runs on the client and cancels the click there, so nothing is sent to the server.
 */
@EventBusSubscriber(modid = Cae.ID, value = Dist.CLIENT)
public final class Mbd2UnformedScreen {
    private static final Logger LOGGER = LogUtils.getLogger();

    private Mbd2UnformedScreen() {
    }

    @SubscribeEvent
    public static void onRightClickBlock(PlayerInteractEvent.RightClickBlock event) {
        if (!event.getLevel().isClientSide() || event.getHand() != InteractionHand.MAIN_HAND || event.getEntity().isShiftKeyDown()) {
            return;
        }
        BlockEntity be = event.getLevel().getBlockEntity(event.getPos());
        if (!(be instanceof IMachineBlockEntity machineBe) || !(machineBe.getMetaMachine() instanceof MBDMultiblockMachine machine)
                || machine.isFormed()) {
            return;
        }
        var settings = machine.getDefinition().multiblockSettings();
        if (!settings.showUIOnlyFormed()) {
            return; // Multiblocked2 opens the machine's own screen for this one
        }
        var catalyst = settings.catalyst();
        if (catalyst.isEnable() && catalyst.test(event.getItemStack())) {
            return; // the catalyst forms it
        }
        try {
            UI ui = UI.of(PatternPreview.create(machine.getDefinition()), StylesheetManager.ORE_MERGED);
            Minecraft.getInstance().setScreen(new ModularUIScreen(ModularUI.of(ui),
                    Component.translatable(machine.getDefinition().getDescriptionId())));
            event.setCanceled(true);
            event.setCancellationResult(InteractionResult.SUCCESS);
        } catch (RuntimeException | LinkageError e) {
            LOGGER.warn("[mbd2] could not open the structure screen of {}", machine.getDefinition().id(), e);
        }
    }
}
