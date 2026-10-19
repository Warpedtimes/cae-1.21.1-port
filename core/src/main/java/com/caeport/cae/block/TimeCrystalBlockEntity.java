package com.caeport.cae.block;

import com.caeport.cae.CaeBlocks;
import com.caeport.cae.CaeProperties;
import com.hollingsworth.arsnouveau.api.spell.AbstractSpellPart;
import com.hollingsworth.arsnouveau.api.spell.Spell;
import com.hollingsworth.arsnouveau.client.particle.ParticleColor;
import com.hollingsworth.arsnouveau.common.entity.EntityProjectileSpell;
import net.minecraft.core.BlockPos;
import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.ListTag;
import net.minecraft.nbt.StringTag;
import net.minecraft.nbt.Tag;
import net.minecraft.network.protocol.Packet;
import net.minecraft.network.protocol.game.ClientGamePacketListener;
import net.minecraft.network.protocol.game.ClientboundBlockEntityDataPacket;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.AreaEffectCloud;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.AABB;
import software.bernie.geckolib.animatable.GeoBlockEntity;
import software.bernie.geckolib.animatable.instance.AnimatableInstanceCache;
import software.bernie.geckolib.animation.AnimatableManager;
import software.bernie.geckolib.animation.AnimationController;
import software.bernie.geckolib.animation.RawAnimation;
import software.bernie.geckolib.util.GeckoLibUtil;

/**
 * The Source Time Crystal puzzle, as in 1.18.2. It wants five Ars Nouveau projectile spells, each a projectile plus
 * one effect: one of hex/light, one of gravity/ignite, one of cold snap/intangible, one of freeze/crush and one of
 * grow/firework (which of each pair is random). A right one is tagged "doit" and stripped of its effects, and
 * orbitMagic.js sets it circling; a wrong one, or one with more glyphs, locks the crystal for 10 seconds. The colour
 * it paints passing spells cycles faster with each one solved. Ten seconds after the fifth it leaves an
 * area effect cloud tagged "IM ALIVE", which orbitMagic.js turns into the reward, and vanishes.
 *
 * <p>Changes from 1.18.2: the spell pairs and progress are saved (they were rerolled on every chunk load), the
 * animation stage is synced from the server instead of counted from clouds on the client, and glyph names are matched
 * exactly (so lightning no longer passes for light).
 */
public class TimeCrystalBlockEntity extends BlockEntity implements GeoBlockEntity {
    private static final String[] SPELLS = {"hex", "light", "gravity", "ignite", "cold_snap", "intangible", "freeze",
            "crush", "grow", "firework"};
    private static final int[] SPEEDS = {255, 85, 51, 17, 5, 3};
    private static final int WRONG_SPELL_LOCK = 200, RIGHT_SPELL_LOCK = 50, FINALE = 200;
    private static final RawAnimation[] ANIMATIONS = {
            RawAnimation.begin().thenLoop("animation.model.idle"),
            stage(1), stage(2), stage(3), stage(4),
            RawAnimation.begin().thenPlay("animation.model.v5"),
    };

    private final AnimatableInstanceCache cache = GeckoLibUtil.createInstanceCache(this);
    private final String[] remaining = new String[5];
    private int solved;
    private int cooldown;
    private int finale = FINALE;
    private boolean tagged;
    private final int[] rgb = {255, 0, 255};
    private int phase;

    public TimeCrystalBlockEntity(BlockPos pos, BlockState state) {
        super(CaeBlocks.TIME_CRYSTAL_BE.get(), pos, state);
        RandomSource random = RandomSource.create();
        for (int i = 0; i < remaining.length; i++) {
            remaining[i] = SPELLS[2 * i + random.nextInt(2)];
        }
    }

    private static RawAnimation stage(int n) {
        return RawAnimation.begin().thenPlay("animation.model.v" + n).thenLoop("animation.model.v" + n + "h");
    }

    void serverTick(Level level, BlockPos pos) {
        cycleColour();
        if (solved >= remaining.length) {
            finale--;
        }
        if (finale <= 0) {
            for (EntityProjectileSpell spell : level.getEntitiesOfClass(EntityProjectileSpell.class, new AABB(pos).inflate(1))) {
                if (!tagged) {
                    CaeProperties.setValue(spell, "dontdoit");
                    tagged = true;
                } else {
                    spell.discard();
                }
            }
            AreaEffectCloud reward = new AreaEffectCloud(level, pos.getX(), pos.getY(), pos.getZ());
            CaeProperties.setValue(reward, "IM ALIVE");
            level.addFreshEntity(reward);
            level.setBlockAndUpdate(pos, Blocks.AIR.defaultBlockState());
            return;
        }
        for (Entity entity : level.getEntities((Entity) null, new AABB(pos).inflate(3))) {
            if (entity instanceof AreaEffectCloud) {
                // orbitMagic.js drops a cloud here as each spell starts orbiting; it lasts five ticks.
                if (CaeProperties.getCount(entity) <= 0) {
                    entity.discard();
                } else {
                    CaeProperties.setCount(entity, CaeProperties.getCount(entity) - 1);
                }
            } else if (entity instanceof EntityProjectileSpell spell) {
                onSpell(spell);
            }
        }
        if (cooldown > 0) {
            cooldown--;
        }
    }

    private void onSpell(EntityProjectileSpell spell) {
        if (spell.resolver() == null) {
            return;
        }
        boolean done = CaeProperties.getValue(spell).contains("doit");
        if (done) {
            spell.resolver().spellContext.withSpell(new Spell());
        }
        spell.setColor(new ParticleColor(rgb[0], rgb[1], rgb[2]));
        if (done || cooldown > 0) {
            return;
        }
        Spell cast = spell.resolver().spellContext.getSpell();
        int match = -1;
        for (int i = 0; i < remaining.length && match < 0; i++) {
            if (remaining[i] != null && has(cast, remaining[i])) {
                match = i;
            }
        }
        if (match < 0 || cast.unsafeList().size() > 2) {
            cooldown += WRONG_SPELL_LOCK;
            return;
        }
        remaining[match] = null;
        solved++;
        cooldown = RIGHT_SPELL_LOCK;
        CaeProperties.setValue(spell, "doit");
        setChanged();
        if (level != null) {
            level.sendBlockUpdated(worldPosition, getBlockState(), getBlockState(), 3);
        }
    }

    private static boolean has(Spell spell, String effect) {
        for (AbstractSpellPart part : spell.unsafeList()) {
            if (part != null && part.getRegistryName().getPath().equals("glyph_" + effect)) {
                return true;
            }
        }
        return false;
    }

    private void cycleColour() {
        int step = 255 / SPEEDS[Math.min(solved, SPEEDS.length - 1)];
        // Around the hue wheel: magenta, red, yellow, green, cyan, blue, back to magenta.
        int channel = new int[]{2, 1, 0, 2, 1, 0}[phase];
        boolean up = phase % 2 == 1;
        rgb[channel] = Math.max(0, Math.min(255, rgb[channel] + (up ? step : -step)));
        if (rgb[channel] == (up ? 255 : 0)) {
            phase = (phase + 1) % 6;
        }
    }

    @Override
    protected void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.saveAdditional(tag, registries);
        ListTag list = new ListTag();
        for (String s : remaining) {
            list.add(StringTag.valueOf(s == null ? "null" : s));
        }
        tag.put("RemainingSpells", list);
        tag.putInt("CoolDown", cooldown);
        tag.putInt("Solved", solved);
    }

    @Override
    protected void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.loadAdditional(tag, registries);
        if (tag.contains("RemainingSpells", Tag.TAG_LIST)) {
            ListTag list = tag.getList("RemainingSpells", Tag.TAG_STRING);
            for (int i = 0; i < remaining.length && i < list.size(); i++) {
                String s = list.getString(i);
                remaining[i] = s.equals("null") ? null : s;
            }
            cooldown = tag.getInt("CoolDown");
        }
        solved = tag.getInt("Solved");
    }

    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        CompoundTag tag = super.getUpdateTag(registries);
        tag.putInt("Solved", solved);
        return tag;
    }

    @Override
    public Packet<ClientGamePacketListener> getUpdatePacket() {
        return ClientboundBlockEntityDataPacket.create(this);
    }

    @Override
    public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
        controllers.add(new AnimationController<>(this, "controller", 0,
                state -> state.setAndContinue(ANIMATIONS[Math.min(solved, ANIMATIONS.length - 1)])));
    }

    @Override
    public AnimatableInstanceCache getAnimatableInstanceCache() {
        return cache;
    }
}
