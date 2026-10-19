//priority: 0
// Items with an eternal stella applied break in recipes. Hacky fix to also apply unbreakable to those items when closing a smithing table GUI

// port: 'player.inventory.closed' is PlayerEvents.inventoryClosed
// 1211: Forbidden Arcanus 2.6 stores the modifier as the data component forbidden_arcanus:modifier (a holder of
// forbidden_arcanus:eternal) and its ItemModifier.onApplied() already removes minecraft:damage and minecraft:max_damage from the
// stack, so an eternal item can no longer break and this fix may be unnecessary. It is kept: it now adds the
// minecraft:unbreakable component, found through the component string. Wrapped in try/catch because the exact string format is
// unverified (nothing can break if it never matches).
// 1211: Rhino hides getClass() in KubeJS 7 (this errored on every inventory close on the live server), so the menu type
// is tested with instanceof against the loaded class instead.
// 1211: ItemStack.applyComponents is hidden from scripts too (@HideFromJS); applyComponentsAndValidate is the visible one.
let StellaSmithingMenu = Java.loadClass('net.minecraft.world.inventory.SmithingMenu')
PlayerEvents.inventoryClosed(event =>{
	if (!(event.inventoryContainer instanceof StellaSmithingMenu)) {return}
	try {
		let inv = event.player.inventory
		let unbreakable = null
		for (let slot = 0; slot < inv.getContainerSize(); slot++) {
			let item = inv.getItem(slot)
			if (item.isEmpty()) {continue}
			let components = String(item.componentString)
			if (components.includes("forbidden_arcanus:eternal") && !components.includes("unbreakable=")) {
				if (unbreakable == null) { unbreakable = Item.of("minecraft:stick[minecraft:unbreakable={show_in_tooltip:false}]").getComponentsPatch() }
				item.applyComponentsAndValidate(unbreakable)
			}
		}
	} catch (e) {
		console.warn('stellaFix: ' + e)
	}
})
