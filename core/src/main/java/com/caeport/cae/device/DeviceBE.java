package com.caeport.cae.device;

import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.component.DataComponentMap;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.ListTag;
import net.minecraft.nbt.Tag;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.network.chat.Component;
import net.minecraft.network.protocol.Packet;
import net.minecraft.network.protocol.game.ClientGamePacketListener;
import net.minecraft.network.protocol.game.ClientboundBlockEntityDataPacket;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.Containers;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.MenuProvider;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.entity.BlockEntityType;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.Vec3;
import net.neoforged.neoforge.energy.IEnergyStorage;
import net.neoforged.neoforge.fluids.FluidStack;
import net.neoforged.neoforge.fluids.FluidUtil;
import net.neoforged.neoforge.fluids.capability.IFluidHandler;
import net.neoforged.neoforge.items.IItemHandler;
import org.jetbrains.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * What every Thermal device has (cofh.thermal.lib.block.entity.DeviceBlockEntity / AugmentableBlockEntity, rebuilt):
 * item slots and tanks in groups, three augment slots, redstone control, an optional item / fluid filter (from an
 * augment), optional XP storage (from an augment), an active flag that shows in the block, a menu, and a drop that keeps
 * the augments and settings. The devices are the subclasses.
 *
 * <p>Saving: the new format is this class's own. A device placed by the KubeJS version of this pack has KubeJS 7's format
 * (a "data" compound and an "attachments" compound); {@link #loadLegacy} reads that, so nothing placed is lost.
 */
public abstract class DeviceBE extends BlockEntity implements MenuProvider {
    /** ThermalCoreConfig.deviceAugments */
    public static final int AUGMENT_SLOTS = 3;
    /** AugmentableBlockEntity.BASE_XP_STORAGE */
    public static final int BASE_XP = 2500;

    protected final DeviceInventory inv = new DeviceInventory(this::onInventoryChanged);
    protected final List<DeviceTank> tanks = new ArrayList<>();
    /** index of the first augment slot in {@link #inv}; -1 until addAugmentSlots() */
    protected int augStart = -1;
    protected final RedstoneControl rs = new RedstoneControl();
    protected DeviceFilter filter = DeviceFilter.NONE;
    /** only the devices that use power have this (the Phyto-Soil Infuser, the Tinker's Workbench) */
    protected DeviceEnergy energy;
    protected boolean xpCapable;
    protected int xpStored;
    protected int xpCapacity;
    public boolean isActive;
    protected FluidStack renderFluid = FluidStack.EMPTY;
    /** validity has been worked out since the last neighbour change (Thermal's "cached") */
    protected boolean cached;

    // augment attributes, recomputed by updateAugmentState()
    protected float baseMod = 1.0F;
    protected float fluidMax = 1.0F;
    protected float rfMax = 1.0F;
    protected float rfXfer = 1.0F;
    protected int radiusBonus;
    protected int potionAmp;
    protected float potionDur;
    protected boolean xpFeature;
    protected boolean creativeTanks;
    protected String filterType = "";

    private IItemHandler itemView;
    private IFluidHandler fluidView;

    protected DeviceBE(BlockEntityType<?> type, BlockPos pos, BlockState state) {
        super(type, pos, state);
    }

    // ---------------------------------------------------------------------------------------------------------------
    // construction helpers (call from the subclass constructor)
    // ---------------------------------------------------------------------------------------------------------------

    protected DeviceTank addTank(int capacity, DeviceTank.Group group, java.util.function.Predicate<FluidStack> valid) {
        DeviceTank t = new DeviceTank(capacity, group, fs -> valid.test(fs) && filter.valid(fs), this::onTankChanged);
        t.creative = () -> creativeTanks;
        tanks.add(t);
        return t;
    }

    protected DeviceTank addTank(int capacity, DeviceTank.Group group) {
        return addTank(capacity, group, fs -> true);
    }

    /** The augment slots go last. */
    protected void addAugmentSlots() {
        augStart = inv.getSlots();
        for (int i = 0; i < AUGMENT_SLOTS; i++) {
            inv.add(DeviceInventory.Group.INTERNAL, this::validAugment).limit = 1;
        }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // what a device defines
    // ---------------------------------------------------------------------------------------------------------------

    /** The augment types this device accepts (Thermal's AUG_VALIDATOR of the tile). */
    protected abstract Set<String> allowedAugments();

    /** Name of the Thermal GUI texture in assets/cae/textures/gui/container/. */
    public abstract String guiTexture();

    /** Slots, tanks and bars of the screen. */
    public abstract GuiLayout layout();

    /** Thermal's updateValidity(): look at the surroundings (server only). */
    protected void updateValidity() {
        cached = true;
    }

    /** Thermal's isValid(): can the device work, apart from the redstone signal? */
    protected boolean isValid() {
        return true;
    }

    public void tickServer() {
        updateActiveState();
    }

    /** Whether this device keeps its tank contents when it is picked up (Thermal's default: no). */
    protected boolean automationExtractsInputs() {
        return true;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // active state, redstone control
    // ---------------------------------------------------------------------------------------------------------------

    protected void updateActiveState() {
        if (!cached && level != null && !level.isClientSide) {
            // audit 4 S-10: the saved power can be stale after a chunk load (the signal changed while it was unloaded)
            rs.power = level.getBestNeighborSignal(worldPosition);
            updateValidity();
        }
        boolean prev = isActive;
        isActive = rs.state() && isValid();
        updateActiveState(prev);
    }

    protected void updateActiveState(boolean prev) {
        if (prev != isActive && level != null) {
            BlockState st = getBlockState();
            if (st.hasProperty(DeviceBlock.ACTIVE) && st.getValue(DeviceBlock.ACTIVE) != isActive) {
                level.setBlock(worldPosition, st.setValue(DeviceBlock.ACTIVE, isActive), 3);
            }
            syncClient();
        }
    }

    public void neighborChanged() {
        if (level != null && !level.isClientSide) {
            rs.power = level.getBestNeighborSignal(worldPosition);
            updateValidity();
            updateActiveState();
        }
    }

    public void onPlaced(@Nullable LivingEntity placer) {
        if (level != null && !level.isClientSide) {
            rs.power = level.getBestNeighborSignal(worldPosition);
            updateAugmentState();
            updateValidity();
            updateActiveState();
        }
    }

    public RedstoneControl.Mode rsMode() {
        return rs.mode;
    }

    public int rsPower() {
        return rs.power;
    }

    public boolean rsState() {
        return rs.state();
    }

    public void setRsMode(RedstoneControl.Mode mode) {
        rs.mode = mode;
        onControlUpdate();
    }

    protected void onControlUpdate() {
        if (level != null && !level.isClientSide) {
            updateActiveState();
            setChanged();
            syncClient();
        }
    }

    @Override
    public void onLoad() {
        super.onLoad();
        cached = false;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // augments
    // ---------------------------------------------------------------------------------------------------------------

    public int augmentSlots() {
        return augStart < 0 ? 0 : AUGMENT_SLOTS;
    }

    public int augmentStart() {
        return augStart;
    }

    public List<ItemStack> installedAugments() {
        List<ItemStack> list = new ArrayList<>();
        if (augStart >= 0) {
            for (int i = 0; i < AUGMENT_SLOTS; i++) {
                list.add(inv.getStackInSlot(augStart + i));
            }
        }
        return list;
    }

    public boolean validAugment(ItemStack stack) {
        return stack.getItem() instanceof AugmentItem a && a.fits(allowedAugments(), installedAugments());
    }

    /** Right click with an augment: into the first empty augment slot. */
    public boolean installAugment(ItemStack stack) {
        if (augStart < 0 || !validAugment(stack)) {
            return false;
        }
        for (int i = 0; i < AUGMENT_SLOTS; i++) {
            if (inv.isEmpty(augStart + i)) {
                inv.setStackInSlot(augStart + i, stack.copyWithCount(1));
                return true;
            }
        }
        return false;
    }

    protected void resetAttributes() {
        baseMod = 1.0F;
        fluidMax = 1.0F;
        rfMax = 1.0F;
        rfXfer = 1.0F;
        radiusBonus = 0;
        potionAmp = 0;
        potionDur = 0.0F;
        xpFeature = false;
        creativeTanks = false;
        filterType = "";
    }

    protected void setAttributesFromAugment(AugmentItem a) {
        baseMod = Math.max(baseMod, a.mod("BaseMod", 1.0F));
        fluidMax = Math.max(fluidMax, a.mod("FluidMax", 1.0F));
        rfMax = Math.max(rfMax, a.mod("RFMax", 1.0F));
        rfXfer = Math.max(rfXfer, a.mod("RFXfer", 1.0F));
        radiusBonus += (int) a.mod("Radius", 0.0F);
        potionAmp += (int) a.mod("PotionAmp", 0.0F);
        potionDur += a.mod("PotionDur", 0.0F);
        xpFeature |= a.mod("XpStr", 0.0F) > 0;
        creativeTanks |= a.mod("FluidCre", 0.0F) > 0;
        if (!a.filterType.isEmpty()) {
            filterType = a.filterType;
        }
    }

    protected void finalizeAttributes() {
        float tankMod = baseMod * fluidMax;
        for (DeviceTank t : tanks) {
            t.applyModifier(tankMod);
        }
        if (energy != null) {
            energy.applyModifiers(baseMod * rfMax, baseMod * rfXfer);
        }
        int newXpCap = xpCapable && xpFeature ? Math.round(BASE_XP * baseMod) : 0;
        if (xpStored > newXpCap) {
            int extra = xpStored - newXpCap;
            xpStored = newXpCap;
            if (level instanceof ServerLevel sl) {
                net.minecraft.world.entity.ExperienceOrb.award(sl, Vec3.atCenterOf(worldPosition), extra);
            }
        }
        xpCapacity = newXpCap;
        if (!filter.type().equals(filterType)) {
            filter = DeviceFilter.create(filterType);
        }
    }

    public final void updateAugmentState() {
        resetAttributes();
        if (augStart >= 0) {
            for (int i = 0; i < AUGMENT_SLOTS; i++) {
                if (inv.getStackInSlot(augStart + i).getItem() instanceof AugmentItem a) {
                    setAttributesFromAugment(a);
                }
            }
        }
        finalizeAttributes();
        itemView = null;
        fluidView = null;
    }

    protected void onInventoryChanged(int slot) {
        if (augStart >= 0 && slot >= augStart) {
            updateAugmentState();
        }
        setChanged();
    }

    protected void onTankChanged() {
        setChanged();
    }

    // ---------------------------------------------------------------------------------------------------------------
    // XP
    // ---------------------------------------------------------------------------------------------------------------

    public int receiveXp(int amount) {
        int n = Math.min(xpCapacity - xpStored, amount);
        if (n > 0) {
            xpStored += n;
            setChanged();
        }
        return Math.max(0, n);
    }

    public int xpStored() {
        return xpStored;
    }

    public int xpCapacity() {
        return xpCapacity;
    }

    public void claimXp(Player player) {
        if (xpStored > 0) {
            player.giveExperiencePoints(xpStored);
            xpStored = 0;
            setChanged();
        }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // filter
    // ---------------------------------------------------------------------------------------------------------------

    public DeviceFilter filter() {
        return filter;
    }

    public boolean hasFilter() {
        return filter != DeviceFilter.NONE;
    }

    public void onFilterChanged() {
        setChanged();
    }

    // ---------------------------------------------------------------------------------------------------------------
    // inventories and tanks for scripts, menus and automation
    // ---------------------------------------------------------------------------------------------------------------

    public DeviceInventory items() {
        return inv;
    }

    public List<DeviceTank> tanks() {
        return tanks;
    }

    public DeviceTank tank(int i) {
        return tanks.get(i);
    }

    public FluidStack renderFluid() {
        return renderFluid;
    }

    public IItemHandler itemCapability(@Nullable Direction side) {
        if (itemView == null) {
            itemView = inv.view(automationExtractsInputs());
        }
        return itemView;
    }

    public @Nullable IFluidHandler fluidCapability(@Nullable Direction side) {
        if (tanks.isEmpty()) {
            return null;
        }
        if (fluidView == null) {
            fluidView = DeviceTank.view(tanks);
        }
        return fluidView;
    }

    public @Nullable IEnergyStorage energyCapability(@Nullable Direction side) {
        return energy;
    }

    public int energyStored() {
        return energy == null ? 0 : energy.getEnergyStored();
    }

    public int energyCapacity() {
        return energy == null ? 0 : energy.getMaxEnergyStored();
    }

    public IFluidHandler tankHandler() {
        return DeviceTank.view(tanks);
    }

    // ---------------------------------------------------------------------------------------------------------------
    // progress bars (Thermal's getScaled*), set by the devices
    // ---------------------------------------------------------------------------------------------------------------

    public int getScaledDuration(int scale) {
        return isActive ? scale : 0;
    }

    public int getScaledProgress(int scale) {
        return isActive ? scale : 0;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // use
    // ---------------------------------------------------------------------------------------------------------------

    /**
     * A right click that is not the menu: an augment goes into the device, a fluid container fills or empties it.
     * Returns true if the click was used up.
     */
    public boolean onItemUse(ServerPlayer player, InteractionHand hand, ItemStack held) {
        if (validAugment(held)) {
            if (installAugment(held)) {
                if (!player.getAbilities().instabuild) {
                    held.shrink(1);
                }
                player.level().playSound(null, player.blockPosition(), CaeDevices.TINKER_SOUND.get(), SoundSource.PLAYERS, 0.1F,
                        (player.getRandom().nextFloat() - player.getRandom().nextFloat()) * 0.35F + 0.9F);
            } else {
                player.level().playSound(null, player.blockPosition(), SoundEvents.NOTE_BLOCK_BASS.value(), SoundSource.PLAYERS, 0.1F, 0.25F);
            }
            return true;
        }
        IFluidHandler handler = fluidCapability(null);
        if (handler != null && !held.isEmpty()) {
            return FluidUtil.interactWithFluidHandler(player, hand, handler);
        }
        return false;
    }

    /** Sneak + right click opens the filter, when there is one. */
    public boolean openFilterMenu(ServerPlayer player) {
        if (hasFilter()) {
            player.openMenu(new FilterMenuProvider(this), buf -> {
                writeMenuTarget(buf);
                buf.writeUtf(filter.type());
            });
            return true;
        }
        return false;
    }

    public boolean canOpenGui() {
        return true;
    }

    @Override
    public Component getDisplayName() {
        return Component.translatable(getBlockState().getBlock().getDescriptionId());
    }

    @Override
    public @Nullable AbstractContainerMenu createMenu(int id, Inventory playerInv, Player player) {
        return new DeviceMenu(id, playerInv, this);
    }

    public boolean stillValid(Player player) {
        return !isRemoved() && level != null && player.distanceToSqr(Vec3.atCenterOf(worldPosition)) <= 64.0;
    }

    /** Menu buttons beyond the common ones; returns whether it was handled. */
    public boolean menuButton(Player player, int id) {
        return false;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // breaking
    // ---------------------------------------------------------------------------------------------------------------

    /** Thermal (keepItems = false): the contents drop in the world; the augments and settings stay with the dropped device. */
    public void dropContents(Level level, BlockPos pos) {
        int end = augStart >= 0 ? augStart : inv.getSlots();
        for (int i = 0; i < end; i++) {
            ItemStack st = inv.getStackInSlot(i);
            if (!st.isEmpty()) {
                Containers.dropItemStack(level, pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5, st);
                inv.slot(i).stack = ItemStack.EMPTY;
            }
        }
        if (xpStored > 0 && level instanceof ServerLevel sl) {
            net.minecraft.world.entity.ExperienceOrb.award(sl, Vec3.atCenterOf(pos), xpStored);
            xpStored = 0;
        }
    }

    @Override
    protected void collectImplicitComponents(DataComponentMap.Builder builder) {
        super.collectImplicitComponents(builder);
        if (augStart >= 0) {
            List<ItemStack> list = new ArrayList<>();
            for (int i = 0; i < AUGMENT_SLOTS; i++) {
                ItemStack st = inv.getStackInSlot(augStart + i);
                if (!st.isEmpty()) {
                    list.add(st.copy());
                }
            }
            if (!list.isEmpty()) {
                builder.set(CaeDevices.AUGMENTS.get(), new Augments(list));
            }
        }
        if (level != null) {
            CompoundTag settings = new CompoundTag();
            if (rs.mode != RedstoneControl.Mode.DISABLED) {
                rs.writeSettings(settings);
            }
            if (hasFilter()) {
                filter.write(level.registryAccess(), settings);
            }
            writeKept(level.registryAccess(), settings);
            if (!settings.isEmpty()) {
                builder.set(CaeDevices.SETTINGS.get(), settings);
            }
        }
    }

    @Override
    protected void applyImplicitComponents(DataComponentInput input) {
        super.applyImplicitComponents(input);
        Augments augmentsComp = input.get(CaeDevices.AUGMENTS.get());
        List<ItemStack> augments = augmentsComp == null ? null : augmentsComp.stacks();
        if (augments != null && augStart >= 0) {
            for (int i = 0; i < AUGMENT_SLOTS; i++) {
                inv.slot(augStart + i).stack = i < augments.size() ? augments.get(i).copy() : ItemStack.EMPTY;
            }
            updateAugmentState();
        }
        CompoundTag settings = input.get(CaeDevices.SETTINGS.get());
        if (settings != null) {
            rs.readSettings(settings);
            if (hasFilter() && level != null) {
                filter.read(level.registryAccess(), settings);
            }
            if (level != null) {
                readKept(level.registryAccess(), settings);
            }
        }
    }

    @Override
    public void removeComponentsFromTag(CompoundTag tag) {
        tag.remove("Items");
        tag.remove("Tanks");
        tag.remove("RSControl");
        tag.remove("Filter");
        tag.remove("FilterType");
    }

    /** What else a dropped device keeps (the soil infuser's energy). */
    protected void writeKept(HolderLookup.Provider registries, CompoundTag settings) {
    }

    protected void readKept(HolderLookup.Provider registries, CompoundTag settings) {
    }

    // ---------------------------------------------------------------------------------------------------------------
    // saving and syncing
    // ---------------------------------------------------------------------------------------------------------------

    @Override
    protected void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.saveAdditional(tag, registries);
        tag.putBoolean("Active", isActive);
        tag.put("Items", inv.save(registries, 0, inv.getSlots()));
        if (!tanks.isEmpty()) {
            tag.put("Tanks", DeviceTank.save(registries, tanks));
        }
        tag.putInt("Xp", xpStored);
        if (energy != null) {
            tag.putInt("Energy", energy.getEnergyStored());
        }
        rs.write(tag);
        if (hasFilter()) {
            filter.write(registries, tag);
        }
        if (!renderFluid.isEmpty()) {
            tag.put("RenderFluid", renderFluid.save(registries));
        }
        saveExtra(tag, registries);
    }

    @Override
    protected void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.loadAdditional(tag, registries);
        if (tag.contains("attachments", Tag.TAG_COMPOUND) && !tag.contains("Items")) {
            loadLegacy(tag, registries);
        } else {
            isActive = tag.getBoolean("Active");
            inv.load(registries, tag.getList("Items", Tag.TAG_COMPOUND), 0, inv.getSlots());
            DeviceTank.load(registries, tanks, tag.getList("Tanks", Tag.TAG_COMPOUND));
            xpStored = tag.getInt("Xp");
            rs.read(tag);
            renderFluid = tag.contains("RenderFluid") ? FluidStack.parse(registries, tag.getCompound("RenderFluid")).orElse(FluidStack.EMPTY) : FluidStack.EMPTY;
            // the augments decide the filter type, so work them out first, then read the filter into it
            updateAugmentState();
            if (energy != null) {
                energy.set(tag.getInt("Energy"));
            }
            if (hasFilter()) {
                filter.read(registries, tag);
            }
            loadExtra(tag, registries);
            return;
        }
        updateAugmentState();
    }

    /** KubeJS 7's saved format of the devices this pack had before: a "data" compound and the "attachments" by name. */
    private void loadLegacy(CompoundTag tag, HolderLookup.Provider registries) {
        isActive = false;
        CompoundTag attachments = tag.getCompound("attachments");
        loadLegacyAttachments(registries, attachments);
        loadLegacyData(tag.getCompound("data"));
        if (level == null) {
            cached = false;
        }
    }

    protected void saveExtra(CompoundTag tag, HolderLookup.Provider registries) {
    }

    protected void loadExtra(CompoundTag tag, HolderLookup.Provider registries) {
    }

    /** Reads this device's KubeJS attachments (inventories by id, tanks by id). */
    protected void loadLegacyAttachments(HolderLookup.Provider registries, CompoundTag attachments) {
    }

    /** Reads the counters the KubeJS script kept in its "data" compound. */
    protected void loadLegacyData(CompoundTag data) {
    }

    protected static void legacyTank(HolderLookup.Provider registries, CompoundTag attachments, String id, DeviceTank tank) {
        tank.setFluid(attachments.contains(id) ? FluidStack.parse(registries, attachments.get(id)).orElse(FluidStack.EMPTY) : FluidStack.EMPTY);
    }

    public void syncClient() {
        if (level != null && !level.isClientSide) {
            BlockState st = getBlockState();
            level.sendBlockUpdated(worldPosition, st, st, 3);
        }
    }

    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        CompoundTag tag = new CompoundTag();
        tag.putBoolean("Active", isActive);
        if (!renderFluid.isEmpty()) {
            tag.put("RenderFluid", renderFluid.save(registries));
        }
        saveSync(tag, registries);
        return tag;
    }

    @Override
    public void handleUpdateTag(CompoundTag tag, HolderLookup.Provider registries) {
        isActive = tag.getBoolean("Active");
        renderFluid = tag.contains("RenderFluid") ? FluidStack.parse(registries, tag.getCompound("RenderFluid")).orElse(FluidStack.EMPTY) : FluidStack.EMPTY;
        loadSync(tag, registries);
    }

    @Override
    public @Nullable Packet<ClientGamePacketListener> getUpdatePacket() {
        return ClientboundBlockEntityDataPacket.create(this);
    }

    /** What the client needs of this device for rendering, beyond the active flag and the render fluid. */
    protected void saveSync(CompoundTag tag, HolderLookup.Provider registries) {
    }

    protected void loadSync(CompoundTag tag, HolderLookup.Provider registries) {
    }

    // ---- the menu's live data (Thermal's gui packet) ----

    public void writeGui(RegistryFriendlyByteBuf buf) {
        buf.writeBoolean(isActive);
        FluidStack.OPTIONAL_STREAM_CODEC.encode(buf, renderFluid);
        buf.writeVarInt(tanks.size());
        for (DeviceTank t : tanks) {
            FluidStack.OPTIONAL_STREAM_CODEC.encode(buf, t.getFluid());
            buf.writeVarInt(t.getCapacity());
            buf.writeBoolean(t.creative.getAsBoolean());
        }
        buf.writeVarInt(xpStored);
        buf.writeVarInt(xpCapacity);
        buf.writeInt(energyStored());
        buf.writeInt(energyCapacity());
        buf.writeByte(rs.power);
        buf.writeByte(rs.mode.ordinal());
        buf.writeBoolean(hasFilter());
    }

    public void readGui(RegistryFriendlyByteBuf buf) {
        isActive = buf.readBoolean();
        renderFluid = FluidStack.OPTIONAL_STREAM_CODEC.decode(buf);
        int n = buf.readVarInt();
        for (int i = 0; i < n; i++) {
            FluidStack fs = FluidStack.OPTIONAL_STREAM_CODEC.decode(buf);
            int cap = buf.readVarInt();
            boolean creative = buf.readBoolean();
            if (i < tanks.size()) {
                DeviceTank t = tanks.get(i);
                t.setFluid(fs);
                t.setCapacity(cap);
                clientCreative = creative;
            }
        }
        xpStored = buf.readVarInt();
        xpCapacity = buf.readVarInt();
        int en = buf.readInt();
        int enCap = buf.readInt();
        if (energy != null) {
            energy.applyModifiers(enCap / (float) Math.max(1, energy.baseCapacity), 1.0F);
            energy.set(en);
        }
        rs.power = buf.readByte();
        int m = buf.readByte();
        rs.mode = m >= 0 && m < RedstoneControl.Mode.VALUES.length ? RedstoneControl.Mode.VALUES[m] : RedstoneControl.Mode.DISABLED;
        clientHasFilter = buf.readBoolean();
    }

    /** the client's copy of what the server said (the client has no augments to work it out from) */
    public boolean clientCreative;
    public boolean clientHasFilter;

    public boolean filterTabVisible() {
        return level != null && level.isClientSide ? clientHasFilter : hasFilter();
    }

    // ---------------------------------------------------------------------------------------------------------------
    // small helpers for the devices
    // ---------------------------------------------------------------------------------------------------------------

    /**
     * The block entity a client menu works with. The client may not have the block entity yet (the block was placed in the same
     * tick the menu opened), so then one is made from the block state at the position; it only holds what the menu shows.
     */
    public static DeviceBE forClientMenu(Level level, BlockPos pos) {
        return forClientMenu(level, pos, null);
    }

    /** What a menu's client side needs to rebuild the device: where it is and which device it is. */
    public void writeMenuTarget(net.minecraft.network.FriendlyByteBuf buf) {
        buf.writeBlockPos(worldPosition);
        buf.writeResourceLocation(net.minecraft.core.registries.BuiltInRegistries.BLOCK.getKey(getBlockState().getBlock()));
    }

    /**
     * The device a client menu opened by {@link #writeMenuTarget} works with: the client's block entity there when it is the
     * same device, else a detached one made from the server's block (the client hasn't got the block yet, or still has an
     * older one there), so the menu always has the server's slot layout and gui packet format.
     */
    public static DeviceBE readMenuTarget(Level level, net.minecraft.network.FriendlyByteBuf buf) {
        BlockPos pos = buf.readBlockPos();
        Block block = net.minecraft.core.registries.BuiltInRegistries.BLOCK.get(buf.readResourceLocation());
        return forClientMenu(level, pos, block);
    }

    private static DeviceBE forClientMenu(Level level, BlockPos pos, @Nullable Block block) {
        if (level.getBlockEntity(pos) instanceof DeviceBE be && (block == null || be.getBlockState().is(block))) {
            return be;
        }
        if (block instanceof DeviceBlock db) {
            BlockState here = level.getBlockState(pos);
            if (db.newBlockEntity(pos, here.is(block) ? here : block.defaultBlockState()) instanceof DeviceBE made) {
                made.setLevel(level);
                return made;
            }
        }
        if (block == null && level.getBlockEntity(pos) instanceof DeviceBE be) {
            return be;
        }
        BlockState st = level.getBlockState(pos);
        DeviceBE made = st.getBlock() instanceof DeviceBlock db && db.newBlockEntity(pos, st) instanceof DeviceBE d ? d : null;
        if (made == null) {
            made = new TreeExtractorBE(pos, CaeDevices.TREE_EXTRACTOR_BE.get().getValidBlocks().iterator().next().defaultBlockState());
        }
        made.setLevel(level);
        return made;
    }

    protected boolean isServer() {
        return level != null && !level.isClientSide;
    }

    protected ListTag legacyList(CompoundTag attachments, String id) {
        return attachments.getList(id, Tag.TAG_COMPOUND);
    }
}
