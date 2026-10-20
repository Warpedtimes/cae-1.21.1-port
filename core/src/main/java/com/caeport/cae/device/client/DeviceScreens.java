package com.caeport.cae.device.client;

import com.caeport.cae.device.DeviceBE;
import com.caeport.cae.device.DeviceMenu;
import com.caeport.cae.device.NullifierBE;
import com.caeport.cae.device.RockGenBE;
import com.caeport.cae.device.SoilInfuserBE;
import com.caeport.cae.device.TinkerBenchBE;
import com.caeport.cae.device.TinkerMenu;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.resources.language.I18n;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.LiquidBlock;
import net.minecraft.world.level.material.Fluids;
import net.neoforged.neoforge.fluids.FluidStack;

import java.util.List;

/** The screens that have something of their own: the extruder's blocks, the nullifier's button, the infuser's area, the workbench. */
public final class DeviceScreens {
    private DeviceScreens() {
    }

    /** the screen of a device menu: the plain one unless the device is one of the special ones */
    public static DeviceScreen create(DeviceMenu menu, Inventory inv, Component title) {
        DeviceBE be = menu.be;
        if (be instanceof RockGenBE) {
            return new RockGenScreen(menu, inv, title);
        }
        if (be instanceof NullifierBE) {
            return new NullifierScreen(menu, inv, title);
        }
        if (be instanceof SoilInfuserBE) {
            return new SoilInfuserScreen(menu, inv, title);
        }
        if (be instanceof TinkerBenchBE) {
            return new TinkerScreen((TinkerMenu) menu, inv, title);
        }
        return new DeviceScreen(menu, inv, title);
    }

    /** the Igneous Extruder: shows the lava, the cooling block and the block below that it works with (Thermal's ElementBlock) */
    static final class RockGenScreen extends DeviceScreen {
        RockGenScreen(DeviceMenu menu, Inventory inv, Component title) {
            super(menu, inv, title);
        }

        private void drawBlock(GuiGraphics g, Block block, int x, int y) {
            if (block == Blocks.AIR) {
                return;
            }
            if (block instanceof LiquidBlock lb) {
                drawFluid(g, new FluidStack(lb.fluid, 1000), x, y, 16, 16);
            } else {
                g.renderItem(new ItemStack(block), x, y);
            }
        }

        @Override
        protected void renderDevice(GuiGraphics g, int mx, int my) {
            RockGenBE rg = (RockGenBE) be;
            if (rg.below() != Blocks.AIR) {
                g.blit(tex("elements/slot"), leftPos + 43, topPos + 45, 0, 0, 18, 18, 32, 32);
            }
            if (rg.adjLava() > 0) {
                drawFluid(g, new FluidStack(Fluids.LAVA, 1000), leftPos + 33, topPos + 24, 16, 16);
            }
            drawBlock(g, rg.adjacent(), leftPos + 55, topPos + 24);
            drawBlock(g, rg.below(), leftPos + 44, topPos + 46);
        }
    }

    /** the Nullifier: the button that destroys what is in the bin */
    static final class NullifierScreen extends DeviceScreen {
        private static final ResourceLocation BUTTON = tex("container/nullifier_empty_bin");

        NullifierScreen(DeviceMenu menu, Inventory inv, Component title) {
            super(menu, inv, title);
        }

        private boolean enabled() {
            return ((NullifierBE) be).binHasItems();
        }

        @Override
        protected void renderDevice(GuiGraphics g, int mx, int my) {
            boolean hover = mx >= leftPos + 131 && mx < leftPos + 151 && my >= topPos + 33 && my < topPos + 53;
            int u = !enabled() ? 40 : hover ? 20 : 0;
            g.blit(BUTTON, leftPos + 131, topPos + 33, u, 0, 20, 20, 60, 20);
        }

        @Override
        protected void tooltipDevice(List<Component> tip, int rx, int ry) {
            if (rx >= 131 && rx < 151 && ry >= 33 && ry < 53) {
                tip.add(Component.translatable("info.thermal.device_nullifier_empty_bin"));
            }
        }

        @Override
        protected boolean clickDevice(int rx, int ry, int button) {
            if (rx >= 131 && rx < 151 && ry >= 33 && ry < 53 && enabled()) {
                button(NullifierBE.BTN_EMPTY_BIN);
                clickSound(0.7F);
                return true;
            }
            return false;
        }
    }

    /** the Phyto-Soil Infuser: the size of the area it works on */
    static final class SoilInfuserScreen extends DeviceScreen {
        SoilInfuserScreen(DeviceMenu menu, Inventory inv, Component title) {
            super(menu, inv, title);
        }

        @Override
        protected void renderDevice(GuiGraphics g, int mx, int my) {
            int n = 1 + 2 * ((SoilInfuserBE) be).radius();
            g.drawString(font, I18n.get("info.cofh.area") + ": " + n + " x " + n, leftPos + 70, topPos + 39, 4210752, false);
        }
    }

    /** the Tinker's Workbench: the mode button and the item's augment slots */
    static final class TinkerScreen extends DeviceScreen {
        private static final ResourceLocation AUGMENT_MODE = tex("container/tinker_bench_mode_augment");
        private static final ResourceLocation REPLENISH_MODE = tex("container/tinker_bench_mode_replenish");
        private final TinkerBenchBE bench;

        TinkerScreen(TinkerMenu menu, Inventory inv, Component title) {
            super(menu, inv, title);
            this.bench = menu.bench;
        }

        private boolean augmentable() {
            return TinkerBenchBE.isAugmentable(menu.slots.get(0).getItem());
        }

        @Override
        protected void renderDevice(GuiGraphics g, int mx, int my) {
            if (augmentable()) {
                for (int[] p : TinkerMenu.TINKER_POS) {
                    g.blit(tex("elements/slot"), leftPos + p[0] - 1, topPos + p[1] - 1, 0, 0, 18, 18, 32, 32);
                    if (!bench.allowAugmentation()) {
                        g.blit(tex("elements/disable_underlay_slot"), leftPos + p[0] - 1, topPos + p[1] - 1, 0, 0, 18, 18, 32, 32);
                    }
                }
            }
            boolean hover = mx >= leftPos + 42 && mx < leftPos + 62 && my >= topPos + 51 && my < topPos + 71;
            g.blit(bench.allowAugmentation() ? AUGMENT_MODE : REPLENISH_MODE, leftPos + 42, topPos + 51, hover ? 20 : 0, 0, 20, 20, 40, 20);
        }

        @Override
        protected void tooltipDevice(List<Component> tip, int rx, int ry) {
            if (rx >= 42 && rx < 62 && ry >= 51 && ry < 71) {
                tip.add(Component.translatable(bench.allowAugmentation() ? "info.thermal.tinker_bench_mode_augment" : "info.thermal.tinker_bench_mode_charge"));
            }
        }

        @Override
        protected boolean clickDevice(int rx, int ry, int button) {
            if (rx >= 42 && rx < 62 && ry >= 51 && ry < 71) {
                button(TinkerBenchBE.BTN_MODE);
                clickSound(0.7F);
                return true;
            }
            return false;
        }
    }
}
