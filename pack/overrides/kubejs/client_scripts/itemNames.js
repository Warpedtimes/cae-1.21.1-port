function capitalize(string) {;
	let stringOut = "";
	string.split(/[ \_]/).forEach(substring =>{
		substring = substring.charAt(0).toUpperCase()+substring.slice(1);
		stringOut = stringOut + substring + " ";
	});
	return stringOut;
};

// port: 'client.generate_assets' + event.addLang is ClientEvents.lang('en_us') + event.renameItem
// 1211: ClientEvents.lang(lang, event) and LangKubeEvent.renameItem(ItemStack, String) are unchanged in KubeJS 7.
// 1211: Ingredient has no getItems() for Rhino in KubeJS 7 (client error on the first test); the upgrade items are
// listed from the item registry instead, with the same unanchored match as the old regex ingredient.
ClientEvents.lang('en_us', event => {
	let rename = (item, newName) => event.renameItem(Item.of(item), newName)

	let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
	BuiltInRegistries.ITEM.keySet().forEach(rl => {
		let id = String(rl)
		if (/sophisticatedbackpacks:.*_upgrade/.test(id)) {
			rename(id, capitalize(id.replace("sophisticatedbackpacks:", "").replace("_upgrade", "") + " Slate"))
		}
	})

    rename("sophisticatedbackpacks:iron_backpack", "Radiant Backpack")
	rename("sophisticatedbackpacks:gold_backpack", "Brass Backpack")
	rename("sophisticatedbackpacks:diamond_backpack", "Cyberbackpack Mk 2")
	rename("sophisticatedbackpacks:netherite_backpack", "Cyberbackpack Mk 1")
})
