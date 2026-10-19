// priority: 1000

// 1211: Thermal and Tinkers have no 1.21.1 build. Their replacements (cae:, Mekanism, Create: Metallurgy) always exist, so these
// flags are constant true; the old guarded blocks that still named Thermal / Tinkers recipe types were deleted.
// compressedcreativity and dustrial_decor have no replacement: their flags stay on Platform.isLoaded (false).
var CAE_THERMAL = true
var CAE_TCONSTRUCT = true
var CAE_COMPRESSEDCREATIVITY = Platform.isLoaded('compressedcreativity')
var CAE_DUSTRIAL = Platform.isLoaded('dustrial_decor')

// 1211: true when every id in the list is a registered item. Tags always count as known; "3x ns:id" counts are stripped;
// ItemStacks are looked up by their id. Item.of(unknownId) throws in KubeJS 7, so check with this before building stacks.
function caeItemsKnown(list) {
    let ok = true
    list.forEach(s => {
        if (typeof s != 'string') { s = String(Item.of(s).id) }
        s = String(s).replace(/^\d+x /, '')
        if (s.startsWith('#')) { return }
        if (!Item.exists(s)) { ok = false }
    })
    return ok
}

// 1211: KubeRecipe has no getUniqueId() / serializeJson() any more (nothing calls this function at the moment). Auto ids
// look like "kubejs:kjs/<hash>" (a JSON digest), so reuse that hash under the given prefix.
function fallback_id(recipe, id_prefix) {
    let id = String(recipe.getId())
    if (id.includes(':kjs/')) {
        recipe.id(id_prefix + 'md5_' + id.substring(id.indexOf(':kjs/') + 5))
    }
}
