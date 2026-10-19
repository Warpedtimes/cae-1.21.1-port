// port (1.21.1): the Game Stages mod has no 1.21.1 build. KubeJS 7's built-in stages (player.stages, a Stages object stored
// in the player's tags, see dev.latvian.mods.kubejs.stages.TagWrapperStages) are used on their own: has/add/remove and
// PlayerEvents.stageAdded/stageRemoved work the same, so p.stages.has(...) and the stages.add(...) calls in structure.js are
// unchanged. Stages are granted/removed in-game with /kubejs stages add|remove <player> <stage>. Old Game Stages data is not
// migrated (fresh world). sendData(channel, data) still exists.
ServerEvents.loaded(event => {
    event.server.players.forEach(p => {
        if (p.stages.has('arcane_crafting')) {
            p.sendData('jei_show_stage_one', {})
        }

        if (p.stages.has('keystone_crafting')) {
            p.sendData('jei_show_stage_two', {})
        }

        if (p.stages.has('zyzzium')) {
            p.sendData('jei_show_stage_three', {})
        }
    })
})

PlayerEvents.loggedIn(event => {
    if (event.player.stages.has('arcane_crafting')) {
        event.player.sendData('jei_show_stage_one', {})
    }

    if (event.player.stages.has('keystone_crafting')) {
        event.player.sendData('jei_show_stage_two', {})
    }

    if (event.player.stages.has('zyzzium')) {
        event.player.sendData('jei_show_stage_three', {})
    }
})
