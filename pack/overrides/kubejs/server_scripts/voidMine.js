
// port: Create Ore Excavation 1.20 split the old one-recipe "drilling" into a vein type (createoreexcavation:vein: icon, name,
// biome tag, amount, placement) plus drilling recipes that point at it by recipe id (vein_id). Each old tier (_rare, _mid, _epic)
// is now its own vein + its own drilling recipe. The old per-recipe "weight" has no equivalent: veins are placed on a grid
// (spacing/separation/salt) instead; 1211: the weight column is mapped onto the spacing (see spacingOf below).
// port (1.21.1): Create Ore Excavation 1.21-1.6.8 keeps the same KubeJS methods (vein/drilling, veinSize, biomeWhitelist, placement,
// alwaysFinite, drill, stress, fluid) on KubeJS 7 recipe schemas (com.tom.createores.kubejs). Changes: forge: biome tags are c: tags
// (biomeWhitelist is a TagKey<Biome> id without '#'), the vein name is passed as a Text component, and chance outputs use
// CreateItem.of(stack, chance) because ItemStack.withChance() throws on 1.21. Time is a TickDuration (a plain number is ticks).
// 1211 (boot test): the vein recipe JSON "name" is a text component stored as a JSON STRING (data/createoreexcavation/recipe/ore_vein_type/gold.json
// has "name": "{\"translate\":\"item.minecraft.raw_gold\"}"), but the mod's KubeJS component writes a literal Component as a bare string, so
// "Stannum Vein" reached the loader as unquoted JSON (MalformedJsonException at line 1 column N). Passing the literal WITH its quotes
// ("\"Stannum Vein\"" in JSON) makes the loader read a valid JSON string, which is the same component.
ServerEvents.recipes(event => {

    const VoidMine = [
        ['minecraft:raw_gold','"Aurum Vein"',600,5,20,300,'c:is_dry','c:is_overworld','c:is_nether',512,"aurum"], // orestoneable
        ['minecraft:raw_iron','"Ferrum Vein"',1000,10,40,250,'c:is_jungle','c:is_overworld','c:is_rare',256,"ferrum"], // orestoneable
        ['minecraft:raw_copper','"Cuprum Vein"',800,8,60,200,'c:is_mountain','c:is_overworld','c:is_rare',160,"cuprum"], // orestoneable
        ['mekanism:raw_tin','"Stannum Vein"',1002,7,30,250,'c:is_jungle','c:is_overworld','c:is_rare',256,"stannum"], // 1211: thermal
        ['mekanism:raw_lead','"Plumbum Vein"',810,12,60,400,'c:is_jungle','c:is_overworld','c:is_rare',256,"plumbum"], // 1211: thermal
        ['cae:raw_silver','"Argentum Vein"',500,5,20,600,'c:is_mountain','c:is_overworld','c:is_end',512,"argentum"], // 1211: thermal
        ['cae:raw_nickel','"Nickel Vein"',1001,9,35,250,'c:is_jungle','c:is_overworld','c:is_rare',256,"nickel"], // 1211: thermal
        ['create:raw_zinc','"Zinc Vein"',1003,9,35,250,'c:is_jungle','c:is_overworld','c:is_rare',256,"zinc"], // orestoneable
        [[{item: 'minecraft:diamond', chance: 0.20},{item: 'minecraft:coal'}],'"Carbon Vein"',500,5,20,600,'c:is_mountain','c:is_overworld','c:is_end',512,"carbon"]

    ]
    // A distinct, fixed salt per vein (a string hash came out as NaN under Rhino).
    let nextSalt = 662888134
    function saltOf(str) {
        nextSalt = (nextSalt + 7919) % 2000000000
        return nextSalt
    }
    // an output entry is an item id or {item, chance}; chance outputs are Create ProcessingOutputs
    function wrapOut(o) {
        if (typeof o === 'string') { return o }
        return o.chance === undefined ? Item.of(o.item) : CreateItem.of(o.item, o.chance)
    }
    // one vein type + the drilling recipe that mines it
    function Vein(Out,Text,id,biome,size1,size2,spacing,Time,Stress,finite,drill,fluid) {
        let first = Array.isArray(Out) ? Out[0] : Out
        let icon = (typeof first === 'string') ? first : first.item
        let outputs = Array.isArray(Out) ? Out.map(wrapOut) : wrapOut(Out)
        let veinId = 'cae:void_mine/' + id
        let vein = event.recipes.createoreexcavation.vein(Component.literal(Text), icon) // 1211: Text keeps its quotes on purpose, see the note at the top
            .veinSize(size1, size2)
            .biomeWhitelist(biome)
            .placement(spacing, Math.floor(spacing / 4), saltOf(id))
        if (finite) { vein.alwaysFinite() }
        vein.id(veinId)
        let drilling = event.recipes.createoreexcavation.drilling(outputs, veinId, Math.round(Time)).drill(drill).stress(Stress)
        if (fluid) { drilling.fluid(fluid) }
        drilling.id(veinId + '_drilling')
    }
    // 1211: the 1.21 vein recipe (createoreexcavation:vein) has no weight field, only placement {spacing, separation, salt} and
    // a priority, so the original weights (rare = W, mid = W * 0.05, epic = W * 0.4) are mapped onto spacing. One vein is placed
    // per spacing x spacing grid cell, so density is 1 / spacing^2 and spacing = 128 * sqrt(1000 / weight) keeps the original
    // relative rarity between veins and tiers (a weight of 1000 is the old 128-block spacing).
    function spacingOf(weight) {
        return Math.round(128 * Math.sqrt(1000 / weight))
    }
    function BiomeRecource(Out,Text,Weight,Size1,Size2,Time,B1,B2,Dim,Stress,id)  {
        Vein(Out,Text,id + '_rare',B1,Size1,Size2,spacingOf(Weight),Time,Stress,false,'createoreexcavation:netherite_drill',Fluid.of('minecraft:lava', 1000))
        // the original mid tier took the diamond or the netherite drill
        Vein(Out,Text,id + '_mid',B2,Size1 * 0.3,Size2 * 0.3,spacingOf(Weight * 0.05),Time * 2,Stress * 2,true,['createoreexcavation:diamond_drill', 'createoreexcavation:netherite_drill'],null)
        Vein(Out,Text,id + '_epic',Dim,Size1 * 0.18,Size2 * 0.18,spacingOf(Weight * 0.4),Time * 4,Stress * 3,true,'#createoreexcavation:drills',null)
    }
    VoidMine.forEach(element => {
        BiomeRecource(element[0],element[1],element[2],element[3],element[4],element[5],element[6],element[7],element[8],element[9],element[10])

    });
})
