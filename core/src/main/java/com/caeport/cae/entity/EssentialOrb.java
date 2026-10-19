package com.caeport.cae.entity;

import com.caeport.cae.Cae;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.AgeableMob;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.world.entity.animal.Animal;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.material.FluidState;
import net.minecraft.world.phys.AABB;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.entity.EntityStruckByLightningEvent;
import org.jetbrains.annotations.Nullable;
import software.bernie.geckolib.animatable.GeoEntity;
import software.bernie.geckolib.animatable.instance.AnimatableInstanceCache;
import software.bernie.geckolib.animation.AnimatableManager;
import software.bernie.geckolib.animation.AnimationController;
import software.bernie.geckolib.animation.RawAnimation;
import software.bernie.geckolib.util.GeckoLibUtil;

/**
 * The Essential Orb (chapter 5), as in 1.18.2. It explodes when its time runs out unless it has moved on:
 * <ol start="0">
 * <li>21 s: strike it with lightning;</li>
 * <li>16 s: set off a Thermal disruption (ender) explosive next to it;</li>
 * <li>12.5 s: stand it on a Forbidden Arcanus black hole with a source of liquid {@code cae:lst} above;</li>
 * <li>8 s: feed it AE2 singularities (it takes up to 7). With 6 or more it sets {@code kubejsdoshit} in its NBT, and
 * chapter5.js swaps it for an orb of temporary flight.</li>
 * </ol>
 * It can't be hurt. Changes from 1.18.2: its stage and timer are now loaded back from NBT.
 */
public class EssentialOrb extends Animal implements GeoEntity {
    private static final EntityDataAccessor<Integer> STAGE = SynchedEntityData.defineId(EssentialOrb.class, EntityDataSerializers.INT);
    private static final EntityDataAccessor<Integer> CASHOUT = SynchedEntityData.defineId(EssentialOrb.class, EntityDataSerializers.INT);
    private static final ResourceLocation ENDER_TNT = ResourceLocation.fromNamespaceAndPath("thermal", "ender_tnt"); // 1211: thermal
    private static final ResourceLocation BLACK_HOLE = ResourceLocation.fromNamespaceAndPath("forbidden_arcanus", "black_hole");
    private static final ResourceLocation LST = Cae.asResource("lst");
    private static final ResourceLocation SINGULARITY = ResourceLocation.fromNamespaceAndPath("ae2", "singularity");
    private static final RawAnimation[] ANIMATIONS = {
            RawAnimation.begin().thenLoop("animation.essentialorb.idle"),
            RawAnimation.begin().thenLoop("animation.essentialorb.one"),
            RawAnimation.begin().thenLoop("animation.essentialorb.two"),
            RawAnimation.begin().thenPlay("animation.essentialorb.cashout"),
    };

    private final AnimatableInstanceCache cache = GeckoLibUtil.createInstanceCache(this);
    private int lifeTime = 420;
    private int stage;
    private int cashout;
    private boolean done;

    public EssentialOrb(EntityType<? extends Animal> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Animal.createMobAttributes().add(Attributes.MAX_HEALTH, 16666.0).add(Attributes.MOVEMENT_SPEED, 0.01F);
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        super.defineSynchedData(builder);
        builder.define(STAGE, 0);
        builder.define(CASHOUT, 0);
    }

    @Override
    protected void registerGoals() {
        goalSelector.addGoal(2, new LookAtPlayerGoal(this, Player.class, 8.0F));
    }

    @Override
    public boolean hurt(DamageSource source, float amount) {
        return false;
    }

    @Override
    public void aiStep() {
        super.aiStep();
        if (level().isClientSide) {
            return;
        }
        entityData.set(STAGE, stage);
        entityData.set(CASHOUT, cashout);
        BlockPos at = blockPosition();
        if (stage == 1) {
            for (Entity e : level().getEntities(this, new AABB(at).inflate(2, 1, 2))) {
                if (ENDER_TNT.equals(BuiltInRegistries.ENTITY_TYPE.getKey(e.getType()))) {
                    nextStage(250);
                    e.kill();
                }
            }
        }
        if (stage == 2 && is(level().getBlockState(at), BLACK_HOLE) && isLstSource(level().getFluidState(at.above()))) {
            level().setBlockAndUpdate(at.above(), Blocks.AIR.defaultBlockState());
            level().setBlockAndUpdate(at, Blocks.AIR.defaultBlockState());
            level().playSound(null, getX(), getY(), getZ(), SoundEvents.ANVIL_BREAK, SoundSource.BLOCKS, 1.0F, 1.0F);
            stage = 3;
            lifeTime = 160;
        }
        if (stage == 3) {
            for (ItemEntity item : level().getEntitiesOfClass(ItemEntity.class, new AABB(at).inflate(0.5))) {
                if (cashout < 7 && SINGULARITY.equals(BuiltInRegistries.ITEM.getKey(item.getItem().getItem()))) {
                    cashout += item.getItem().getCount();
                    item.kill();
                }
            }
        }
        if (--lifeTime <= 0) {
            if (cashout >= 6 && stage == 3) {
                done = true;
            } else {
                level().explode(this, getX(), getY(), getZ(), 1.0F, Level.ExplosionInteraction.MOB);
                discard();
            }
        }
    }

    private void nextStage(int ticks) {
        stage++;
        lifeTime = ticks;
    }

    private static boolean is(BlockState state, ResourceLocation block) {
        return block.equals(BuiltInRegistries.BLOCK.getKey(state.getBlock()));
    }

    private static boolean isLstSource(FluidState fluid) {
        return fluid.isSource() && LST.equals(BuiltInRegistries.FLUID.getKey(fluid.getType()));
    }

    @Override
    public void addAdditionalSaveData(CompoundTag tag) {
        super.addAdditionalSaveData(tag);
        tag.putInt("TimeTillDETH", lifeTime);
        tag.putInt("Stage", stage);
        tag.putInt("Cashout", cashout);
        tag.putBoolean("kubejsdoshit", done);
    }

    @Override
    public void readAdditionalSaveData(CompoundTag tag) {
        super.readAdditionalSaveData(tag);
        if (tag.contains("Stage")) {
            lifeTime = tag.getInt("TimeTillDETH");
            stage = tag.getInt("Stage");
            cashout = tag.getInt("Cashout");
            done = tag.getBoolean("kubejsdoshit");
        }
    }

    @Override
    public @Nullable AgeableMob getBreedOffspring(ServerLevel level, AgeableMob other) {
        return null;
    }

    @Override
    public boolean isFood(ItemStack stack) {
        return false;
    }

    @Override
    protected SoundEvent getAmbientSound() {
        return SoundEvents.AMETHYST_BLOCK_CHIME;
    }

    @Override
    public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
        controllers.add(new AnimationController<>(this, "controller", 0,
                state -> state.setAndContinue(ANIMATIONS[Math.max(0, Math.min(entityData.get(STAGE), 3))])));
    }

    @Override
    public AnimatableInstanceCache getAnimatableInstanceCache() {
        return cache;
    }

    @EventBusSubscriber(modid = Cae.ID)
    public static final class Lightning {
        @SubscribeEvent
        public static void struck(EntityStruckByLightningEvent event) {
            if (event.getEntity() instanceof EssentialOrb orb && orb.stage == 0) {
                orb.nextStage(320);
            }
        }
    }
}
