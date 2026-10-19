package com.caeport.cae.compat;

import com.lowdragmc.lowdraglib2.gui.texture.IGuiTexture;
import com.lowdragmc.lowdraglib2.gui.ui.UIElement;
import com.lowdragmc.lowdraglib2.gui.ui.UITemplate;
import com.lowdragmc.lowdraglib2.gui.ui.data.Horizontal;
import com.lowdragmc.lowdraglib2.gui.ui.elements.Label;
import com.lowdragmc.lowdraglib2.gui.ui.elements.ProgressBar;
import com.lowdragmc.lowdraglib2.gui.ui.elements.inventory.InventorySlots;
import com.lowdragmc.lowdraglib2.gui.ui.style.StylesheetManager;
import com.lowdragmc.mbd2.api.capability.recipe.IO;
import com.lowdragmc.mbd2.api.registry.MBDRegistries;
import com.lowdragmc.mbd2.common.gui.MBDSprites;
import com.lowdragmc.mbd2.common.machine.definition.MBDMachineDefinition;
import com.lowdragmc.mbd2.common.trait.IUIProviderTrait;
import com.lowdragmc.mbd2.common.trait.RecipeCapabilityTraitDefinition;
import com.lowdragmc.mbd2.common.trait.TraitDefinition;
import com.mojang.logging.LogUtils;
import dev.vfyjxf.taffy.style.AlignItems;
import dev.vfyjxf.taffy.style.FlexDirection;
import dev.vfyjxf.taffy.style.FlexWrap;
import net.minecraft.resources.ResourceLocation;
import net.neoforged.fml.loading.FMLEnvironment;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the GUIs of the pack's Multiblocked2 machines in Java. The pack script (mbd2_machines.js) used to build them
 * from LDLib2's UI classes in Rhino, which fails on a dedicated server (Rhino can't reflect some LDLib2 classes there,
 * and LayoutStyle's getters share names with its setters). The script now calls {@link #apply} once per machine from
 * StartupEvents.postInit, on both sides.
 *
 * Layout (same as the old script): title label, then a row with the input traits, a progress arrow and the output
 * traits, then the player inventory. Layout "quest" is the quest station: 2x2 input grid, arrow, 2x2 output grid, and
 * the task and card slots underneath. Item grids of more than one slot wrap 3 wide; fluid tanks sit side by side.
 * Energy traits (and the Create rotation trait) get no GUI element.
 *
 * Client-only things (the arrow's sprites) are only touched when running on the client.
 */
public final class Mbd2Ui {
    private static final Logger LOGGER = LogUtils.getLogger();

    private Mbd2Ui() {
    }

    /**
     * @param machineId registered MBD2 machine id, e.g. "cae:item_input_hatch"
     * @param progress  whether to put a progress arrow between inputs and outputs
     * @param layout    "quest" for the quest station layout, anything else (or null) for the default one
     * @return true when the template was built and installed, false (with a log line) otherwise
     */
    public static boolean apply(String machineId, boolean progress, String layout) {
        try {
            MBDMachineDefinition def = MBDRegistries.MACHINE_DEFINITIONS.get(ResourceLocation.parse(machineId));
            if (def == null) {
                LOGGER.warn("[mbd2] {} is not registered, no GUI built", machineId);
                return false;
            }
            boolean client = FMLEnvironment.dist.isClient();

            Map<String, UIElement> byName = new HashMap<>();
            List<UIElement> inputs = new ArrayList<>();
            List<UIElement> outputs = new ArrayList<>();
            for (TraitDefinition td : def.machineSettings().traitDefinitions()) {
                if (!(td instanceof IUIProviderTrait provider)) continue;
                String name = td.getName();
                // energy goes through cables, not the GUI; the create rotation trait draws text of its own
                if (name.toLowerCase().contains("energy") || name.toLowerCase().contains("rotation")
                        || td.getClass().getSimpleName().contains("Energy")) continue;
                boolean fluid = td.getClass().getSimpleName().contains("Fluid");
                UIElement c = new UIElement();
                c.setId(name);
                provider.createTraitUITemplate(c);
                int n = c.getChildren().size();
                if (n > 1) {
                    c.getLayout().flexDirection(FlexDirection.ROW);
                    if (fluid) {
                        c.getLayout().gapAll(2f);
                    } else {
                        c.getLayout().flexWrap(FlexWrap.WRAP);
                        c.getLayout().width(Math.min(n, 3) * 18f);
                    }
                }
                byName.put(name, c);
                boolean out = td instanceof RecipeCapabilityTraitDefinition r && r.getRecipeHandlerIO() == IO.OUT;
                (out ? outputs : inputs).add(c);
            }

            UIElement root = box(FlexDirection.COLUMN, 4f);
            root.addClass("panel_bg");
            // the machine fills the text in at runtime (binding id "ui:machine_name"). Full width and left-aligned like a
            // vanilla title: centred by the column, the empty label had no width and the name started mid-panel, running
            // off the right edge on long names.
            Label title = new Label();
            title.setId("ui:machine_name");
            title.getLayout().alignSelf(AlignItems.STRETCH);
            title.textStyle(s -> s.adaptiveWidth(false).textAlignHorizontal(Horizontal.LEFT));
            root.addChild(title);

            UIElement io = box(FlexDirection.ROW, 6f);
            if ("quest".equals(layout)) {
                io.addChild(side(byName, new String[]{"input1", "input2"}, new String[]{"input3", "input4"}));
                if (progress) io.addChild(progressBar(client));
                io.addChild(side(byName, new String[]{"output1", "output2"}, new String[]{"output3", "output4"}));
                root.addChild(io);
                UIElement cards = box(FlexDirection.ROW, 18f);
                for (String n : new String[]{"task_slot", "card_slot"}) {
                    if (byName.containsKey(n)) cards.addChild(byName.get(n));
                }
                root.addChild(cards);
            } else {
                if (!inputs.isEmpty()) io.addChild(column(inputs));
                if (progress) io.addChild(progressBar(client));
                if (!outputs.isEmpty()) io.addChild(column(outputs));
                if (!io.getChildren().isEmpty()) root.addChild(io);
            }
            root.addChild(new InventorySlots());

            UITemplate tpl = UITemplate.of(root, StylesheetManager.MC_MERGED);
            def.machineSettings().uiTemplate().setData(tpl.getData());
            return true;
        } catch (Throwable t) {
            LOGGER.warn("[mbd2] GUI of {} failed, it keeps the empty default one", machineId, t);
            return false;
        }
    }

    private static UIElement box(FlexDirection dir, float gap) {
        UIElement e = new UIElement();
        e.getLayout().flexDirection(dir).gapAll(gap).alignItems(AlignItems.CENTER);
        return e;
    }

    private static UIElement column(List<UIElement> items) {
        UIElement c = box(FlexDirection.COLUMN, 2f);
        items.forEach(c::addChild);
        return c;
    }

    private static UIElement pair(Map<String, UIElement> byName, String[] names) {
        UIElement c = box(FlexDirection.COLUMN, 2f);
        for (String n : names) {
            if (byName.containsKey(n)) c.addChild(byName.get(n));
        }
        return c;
    }

    private static UIElement side(Map<String, UIElement> byName, String[] a, String[] b) {
        UIElement r = box(FlexDirection.ROW, 2f);
        r.addChild(pair(byName, a));
        r.addChild(pair(byName, b));
        return r;
    }

    /** Same arrow the MBD2 editor's "add progress bar" button makes (MachineUIView.createProgressBar). */
    private static ProgressBar progressBar(boolean client) {
        ProgressBar pb = new ProgressBar();
        pb.getLayout().width(20f).height(20f);
        pb.getProgressBarStyle().interpolate(false);
        pb.setId("ui:progress_bar");
        pb.barContainer.getLayout().paddingAll(0f);
        UIElement fill = new UIElement();
        fill.getLayout().width(20f).height(20f);
        if (client) {
            pb.barContainer.getStyle().background(MBDSprites.ARROW_BG);
            pb.bar.getStyle().background(IGuiTexture.EMPTY).overflowVisible(false);
            fill.getStyle().background(MBDSprites.ARROW_BAR);
        }
        pb.bar.addChild(fill);
        pb.label.setDisplay(false);
        return pb;
    }
}
