package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.world.entity.EntitySelector;
import net.minecraft.world.entity.ExperienceOrb;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.AABB;

import java.util.List;
import java.util.Set;

/**
 * The Vacuumulator (Thermal Foundation 9.2.2.58's DeviceCollectorTile, here {@code cae:device_collector}; the pack's
 * Thermal Device Collector): every second it picks up the items lying within 4 blocks (one below, five above) into its 15 slots,
 * as far as its filter lets them; with the XP augment it takes experience orbs too. Items marked
 * {@code PreventRemoteMovement} stay where they are, unless marked {@code AllowMachineRemoteMovement}.
 */
public class CollectorBE extends DeviceBE {
    protected static final int TIME_CONSTANT = 20;
    protected static final int BASE_RADIUS = 4;

    protected final int slotFirst;
    protected int radius = BASE_RADIUS;
    protected AABB area;
    protected int process = 1;

    public CollectorBE(BlockPos pos, BlockState state) {
        super(CaeDevices.COLLECTOR_BE.get(), pos, state);
        slotFirst = inv.getSlots();
        for (int i = 0; i < 15; i++) {
            inv.add(DeviceInventory.Group.ACCESSIBLE, s -> filter.valid(s));
        }
        xpCapable = true;
        addAugmentSlots();
    }

    @Override
    protected Set<String> allowedAugments() {
        return Set.of("Upgrade", "Area", "Filter");
    }

    @Override
    public String guiTexture() {
        return "collector";
    }

    @Override
    public GuiLayout layout() {
        GuiLayout l = new GuiLayout();
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 5; j++) {
                l.outSlot(slotFirst + i * 5 + j, 44 + j * 18, 17 + i * 18);
            }
        }
        return l;
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
    protected void updateActiveState(boolean prev) {
        if (!prev && isActive) {
            process = 1;
        }
        super.updateActiveState(prev);
    }

    @Override
    public void tickServer() {
        updateActiveState();
        if (isActive) {
            process--;
            if (process <= 0) {
                process = TIME_CONSTANT;
                collect();
            }
        }
    }

    private static boolean movable(ItemEntity item) {
        if (item.isAlive() && !item.hasPickUpDelay()) {
            CompoundTag data = item.getPersistentData();
            return !data.getBoolean("PreventRemoteMovement") || data.getBoolean("AllowMachineRemoteMovement");
        }
        return false;
    }

    protected void collect() {
        List<ItemEntity> items = level.getEntitiesOfClass(ItemEntity.class, area(), CollectorBE::movable);
        for (ItemEntity item : items) {
            ItemStack stack = item.getItem();
            if (filter.valid(stack)) {
                ItemStack rest = inv.putInto(stack, DeviceInventory.Group.ACCESSIBLE, false);
                if (rest.isEmpty()) {
                    item.discard();
                } else {
                    item.setItem(rest);
                }
            }
        }
        if (xpFeature) {
            for (ExperienceOrb orb : level.getEntitiesOfClass(ExperienceOrb.class, area(), EntitySelector.ENTITY_STILL_ALIVE)) {
                // 1211: merged orbs carry a count; the whole stack is worth value * count
                int total = orb.value * Math.max(1, orb.count);
                int taken = receiveXp(total);
                int left = total - taken;
                if (left <= 0) {
                    orb.discard();
                } else if (taken > 0) {
                    // audit 4 G-4: an orb's value is saved as a short, so the rest stays as whole orbs of the orb's own value
                    // (it was one orb worth `left`, which wrapped above 32767); a remainder smaller than one orb goes in a new orb
                    int value = Math.max(1, orb.value);
                    int whole = left / value;
                    int rest = left % value;
                    if (whole > 0) {
                        orb.count = whole;
                        if (rest > 0) {
                            level.addFreshEntity(new ExperienceOrb(level, orb.getX(), orb.getY(), orb.getZ(), rest));
                        }
                    } else {
                        orb.count = 1;
                        orb.value = rest;
                    }
                }
            }
        }
    }

    @Override
    public int getScaledProgress(int scale) {
        return 0;
    }

    public int radius() {
        return radius;
    }
}
