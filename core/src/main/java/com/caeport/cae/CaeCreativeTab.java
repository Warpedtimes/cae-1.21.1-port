package com.caeport.cae;

import com.caeport.cae.tiab.Tiab;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import java.util.Set;
import java.util.stream.Collectors;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

/** One tab with every {@code cae:} (and {@code tiab:}) item, including the ones the pack's KubeJS scripts register under our namespace. */
public final class CaeCreativeTab {
    public static final DeferredRegister<CreativeModeTab> TABS = DeferredRegister.create(Registries.CREATIVE_MODE_TAB, Cae.ID);

    public static final DeferredHolder<CreativeModeTab, CreativeModeTab> MAIN = TABS.register("main", () -> CreativeModeTab.builder()
            .title(Component.literal("Create: Arcane Engineering"))
            .icon(() -> new ItemStack(CaeBlocks.SOURCE_TIME_CRYSTAL.get()))
            .displayItems((params, output) -> {
                // Registrate adds its own items (the casings and encased kinetics) to this tab, and 1.21 throws on a
                // stack added twice, so leave those out here.
                Set<Item> registrate = Cae.REGISTRATE.<Item, Item>getAll(Registries.ITEM).stream()
                        .map(e -> (Item) e.get()).collect(Collectors.toSet());
                BuiltInRegistries.ITEM.entrySet().stream()
                        .filter(e -> e.getKey().location().getNamespace().equals(Cae.ID)
                                || e.getKey().location().getNamespace().equals(Tiab.NAMESPACE)
                                || e.getKey().location().getNamespace().equals(com.caeport.cae.feather.MagicFeather.NAMESPACE)
                                || e.getKey().location().getNamespace().equals(com.caeport.cae.heater.HeaterRegistry.NAMESPACE))
                        .filter(e -> !registrate.contains(e.getValue()))
                        .sorted((a, b) -> a.getKey().location().compareTo(b.getKey().location()))
                        .forEach(e -> output.accept(e.getValue()));
            })
            .build());

    private CaeCreativeTab() {
    }
}
