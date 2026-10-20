package com.caeport.cae.device;

import com.simibubi.create.content.fluids.potion.PotionFluidHandler;
import net.minecraft.core.BlockPos;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.component.DataComponents;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.EntitySelector;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.alchemy.PotionContents;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.AABB;
import net.neoforged.neoforge.common.Tags;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * The Decoctive Diffuser (Thermal Foundation 9.2.2.58's DevicePotionDiffuserTile): fed a potion fluid it gives its effects to
 * every living thing within 4 blocks (and one below, five above), 25 mB each 60 ticks. Glowstone dust in its slot raises the
 * effect level for 16 diffusions, redstone dust lengthens the effect. The area, effect level and duration augments tune it;
 * its little windows show the potion's colour.
 */
public class DiffuserBE extends DeviceBE {
    protected static final int TIME_CONSTANT = 60;
    protected static final int FLUID_AMOUNT = 25;
    protected static final int BASE_RADIUS = 4;
    /** PotionDiffuserManager's default boost length */
    protected static final int BOOST_CYCLES = 16;

    /** the potion fluids of this pack carry their potion as a data component (Create's create:potion) */
    public static boolean isPotion(FluidStack fs) {
        return !fs.isEmpty() && fs.has(DataComponents.POTION_CONTENTS);
    }

    public static boolean validBoost(ItemStack stack) {
        return stack.is(Tags.Items.DUSTS_GLOWSTONE) || stack.is(Tags.Items.DUSTS_REDSTONE) || stack.is(Items.GLOWSTONE_DUST) || stack.is(Items.REDSTONE);
    }

    /** glowstone: amplifier + 1, duration - 25 %; redstone: duration + 100 % */
    private static int boostAmplifier(ItemStack s) {
        return s.is(Tags.Items.DUSTS_GLOWSTONE) || s.is(Items.GLOWSTONE_DUST) ? 1 : 0;
    }

    private static float boostDuration(ItemStack s) {
        return s.is(Tags.Items.DUSTS_GLOWSTONE) || s.is(Items.GLOWSTONE_DUST) ? -0.25F : 1.0F;
    }

    protected final int slotBoost;
    protected final DeviceTank tank;
    protected int radius = BASE_RADIUS;
    protected AABB area;
    protected List<MobEffectInstance> effects = new ArrayList<>();
    protected boolean effectsCached;
    protected int process = 1;
    protected int boostCycles;
    protected int boostMax = BOOST_CYCLES;
    protected int boostAmplifier;
    protected float boostDuration;
    private boolean lastInstant;

    public DiffuserBE(BlockPos pos, BlockState state) {
        super(CaeDevices.DIFFUSER_BE.get(), pos, state);
        slotBoost = inv.getSlots();
        inv.add(DeviceInventory.Group.ACCESSIBLE, s -> filter.valid(s) && validBoost(s));
        tank = addTank(8000, DeviceTank.Group.ACCESSIBLE, DiffuserBE::isPotion);
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "Fluid", "Area", "Filter", "Potion");
    }

    @Override
    public String guiTexture() {
        return "potion_diffuser";
    }

    @Override
    public GuiLayout layout() {
        return new GuiLayout().slot(slotBoost, 44, 35).tank(0, 116, 22).duration("scale_alchemy", 80, 35);
    }

    @Override
    protected void finalizeAttributes() {
        super.finalizeAttributes();
        radius = BASE_RADIUS + radiusBonus;
        area = null;
    }

    public AABB area() {
        if (area == null) {
            area = new AABB(worldPosition.getX() - radius, worldPosition.getY() - 1, worldPosition.getZ() - radius,
                    worldPosition.getX() + 1 + radius, worldPosition.getY() + 1 + radius, worldPosition.getZ() + 1 + radius);
        }
        return area;
    }

    @Override
    protected boolean isValid() {
        if (tank.getFluidAmount() < FLUID_AMOUNT) {
            effectsCached = false;
            return false;
        }
        return true;
    }

    @Override
    protected void updateActiveState(boolean prev) {
        if (!prev && isActive) {
            process = 1;
        }
        super.updateActiveState(prev);
    }

    @Override
    protected void onTankChanged() {
        super.onTankChanged();
        effectsCached = false;
        // the windows show what is in the tank
        FluidStack now = tank.getFluid();
        FluidStack want = now.isEmpty() ? FluidStack.EMPTY : now.copyWithAmount(1000);
        if (level != null && !level.isClientSide && !FluidStack.matches(want, renderFluid)) {
            renderFluid = want;
            syncClient();
        }
    }

    @Override
    public void tickServer() {
        updateActiveState();
        if (isActive) {
            process--;
            if (process <= 0) {
                process = TIME_CONSTANT;
                cacheEffects();
                diffuse();
            }
        }
    }

    protected void cacheEffects() {
        if (tank.isEmpty()) {
            effects = new ArrayList<>();
            lastInstant = false;
            effectsCached = false;
        } else if (!effectsCached) {
            effects = new ArrayList<>();
            lastInstant = false;
            PotionContents contents = tank.getFluid().get(DataComponents.POTION_CONTENTS);
            if (contents != null) {
                for (MobEffectInstance e : contents.getAllEffects()) {
                    effects.add(e);
                    lastInstant |= e.getEffect().value().isInstantenous();
                }
            }
            effectsCached = true;
        }
    }

    protected void diffuse() {
        if (tank.getFluidAmount() < FLUID_AMOUNT || effects.isEmpty() || level == null) {
            return;
        }
        List<LivingEntity> targets = level.getEntitiesOfClass(LivingEntity.class, area(), EntitySelector.LIVING_ENTITY_STILL_ALIVE);
        if (targets.isEmpty()) {
            return;
        }
        if (boostCycles > 0) {
            boostCycles--;
        } else if (!inv.isEmpty(slotBoost) && validBoost(inv.getStackInSlot(slotBoost))) {
            ItemStack boost = inv.getStackInSlot(slotBoost);
            boostCycles = BOOST_CYCLES;
            boostMax = boostCycles;
            boostAmplifier = boostAmplifier(boost);
            boostDuration = boostDuration(boost);
            inv.consume(slotBoost, 1);
        } else {
            boostCycles = 0;
            boostAmplifier = 0;
            boostDuration = 0.0F;
        }
        for (LivingEntity target : targets) {
            if (!target.isAlive()) {
                continue;
            }
            for (MobEffectInstance effect : effects) {
                if (effect.getEffect().value().isInstantenous()) {
                    effect.getEffect().value().applyInstantenousEffect(null, null, target, effectAmplifier(effect), 0.5);
                } else {
                    target.addEffect(new MobEffectInstance(effect.getEffect(), effectDuration(effect), effectAmplifier(effect), effect.isAmbient(), effect.isVisible()));
                }
            }
        }
        tank.modify(tank.getFluid(), -FLUID_AMOUNT);
    }

    protected int effectAmplifier(MobEffectInstance e) {
        int base = e.getAmplifier();
        return base > 3 ? base : Math.min(3, Math.round(base + (float) potionAmp + boostAmplifier));
    }

    protected int effectDuration(MobEffectInstance e) {
        return Math.min(72000, Math.round(e.getDuration() * (1.0F + potionDur + boostDuration))) / 4;
    }

    @Override
    public int getScaledDuration(int scale) {
        return isActive && boostCycles > 0 && boostMax > 0 ? scale * boostCycles / boostMax : 0;
    }

    /** A potion bottle in the hand pours into the tank (250 mB, Create's own conversion) and gives the glass bottle back. */
    @Override
    public boolean onItemUse(ServerPlayer player, InteractionHand hand, ItemStack held) {
        if (!held.isEmpty() && PotionFluidHandler.isPotionItem(held)) {
            FluidStack fs = PotionFluidHandler.getFluidFromPotionItem(held);
            if (!fs.isEmpty() && tank.fill(fs, IFluidHandler.FluidAction.SIMULATE) >= fs.getAmount()) {
                tank.fill(fs, IFluidHandler.FluidAction.EXECUTE);
                if (!player.getAbilities().instabuild) {
                    held.shrink(1);
                    player.getInventory().placeItemBackInInventory(new ItemStack(Items.GLASS_BOTTLE));
                }
                return true;
            }
        }
        return super.onItemUse(player, hand, held);
    }

    @Override
    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putInt("BoostCycles", boostCycles);
        tag.putInt("BoostMax", boostMax);
        tag.putInt("BoostAmp", boostAmplifier);
        tag.putFloat("BoostDur", boostDuration);
        tag.putInt("Proc", process);
    }

    @Override
    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
        boostCycles = tag.getInt("BoostCycles");
        boostMax = Math.max(1, tag.getInt("BoostMax"));
        boostAmplifier = tag.getInt("BoostAmp");
        boostDuration = tag.getFloat("BoostDur");
        process = tag.getInt("Proc");
        effectsCached = false;
    }

    @Override
    protected void loadLegacyAttachments(HolderLookup.Provider registries, CompoundTag attachments) {
        inv.loadLegacy(registries, attachments.get("boost"), slotBoost, 1);
        legacyTank(registries, attachments, "tank", tank);
        FluidStack fs = tank.getFluid();
        renderFluid = fs.isEmpty() ? FluidStack.EMPTY : fs.copyWithAmount(1000);
    }

    @Override
    protected void loadLegacyData(CompoundTag data) {
        process = data.contains("process") ? data.getInt("process") : 1;
        boostCycles = data.getInt("boostCycles");
        boostAmplifier = data.getInt("boostAmp");
        boostDuration = data.getFloat("boostDur");
    }

    @Override
    public void writeGui(RegistryFriendlyByteBuf buf) {
        super.writeGui(buf);
        buf.writeInt(boostCycles);
        buf.writeInt(boostMax);
    }

    @Override
    public void readGui(RegistryFriendlyByteBuf buf) {
        super.readGui(buf);
        boostCycles = buf.readInt();
        boostMax = Math.max(1, buf.readInt());
    }

    public boolean instant() {
        return lastInstant;
    }

    // for scripts and tests
    public void setProcess(int p) {
        process = p;
    }

    public int process() {
        return process;
    }

    public int radius() {
        return radius;
    }
}
