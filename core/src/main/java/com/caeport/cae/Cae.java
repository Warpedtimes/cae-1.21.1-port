package com.caeport.cae;

import com.caeport.cae.compat.DeorumTools;
import com.caeport.cae.device.CaeDevices;
import com.caeport.cae.entity.CaeEntities;
import com.caeport.cae.feather.MagicFeather;
import com.caeport.cae.heater.HeaterRegistry;
import com.caeport.cae.kinetics.CaeKinetics;
import com.caeport.cae.tiab.Tiab;
import com.simibubi.create.foundation.data.CreateRegistrate;
import net.minecraft.resources.ResourceLocation;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;

/**
 * Core mod of Create: Arcane Engineering, rewritten for 1.21.1 NeoForge. Keeps the 1.18.2 mod's IDs ({@code cae:...})
 * so the pack's scripts and quests still find everything.
 */
@Mod(Cae.ID)
public class Cae {
    public static final String ID = "cae";
    public static final CreateRegistrate REGISTRATE = CreateRegistrate.create(ID);

    public Cae(IEventBus modBus, ModContainer container) {
        REGISTRATE.registerEventListeners(modBus);
        // Registrate's items go in our tab; CaeCreativeTab lists everything else, so nothing is added twice.
        REGISTRATE.defaultCreativeTab(CaeCreativeTab.MAIN.getKey());
        CaeKinetics.register();
        CaeBlocks.BLOCKS.register(modBus);
        CaeBlocks.ITEMS.register(modBus);
        CaeBlocks.BLOCK_ENTITIES.register(modBus);
        CaeEntities.ENTITIES.register(modBus);
        CaeSounds.SOUNDS.register(modBus);
        CaeDevices.register(modBus);
        CaeCreativeTab.TABS.register(modBus);
        CaeProperties.ATTACHMENTS.register(modBus);
        Tiab.register(modBus);
        DeorumTools.register(modBus);
        MagicFeather.register(modBus, container);
        HeaterRegistry.register(modBus, container);
        com.caeport.cae.world.OreRetrogen.init();
    }

    public static ResourceLocation asResource(String path) {
        return ResourceLocation.fromNamespaceAndPath(ID, path);
    }
}
