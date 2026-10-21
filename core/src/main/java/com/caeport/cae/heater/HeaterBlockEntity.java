package com.caeport.cae.heater;

import com.simibubi.create.api.equipment.goggles.IHaveGoggleInformation;
import com.simibubi.create.content.fluids.tank.FluidTankBlockEntity;
import com.simibubi.create.content.processing.burner.BlazeBurnerBlock;
import com.simibubi.create.content.processing.burner.BlazeBurnerBlock.HeatLevel;
import java.util.List;
import me.desht.pneumaticcraft.api.PneumaticRegistry;
import me.desht.pneumaticcraft.api.heat.IHeatExchangerLogic;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.network.protocol.Packet;
import net.minecraft.network.protocol.game.ClientGamePacketListener;
import net.minecraft.network.protocol.game.ClientboundBlockEntityDataPacket;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;

/**
 * The heater's PneumaticCraft heat exchanger and its Blaze Burner heat level (Compressed Creativity 0.1.8, 1.18.2).
 * Temperature in degrees Celsius is the exchanger's kelvin minus 273, as in the original: below
 * {@code temperature_passive} no heat, then smouldering (a campfire's passive heat), kindled from
 * {@code temperature_kindled}, seething from {@code temperature_seething}. Every tick it burns off
 * {@code temperature_coefficient} heat per degree over {@code starting_temperature}.
 */
public class HeaterBlockEntity extends BlockEntity implements IHaveGoggleInformation {
    private final IHeatExchangerLogic heatExchanger;
    private HeatLevel heatLevel = HeatLevel.NONE;
    private boolean initialized;
    private int syncedTemperature = Integer.MIN_VALUE;
    private int ticks;

    public HeaterBlockEntity(BlockPos pos, BlockState state) {
        super(HeaterRegistry.HEATER_BE.get(), pos, state);
        heatExchanger = PneumaticRegistry.getInstance().getHeatRegistry().makeHeatExchangerLogic();
        heatExchanger.setThermalCapacity(HeaterConfig.THERMAL_CAPACITY.get());
        heatExchanger.setThermalResistance(HeaterConfig.THERMAL_RESISTANCE.get());
    }

    public IHeatExchangerLogic getHeatExchanger(Direction side) {
        return side == Direction.UP ? null : heatExchanger;
    }

    public void updateHeatExchanger() {
        if (level != null && !level.isClientSide) {
            heatExchanger.initializeAsHull(level, worldPosition, IHeatExchangerLogic.ALL_BLOCKS,
                    Direction.NORTH, Direction.SOUTH, Direction.WEST, Direction.EAST, Direction.DOWN);
        }
    }

    public double getCoolingSpeed() {
        double heat = HeaterConfig.TEMPERATURE_COEFFICIENT.get()
                * (heatExchanger.getTemperature() - HeaterConfig.STARTING_TEMPERATURE.get() - 273.0);
        return Math.max(heat, 0.0);
    }

    public void tick() {
        if (level == null || level.isClientSide) {
            return;
        }
        if (!initialized) {
            initialized = true;
            updateHeatExchanger();
        }
        heatExchanger.tick();
        heatExchanger.addHeat(-getCoolingSpeed());
        ticks++;

        HeatLevel old = heatLevel;
        heatLevel = computeHeatLevel();
        BlockState state = getBlockState();
        if (BlazeBurnerBlock.getHeatLevelOf(state) != heatLevel) {
            level.setBlock(worldPosition, state.setValue(BlazeBurnerBlock.HEAT_LEVEL, heatLevel), 3);
        }
        // Create only re-reads a boiler's heaters when told to; a change of the block state does not always do it.
        if (heatLevel != old || ticks % 20 == 0) {
            if (level.getBlockEntity(worldPosition.above()) instanceof FluidTankBlockEntity tank) {
                FluidTankBlockEntity controller = tank.getControllerBE();
                if (controller != null) {
                    controller.boiler.needsHeatLevelUpdate = true;
                }
            }
        }
        // The look follows the temperature: tell the clients when it moved a few degrees.
        int temp = heatExchanger.getTemperatureAsInt();
        if (ticks % 5 == 0 && Math.abs(temp - syncedTemperature) > 2) {
            syncedTemperature = temp;
            setChanged();
            level.sendBlockUpdated(worldPosition, getBlockState(), getBlockState(), 2);
        }
    }

    private HeatLevel computeHeatLevel() {
        int temp = heatExchanger.getTemperatureAsInt() - 273;
        if (temp < HeaterConfig.TEMPERATURE_PASSIVE.get()) {
            return HeatLevel.NONE;
        }
        if (temp < HeaterConfig.TEMPERATURE_KINDLED.get()) {
            return HeatLevel.SMOULDERING;
        }
        return temp < HeaterConfig.TEMPERATURE_SEETHING.get() ? HeatLevel.KINDLED : HeatLevel.SEETHING;
    }

    /** The temperature the block colours itself by (client), in kelvin as an int. */
    public int getTemperature() {
        return heatExchanger.getTemperatureAsInt();
    }

    @Override
    protected void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.saveAdditional(tag, registries);
        tag.put("HeatExchanger", heatExchanger.serializeNBT());
    }

    @Override
    protected void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.loadAdditional(tag, registries);
        if (tag.contains("HeatExchanger")) {
            heatExchanger.deserializeNBT(tag.getCompound("HeatExchanger"));
        }
        if (level != null && level.isClientSide) {
            level.sendBlockUpdated(worldPosition, getBlockState(), getBlockState(), 0); // re-colour
        }
    }

    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        return saveWithoutMetadata(registries);
    }

    @Override
    public Packet<ClientGamePacketListener> getUpdatePacket() {
        return ClientboundBlockEntityDataPacket.create(this);
    }

    @Override
    public boolean addToGoggleTooltip(List<Component> tooltip, boolean isPlayerSneaking) {
        tooltip.add(Component.literal("    ").append(Component.translatable("compressedcreativity.tooltip.heat_summary")));
        tooltip.add(Component.literal("    ").append(Component.translatable("compressedcreativity.tooltip.temperature").withStyle(ChatFormatting.GRAY)));
        tooltip.add(Component.literal("     ").append(Component.literal(String.format("%.1f", heatExchanger.getTemperature() - 273.0))
                .append(Component.translatable("compressedcreativity.unit.temp")).withStyle(ChatFormatting.AQUA)));
        if (isPlayerSneaking) { // the mod's debug lines, only while sneaking
            tooltip.add(Component.literal(String.format("    Cooling speed: %f heat/tick", getCoolingSpeed())));
            tooltip.add(Component.literal(String.format("    Heat level: %s", heatLevel)));
            tooltip.add(Component.literal(String.format("    Thermal capacity: %f", heatExchanger.getThermalCapacity())));
            tooltip.add(Component.literal(String.format("    Thermal resistance: %f", heatExchanger.getThermalResistance())));
        }
        return true;
    }
}
