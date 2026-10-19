package com.caeport.cae;

import net.minecraft.nbt.CompoundTag;
import net.minecraft.world.entity.Entity;
import net.neoforged.neoforge.attachment.AttachmentType;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;
import net.neoforged.neoforge.registries.NeoForgeRegistries;

import java.util.function.Supplier;

/**
 * A string and a number on every entity, kept as the NeoForge data attachment {@code cae:properties} (a compound with
 * the 1.18.2 key names {@code kubejsdoshit} and {@code robert}). The time crystal tags Ars Nouveau spell projectiles and
 * area effect clouds with it, and orbitMagic.js reads it back.
 *
 * <p>From KubeJS, use the static helpers (see audit/1211/notes-core.md):
 * <pre>
 * const CaeProperties = Java.loadClass('com.caeport.cae.CaeProperties')
 * CaeProperties.getValue(entity)        // string, "" by default
 * CaeProperties.setValue(entity, 'x')
 * CaeProperties.getCount(entity)        // int, 5 by default
 * CaeProperties.get(entity)             // the live CompoundTag
 * </pre>
 * The attachment is also saved in the entity's NBT, under {@code "neoforge:attachments"."cae:properties"}.
 */
public final class CaeProperties {
    public static final DeferredRegister<AttachmentType<?>> ATTACHMENTS =
            DeferredRegister.create(NeoForgeRegistries.ATTACHMENT_TYPES, Cae.ID);

    public static final String VALUE = "kubejsdoshit";
    public static final String COUNT = "robert";

    public static final DeferredHolder<AttachmentType<?>, AttachmentType<CompoundTag>> TYPE = ATTACHMENTS.register(
            "properties", () -> AttachmentType.builder((Supplier<CompoundTag>) CaeProperties::defaults)
                    .serialize(CompoundTag.CODEC).build());

    private CaeProperties() {
    }

    private static CompoundTag defaults() {
        CompoundTag tag = new CompoundTag();
        tag.putString(VALUE, "");
        tag.putInt(COUNT, 5);
        return tag;
    }

    /** The entity's live properties compound (created with defaults on first access); changes to it are saved. */
    public static CompoundTag get(Entity entity) {
        CompoundTag tag = entity.getData(TYPE);
        if (!tag.contains(VALUE)) {
            tag.putString(VALUE, "");
        }
        if (!tag.contains(COUNT)) {
            tag.putInt(COUNT, 5);
        }
        return tag;
    }

    public static String getValue(Entity entity) {
        return get(entity).getString(VALUE);
    }

    public static void setValue(Entity entity, String value) {
        get(entity).putString(VALUE, value);
    }

    public static int getCount(Entity entity) {
        return get(entity).getInt(COUNT);
    }

    public static void setCount(Entity entity, int count) {
        get(entity).putInt(COUNT, count);
    }
}
