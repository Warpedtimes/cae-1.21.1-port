package com.caeport.cae.compat;

import com.caeport.cae.Cae;
import java.util.Map;
import net.minecraft.core.BlockPos;
import net.minecraft.core.dispenser.BlockSource;
import net.minecraft.core.dispenser.DefaultDispenseItemBehavior;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.item.PrimedTnt;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.DispenserBlock;
import net.minecraft.world.level.gameevent.GameEvent;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.fml.event.lifecycle.FMLCommonSetupEvent;

/**
 * Dispensers fire the pack's TNT and grenades (KubeJS items standing in for Thermal's). Thermal registered dispenser
 * behaviour for its TNT, so a dispenser primed it; the finale's ice trial drops ice TNT onto its magma floor from
 * dispensers. The pack's TNT are plain items, so a dispenser only spat them out. This primes a vanilla TNT with the same
 * tag and fuse a right click gives (kubejs/server_scripts/thermalReplacements.js, CAE_BOMBS); that script's level tick
 * applies the effect by the tag. As vanilla's TNT behaviour: primed in front of the dispenser's face.
 */
@EventBusSubscriber(modid = Cae.ID, bus = EventBusSubscriber.Bus.MOD)
public final class PackTntDispensing {
    /** item -> {tag, fuse ticks}, as CAE_BOMBS */
    private static final Map<String, Object[]> BOMBS = Map.of(
            "ice_tnt", new Object[]{"cae_ice", 80}, "fire_tnt", new Object[]{"cae_fire", 80},
            "glowstone_tnt", new Object[]{"cae_glow", 80}, "ender_tnt", new Object[]{"cae_ender", 80},
            "nuke_tnt", new Object[]{"cae_nuke", 80}, "glowstone_grenade", new Object[]{"cae_glow_small", 30},
            "explosive_grenade", new Object[]{"cae_boom", 30}, "nuke_grenade", new Object[]{"cae_nuke_small", 30});

    private PackTntDispensing() {
    }

    @SubscribeEvent
    public static void onCommonSetup(FMLCommonSetupEvent event) {
        event.enqueueWork(() -> BOMBS.forEach((name, def) -> {
            Item item = BuiltInRegistries.ITEM.get(ResourceLocation.fromNamespaceAndPath("cae", name));
            if (item != Items.AIR) {
                DispenserBlock.registerBehavior(item, new Primer((String) def[0], (Integer) def[1]));
            }
        }));
    }

    private static final class Primer extends DefaultDispenseItemBehavior {
        private final String tag;
        private final int fuse;

        Primer(String tag, int fuse) {
            this.tag = tag;
            this.fuse = fuse;
        }

        @Override
        protected ItemStack execute(BlockSource source, ItemStack stack) {
            Level level = source.level();
            BlockPos pos = source.pos().relative(source.state().getValue(DispenserBlock.FACING));
            PrimedTnt tnt = new PrimedTnt(level, pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5, null);
            tnt.setFuse(fuse);
            tnt.addTag(tag);
            level.addFreshEntity(tnt);
            level.playSound(null, tnt.getX(), tnt.getY(), tnt.getZ(), SoundEvents.TNT_PRIMED, SoundSource.BLOCKS, 1.0F, 1.0F);
            level.gameEvent(null, GameEvent.ENTITY_PLACE, pos);
            stack.shrink(1);
            return stack;
        }
    }
}
