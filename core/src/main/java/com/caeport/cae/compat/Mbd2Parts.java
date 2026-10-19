package com.caeport.cae.compat;

import com.mojang.logging.LogUtils;
import net.minecraft.resources.ResourceLocation;
import org.slf4j.Logger;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Lets Multiblocked2 machines registered from KubeJS act as multiblock parts (hatches). Their part settings default to
 * disabled, and KubeJS can't set them itself: on a dedicated server Rhino can't see ConfigPartSettings' methods (its
 * reflection over the class trips on client-only editor classes). The pack's mbd2_machines.js calls
 * {@code enable(id)} for each hatch in StartupEvents.postInit, on both sides. Plain reflection, so the core mod
 * doesn't need MBD2 to build.
 */
public final class Mbd2Parts {
    private static final Logger LOGGER = LogUtils.getLogger();
    private static final String PKG = "com.lowdragmc.mbd2.";

    private Mbd2Parts() {
    }

    /** Returns false (and logs why) when the machine isn't registered or MBD2's internals changed. */
    public static boolean enable(String id) {
        try {
            Object registry = Class.forName(PKG + "api.registry.MBDRegistries").getField("MACHINE_DEFINITIONS").get(null);
            Method get = null;
            for (Method m : registry.getClass().getMethods()) {
                if (m.getName().equals("get") && m.getParameterCount() == 1) {
                    get = m;
                    break;
                }
            }
            Object definition = get == null ? null : get.invoke(registry, ResourceLocation.parse(id));
            if (definition == null) {
                LOGGER.warn("[cae] MBD2 machine {} isn't registered; can't make it a part", id);
                return false;
            }
            Class<?> settingsClass = Class.forName(PKG + "common.machine.definition.config.ConfigPartSettings");
            Class<?> factoryClass = Class.forName(PKG + "common.machine.definition.MBDMachineDefinition$ConfigPartSettingsFactory");
            Object factory = Proxy.newProxyInstance(factoryClass.getClassLoader(), new Class<?>[]{factoryClass},
                    (proxy, method, args) -> switch (method.getName()) {
                        case "get" -> enabledSettings(settingsClass);
                        case "hashCode" -> System.identityHashCode(proxy);
                        case "equals" -> proxy == args[0];
                        case "toString" -> "cae enabled part settings";
                        default -> null;
                    });
            Class<?> definitionClass = Class.forName(PKG + "common.machine.definition.MBDMachineDefinition");
            Field factoryField = definitionClass.getDeclaredField("partSettingsFactory");
            factoryField.setAccessible(true);
            factoryField.set(definition, factory);
            Field settingsField = definitionClass.getDeclaredField("partSettings");
            settingsField.setAccessible(true);
            settingsField.set(definition, enabledSettings(settingsClass));
            return true;
        } catch (ReflectiveOperationException | RuntimeException e) {
            LOGGER.warn("[cae] couldn't make MBD2 machine {} a part: {}", id, e.toString());
            return false;
        }
    }

    /**
     * Hands a KubeJS function back as a real {@link Runnable}. Rhino only converts a function to an interface at a
     * parameter typed with it, so one pushed straight into MBD2's post-task list stays a function and MBD2's cast fails.
     */
    public static Runnable runnable(Runnable task) {
        return task;
    }

    private static Object enabledSettings(Class<?> settingsClass) throws ReflectiveOperationException {
        Object builder = settingsClass.getMethod("builder").invoke(null);
        Class<?> b = builder.getClass();
        b.getMethod("enable", boolean.class).invoke(builder, true);
        b.getMethod("canShare", boolean.class).invoke(builder, true);
        return b.getMethod("build").invoke(builder);
    }
}
