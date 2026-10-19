//priority: 0
// 1211: Sophisticated Backpacks 3.26 (1.21.1). Item NBT is gone:
//   - the slot counts are the integer data components sophisticatedcore:number_of_inventory_slots / number_of_upgrade_slots
//     (SophisticatedCore ModCoreDataComponents; a component that is absent means the item's default);
//   - the placed backpack block entity saves the whole stack as `backpackData` = {id, count, components: {...}}
//     (BackpackBlockEntity.saveAdditional), where the old `tag` is now `components`;
//   - the pack's own upgrade counters (leather, string, pocket, obelisk, pcb) live in the minecraft:custom_data component.
const CAE_BP_INV = 'sophisticatedcore:number_of_inventory_slots'
const CAE_BP_UPG = 'sophisticatedcore:number_of_upgrade_slots'

// default [inventory slots, upgrade slots] per backpack tier, as defaultconfigs/sophisticatedbackpacks-server.toml sets them
// (they agree with the resize chain below: gold 27/0 + 18/+1 = iron 45/1, iron - 9/+3 = diamond 36/4, iron + 18/+1 = netherite 63/2)
var caeBpDefaults = id => {
    switch (String(id)) {
        case 'sophisticatedbackpacks:gold_backpack': return [27, 0]
        case 'sophisticatedbackpacks:iron_backpack': return [45, 1]
        case 'sophisticatedbackpacks:diamond_backpack': return [36, 4]
        case 'sophisticatedbackpacks:netherite_backpack': return [63, 2]
        case 'sophisticatedbackpacks:copper_backpack': return [45, 1]
        default: return [9, 1]
    }
}

BlockEvents.rightClicked(event =>{
    let {block, item} = event
    if (String(event.hand) != 'MAIN_HAND') {return}
    if (event.player.crouching) {return}
    if (block.entityId != "sophisticatedbackpacks:backpack") {return}

    // port: NBT is read and written with CompoundTag methods (property access on tags is unreliable in KubeJS)
    let data = block.getEntityData()
    let backpackData = data.getCompound('backpackData')
    // 1211: a backpack that has never been opened has no components (or no slot components) yet: an absent component means the
    // item's default, so the base counts are written back together with the upgrade (the original read the tag's stored counts)
    let comps = backpackData.getCompound('components')
    if (!comps.contains(CAE_BP_INV)) {comps.putInt(CAE_BP_INV, caeBpDefaults(backpackData.getString('id'))[0])}
    if (!comps.contains(CAE_BP_UPG)) {comps.putInt(CAE_BP_UPG, caeBpDefaults(backpackData.getString('id'))[1])}
    let bpTag = comps.getCompound('minecraft:custom_data')
    let slots = 0
    let upgradeSlots = 0
    if (!bpTag.contains('leather')) {
        bpTag.putInt('leather', 0)
        bpTag.putInt('string', 0)
        bpTag.putInt('pocket', 0)
        bpTag.putInt('obelisk', 0)
        bpTag.putInt('pcb', 0)
        //bpTag.putInt(<others>, 0)
    }
    let id = item.id

    if (id == "minecraft:leather" && bpTag.getInt('leather') < 4) {slots = 1; bpTag.putInt('leather', bpTag.getInt('leather') + 1)}
    else if (id == "minecraft:string" && bpTag.getInt('string') < 2) {slots = 1; bpTag.putInt('string', bpTag.getInt('string') + 1)}
    else if (id == "kubejs:leather_pocket" && bpTag.getInt('pocket') < 2) {slots = 6; bpTag.putInt('pocket', bpTag.getInt('pocket') + 1)}
    else if (id == "forbidden_arcanus:arcane_crystal_obelisk" && bpTag.getInt('obelisk') < 1) {upgradeSlots = 1; bpTag.putInt('obelisk', bpTag.getInt('obelisk') + 1)}
    else if (id == "kubejs:finalpcb" && bpTag.getInt('pcb') < 2) {upgradeSlots = 1; bpTag.putInt('pcb', bpTag.getInt('pcb') + 1)}
    else {return}

    comps.putInt(CAE_BP_INV, comps.getInt(CAE_BP_INV) + slots)
    comps.putInt(CAE_BP_UPG, comps.getInt(CAE_BP_UPG) + upgradeSlots)
    comps.put('minecraft:custom_data', bpTag)
    backpackData.put('components', comps)
    data.put('backpackData', backpackData)
    block.mergeEntityData(data)
    if (!event.player.isCreative()) {item.shrink(1)}
    event.cancel()
})

// 1211: ShapedKubeRecipe/ShapelessKubeRecipe.modifyResult(id) only takes the id of a ServerEvents.modifyRecipeResult handler
// (the old modifyResult((grid, result) => ...) callback is gone). A handler must end with event.success(stack): the recipe takes
// the value of the event result. event.grid.find(filter) and event.item (the unmodified result) are available.
// Handlers are registered here, at the top level; the recipes below name them.
var caeBpCopyHandler = id => 'cae:backpack/copy/' + id.replace(':', '_')
var caeBpResizeHandler = id => 'cae:backpack/resize/' + id.replace(':', '_')
// [result, base item whose components (storage uuid, settings, ...) are copied onto the result]
var caeBpCopies = [
    ["kubejs:leather_pocket", "minecraft:bundle"],
    ["sophisticatedbackpacks:stack_upgrade_tier_1", "sophisticatedbackpacks:upgrade_base"],
    ["sophisticatedbackpacks:stack_upgrade_tier_2", "sophisticatedbackpacks:stack_upgrade_tier_1"],
    ["sophisticatedbackpacks:stack_upgrade_tier_3", "sophisticatedbackpacks:stack_upgrade_tier_1"],
    ["sophisticatedbackpacks:stack_upgrade_tier_4", "sophisticatedbackpacks:stack_upgrade_tier_1"],
    ["sophisticatedbackpacks:xp_pump_upgrade", "sophisticatedbackpacks:upgrade_base"]
]
// 1211: KubeJS 7 hides ItemStack.applyComponents from scripts (@HideFromJS; it threw "Cannot find function" on every upgrade
// craft, found by the 19 Oct sweep); applyComponentsAndValidate is the visible equivalent.
caeBpCopies.forEach(entry => {
    ServerEvents.modifyRecipeResult(caeBpCopyHandler(entry[0]), event => {
        let result = event.item
        let base = event.grid.find(entry[1])
        if (!base.isEmpty()) { result.applyComponentsAndValidate(base.getComponentsPatch()) }
        event.success(result)
    })
})
// [result, base backpack, inventory slot change, upgrade slot change]. A backpack without slot components (nothing stored yet)
// leaves the result unchanged, as the old code did for a stack without NBT; otherwise the slot counts are read from the
// component string ("sophisticatedcore:number_of_inventory_slots=45"), defaulting to 27 / 1 when absent.
var caeBpResizes = [
    ["sophisticatedbackpacks:gold_backpack", "sophisticatedbackpacks:backpack", 18, -1],
    ["sophisticatedbackpacks:iron_backpack", "sophisticatedbackpacks:gold_backpack", 18, 1],
    ["sophisticatedbackpacks:diamond_backpack", "sophisticatedbackpacks:iron_backpack", -9, 3],
    ["sophisticatedbackpacks:netherite_backpack", "sophisticatedbackpacks:iron_backpack", 18, 1]
]
caeBpResizes.forEach(entry => {
    ServerEvents.modifyRecipeResult(caeBpResizeHandler(entry[0]), event => {
        let result = event.item
        let base = event.grid.find(entry[1])
        if (base.isEmpty()) { event.success(result); return }
        let patch = base.getComponentsPatch()
        if (patch.isEmpty()) { event.success(result); return }
        result.applyComponentsAndValidate(patch)
        let cs = String(base.componentString)
        let mInv = /number_of_inventory_slots=(\d+)/.exec(cs)
        let mUpg = /number_of_upgrade_slots=(\d+)/.exec(cs)
        let inv = mInv ? parseInt(mInv[1]) : 27
        let upg = mUpg ? parseInt(mUpg[1]) : 1
        let sized = Item.of(entry[0] + '[' + CAE_BP_INV + '=' + (inv + entry[2]) + ',' + CAE_BP_UPG + '=' + (upg + entry[3]) + ']')
        result.applyComponentsAndValidate(sized.getComponentsPatch())
        event.success(result)
    })
})

ServerEvents.recipes(event =>{
    // port: 1.20.1 smithing needs a template item, so these became shapeless crafting recipes (base + addition).
    // The base item's data components are copied onto the result (backpack upgrades keep their settings).
    let smithing = (output, base, addition) => {
        event.shapeless(output, [base, addition]).modifyResult(caeBpCopyHandler(output))
    }
    smithing("kubejs:leather_pocket", "minecraft:bundle", "minecraft:iron_ingot")
    event.remove({output:"sophisticatedbackpacks:upgrade_base"})
    event.shaped("sophisticatedbackpacks:upgrade_base", [" T ", "TDT", " T "], {T:"kubejs:runic_tablet", D:"forbidden_arcanus:polished_darkstone"})
    event.remove({output: /sophisticatedbackpacks\:stack_upgrade_tier/})
    smithing("sophisticatedbackpacks:stack_upgrade_tier_1", "sophisticatedbackpacks:upgrade_base", "minecraft:anvil")
    smithing("sophisticatedbackpacks:stack_upgrade_tier_2", "sophisticatedbackpacks:stack_upgrade_tier_1", "ars_nouveau:source_gem")
    smithing("sophisticatedbackpacks:stack_upgrade_tier_3", "sophisticatedbackpacks:stack_upgrade_tier_1", "forbidden_arcanus:aureal_bottle")
    smithing("sophisticatedbackpacks:stack_upgrade_tier_4", "sophisticatedbackpacks:stack_upgrade_tier_1", "cae:orb_of_temporary_flight")
    if (CAE_THERMAL) { // 1211: thermal (cae:xp_crystal); without Thermal the stock xp pump recipe stays
        event.remove({id: "sophisticatedbackpacks:xp_pump_upgrade"})
        smithing('sophisticatedbackpacks:xp_pump_upgrade', 'sophisticatedbackpacks:upgrade_base', 'cae:xp_crystal')
    }
    event.remove({output:/sophisticatedbackpacks\:.*_backpack/})

    // 1211: see caeBpResizes above. The recipe ids stay the generated ones.
    event.shapeless("sophisticatedbackpacks:gold_backpack", ["sophisticatedbackpacks:backpack", "create:brass_sheet"]).modifyResult(caeBpResizeHandler("sophisticatedbackpacks:gold_backpack"))
    event.shapeless("sophisticatedbackpacks:iron_backpack", ["sophisticatedbackpacks:gold_backpack", "kubejs:radiant_coil"]).modifyResult(caeBpResizeHandler("sophisticatedbackpacks:iron_backpack"))
    event.shapeless("sophisticatedbackpacks:diamond_backpack", ["sophisticatedbackpacks:iron_backpack", "pneumaticcraft:module_expansion_card"]).modifyResult(caeBpResizeHandler("sophisticatedbackpacks:diamond_backpack"))
    event.shapeless("sophisticatedbackpacks:netherite_backpack", ["sophisticatedbackpacks:iron_backpack", "pneumaticcraft:printed_circuit_board"]).modifyResult(caeBpResizeHandler("sophisticatedbackpacks:netherite_backpack"))
})
