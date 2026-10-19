// 1211: Game Stages has no 1.21.1 build. This client script never used it directly: the server scripts send the
// 'jei_show_stage_*' data packets (player.sendData) when a stage is reached, and this script re-adds the hidden items
// to JEI. KubeJS 7 has stages built in (player.stages), so the server side (server_scripts/gameStages.js) is ported there.
// 1211: java('...') is Java.loadClass('...'); global.jeiRuntime no longer exists, so the runtime is read from JEI itself.
const $VanillaTypes = Java.loadClass('mezz.jei.api.constants.VanillaTypes')
const $JeiInternal = Java.loadClass('mezz.jei.common.Internal') // mezz.jei is on KubeJS' class allow-list (kubejs.classfilter.txt)

let stageOneItems = [
    'kubejs:god_actuation_fluid_bucket',
    'kubejs:source_essence_bucket',
    'kubejs:soul_essence_bucket',
    'kubejs:nature_essence_bucket',
    'kubejs:dry_essence_bucket',
    'kubejs:ice_essence_bucket'
]

let stageTwoItems = [
    'cae:source_keystone',
    'cae:soul_keystone',
    'cae:nature_keystone',
    'cae:dry_keystone',
    'cae:ice_keystone'
]

let stageThreeItems = [
    'avaritia:zizz',
    'avaritia:zyzzium_ingot'
]

let showInJei = (ids) => {
    let runtime = $JeiInternal.getOptionalJeiRuntime().orElse(null)
    if (runtime == null) return // JEI not loaded yet (or reloading)
    let stacks = []
    ids.forEach(id => stacks.push(Item.of(id)))
    runtime.getIngredientManager().addIngredientsAtRuntime($VanillaTypes.ITEM_STACK, stacks)
}

// port: 'player.data_from_server.<channel>' is NetworkEvents.dataReceived('<channel>'); Item.of(x) is already an ItemStack
NetworkEvents.dataReceived('jei_show_stage_one', event => {
    showInJei(stageOneItems)
})

NetworkEvents.dataReceived('jei_show_stage_two', event => {
    showInJei(stageTwoItems)
})

NetworkEvents.dataReceived('jei_show_stage_three', event => {
    showInJei(stageThreeItems)
})
