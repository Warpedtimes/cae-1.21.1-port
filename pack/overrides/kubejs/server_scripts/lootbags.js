let lootbags = {
    'kubejs:lootbag_poggers': 'loot:patience',
    'kubejs:lootbag_create_andesite': 'loot:lootbag/create/andesite',
    'kubejs:lootbag_create_brass': 'loot:lootbag/create/brass',
    'kubejs:lootbag_create_radiant': 'loot:lootbag/create/radiant',
    'kubejs:lootbag_pcb': 'loot:lootbag/create/pcb',
    'kubejs:lootbag_arcane_1': 'cae:arcaneweak',
    'kubejs:lootbag_arcane_2': 'cae:arcanenormal',
    'kubejs:lootbag_arcane_3': 'cae:arcanetable',
};

ItemEvents.rightClicked(event => {
    if (event.item.id in lootbags) {
        let lootbag = event.item.id
        let loottable = lootbags[lootbag]

        // 1211: event.cancel() now ends the handler on the spot (KubeJS 7 throws EventExit), so it moved to the end;
        // called first, as in 1.18, it stopped the bags from opening at all.
        event.player.swing(event.hand); // port: swingArm is swing
        // 1211: the one-argument player.playSound(id) is gone (Entity.playSound needs sound, volume and pitch and does nothing for
        // players), so play it with the command instead, for everyone within 16 blocks as before.
        event.server.runCommandSilent(`execute at ${event.player.username} run playsound minecraft:entity.experience_orb.pickup player @a[distance=..16] ~ ~ ~`);
        const x = event.player.x, y = event.player.y, z = event.player.z

        // 1211: enchantments are data components; ItemEnchantments is not a map any more, so find the Fortune level by probing
        // hasEnchantment (it checks "level >= n"). 0 = no Fortune: run once.
        let fortuneLevel = 0
        for (let l = 1; l <= 10; l++) {
            if (event.item.hasEnchantment('minecraft:fortune', l)) { fortuneLevel = l }
        }

        if (fortuneLevel < 1) { // If not enchanted, or enchanted but doesn't have Fortune, run once!
            event.server.runCommandSilent(`execute in ${event.level.dimension} run loot spawn ${x} ${y} ${z} loot ${loottable}`);
        } else { // Minimum Fortune 1 enchantment required
            for (let i = 0; i < fortuneLevel; i++) { // Fortune 3 will run 3 times, not 0, 1, 2, 3 (4 times)
                event.server.runCommandSilent(`execute in ${event.level.dimension} run loot spawn ${x} ${y} ${z} loot ${loottable}`);
            }
        }
        event.item.shrink(1);
        event.cancel();
    }
})
