
let patience = 5;
ServerEvents.recipes(event => {
    let alreadygotten = []
    // port (1.21.1): item NBT is gone. The stage lives in the minecraft:custom_data component ({stage:N}) and the name in
    // minecraft:custom_name. KubeJS 7 turns an ItemStack with components into a partial components ingredient when it is
    // used as a recipe input (ItemStackKJS.kjs$asIngredient), so .strongNBT() is no longer needed; the stage tag and the
    // name both have to match.
    function stageItem(I, stage, h){
        let s = Item.of(I)
        s.setCustomData(NBT.compoundTag({stage: NBT.i(stage)}))
        return s.withCustomName(Text.of(`Fragment Of Patience, §6Stage:${h}/${patience}`))
    }
    function randomrecipe(I,n,N,id,d,h){
        if(!alreadygotten.includes(d)){
        let out = stageItem(I, N, h+1)
        let inp = stageItem(I, n, h)
        if (d == 0){event.recipes.create.filling(out,[Fluid.of("minecraft:water"),inp]).id(id)}
        if (d == 1){event.recipes.create.sandpaper_polishing(out,inp).id(id)}
        if (d == 2){event.recipes.create.pressing(out,inp).id(id)}
        if (d == 3){event.recipes.create.splashing(out,inp).id(id)}
        if (d == 4){event.recipes.create.milling(out,inp).id(id)}
        if (d == 5){event.recipes.create.emptying([out,Fluid.of("minecraft:water")],inp).id(id)}
        alreadygotten.push(d)
        }
        else{randomrecipe(I,n,N,id,Math.floor(Math.random()*6),h)}
    }
    // port: the input used the NBT string '{stage: }' (invalid), so it is the plain item; the output is stage 1
    event.recipes.create.cutting(stageItem('kubejs:fragment_of_patience',1,1),Item.of('kubejs:fragment_of_patience'))
    // port (1.21.1): .withChance() is gone from ItemStack; KubeJS Create's CreateItem.of(stack, chance) replaces it.
    // The barrel's Enchantments NBT became the minecraft:enchantments component (data-driven enchantments); RepairCost:0 is the default.
    let barrel = Item.of('minecraft:barrel[enchantments={levels:{"minecraft:looting":2}}]').withCustomName(Text.of('Barrel Of Patience'))
    event.recipes.create.deploying([CreateItem.of('kubejs:lootbag_poggers',1/1000),Item.of('kubejs:fragment_of_patience'),CreateItem.of(Item.of('create:chocolate_glazed_berries',1),1/16),CreateItem.of(barrel,1/2)],[stageItem('kubejs:fragment_of_patience',5,patience),"minecraft:iron_ingot"])
    for (let i = 1; i < patience; i++) {
        randomrecipe("kubejs:fragment_of_patience",i,i+1,"cae:test_of_fortnite_"+i,Math.floor(Math.random()*6),i)


    }
})

