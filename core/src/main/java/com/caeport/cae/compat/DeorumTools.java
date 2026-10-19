package com.caeport.cae.compat;

import net.minecraft.core.component.DataComponents;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.DiggerItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.SwordItem;
import net.minecraft.world.item.TieredItem;
import net.minecraft.world.item.component.ItemAttributeModifiers;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.event.ModifyDefaultComponentsEvent;

import java.util.Map;
import java.util.function.Function;

/**
 * Forbidden &amp; Arcanus 2.6.1 still registers the reinforced deorum tools as real tools of its REINFORCED_DEORUM tier
 * (durability, mining speed, enchanting, deorum repair) but has dropped them: they have no model or name, and no attack
 * damage or speed, because the items are built without their attribute modifiers. The pack hands them out as loot (the
 * Artificer's bags, loot:magic/arcane_gold_tools), so they get back the 1.20.1 mod's attack values here; the models,
 * names and tool tags are in the pack's KubeJS assets and data.
 */
public final class DeorumTools {
    /** Attack values of FA 2.2.6 (1.20.1): sword 3 / -2.4, pickaxe 1 / -2.8, axe 5 / -3, shovel 1.5 / -3, hoe -3 / 0. */
    private static final Map<String, Function<TieredItem, ItemAttributeModifiers>> ATTRIBUTES = Map.of(
            "reinforced_deorum_sword", item -> SwordItem.createAttributes(item.getTier(), 3, -2.4F),
            "reinforced_deorum_pickaxe", item -> DiggerItem.createAttributes(item.getTier(), 1.0F, -2.8F),
            "reinforced_deorum_axe", item -> DiggerItem.createAttributes(item.getTier(), 5.0F, -3.0F),
            "reinforced_deorum_shovel", item -> DiggerItem.createAttributes(item.getTier(), 1.5F, -3.0F),
            "reinforced_deorum_hoe", item -> DiggerItem.createAttributes(item.getTier(), -3.0F, 0.0F));

    private DeorumTools() {
    }

    public static void register(IEventBus modBus) {
        modBus.addListener(DeorumTools::modifyComponents);
    }

    private static void modifyComponents(ModifyDefaultComponentsEvent event) {
        ATTRIBUTES.forEach((path, attributes) -> {
            Item item = BuiltInRegistries.ITEM.get(ResourceLocation.fromNamespaceAndPath("forbidden_arcanus", path));
            if (item instanceof TieredItem tiered) {
                event.modify(item, patch -> patch.set(DataComponents.ATTRIBUTE_MODIFIERS, attributes.apply(tiered)));
            }
        });
    }
}
