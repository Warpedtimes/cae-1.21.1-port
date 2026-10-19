// 1211: JEIEvents.addItems is RecipeViewerEvents.addEntries('item', event => event.add([items])).
// AddEntriesKubeEvent.add(Context, Object[]) takes an array, so always pass one.
RecipeViewerEvents.addEntries('item', event => {
    let items = [
        'create:chromatic_compound',
        'create:refined_radiance',
        'create:refined_radiance_casing',
        'create:shadow_steel',
        'create:shadow_steel_casing'
    ]
    if (Item.exists('cae:nuke_grenade')) items.push('cae:nuke_grenade') // 1211: thermal
    event.add(items)
  })
