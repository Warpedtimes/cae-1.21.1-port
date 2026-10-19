package com.caeport.cae.entity;

import com.caeport.cae.Cae;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.entity.EntityAttributeCreationEvent;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

@EventBusSubscriber(modid = Cae.ID)
public final class CaeEntities {
    public static final DeferredRegister<EntityType<?>> ENTITIES = DeferredRegister.create(BuiltInRegistries.ENTITY_TYPE, Cae.ID);

    public static final DeferredHolder<EntityType<?>, EntityType<EssentialOrb>> ESSENTIAL_ORB = ENTITIES.register("essentialorb",
            () -> EntityType.Builder.of(EssentialOrb::new, MobCategory.CREATURE)
                    .sized(0.25F, 1.0F)
                    .fireImmune()
                    .build(Cae.asResource("essentialorb").toString()));

    private CaeEntities() {
    }

    @SubscribeEvent
    public static void attributes(EntityAttributeCreationEvent event) {
        event.put(ESSENTIAL_ORB.get(), EssentialOrb.attributes().build());
    }
}
