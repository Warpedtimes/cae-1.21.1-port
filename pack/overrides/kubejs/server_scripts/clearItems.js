// port: disabled in the original too (activated = false). Ported anyway: getEntities('@e[...]') selectors became
// getEntities().filter(...), entity.fullNBT became entity.nbt, level.dimension is a ResourceLocation (String(...) to compare).
let activated = false

let deleteditems = []
let minutestodeath = 20 * 60 * 10 // the number on the right dictates the amount of minutes! right now its 10

const activeconstant = 800
let activelycounter = activeconstant;
let minAgeinTicks = 20 * 10 // the number on the right dictates the amount of seconds!
let timeallowedinticks = 20 * 10
let passageitem = "minecraft:diamond"
let deathsubtractor = 1
function sectomin(sec){

    return sec;
}

LevelEvents.tick(event => {
    if(!activated) return
    function ReloadChest(){
        event.server.runCommandSilent(`execute in cae:clearlag run fill -6 61 -14 14 81 8 air`)
        event.server.runCommandSilent(`execute in cae:clearlag run setblock -2 64 -7 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:chest",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
        event.server.runCommandSilent(`execute in cae:clearlag run setblock -2 63 -7 minecraft:redstone_block`)
        event.server.runCommandSilent(`execute in cae:clearlag run fill -2 64 -7 -2 63 -7 air`)
    }
    function SetChest(eitem){
        if(String(event.level.dimension) == "cae:clearlag"){ 
            
        event.level.getBlock(0,73,-2).mergeEntityData(eitem)}
    }
    if (minutestodeath > 0){return}else{
        ReloadChest()
    let Kaunt = 0;
    event.level.getEntities().filter(e => e.type == 'minecraft:item').forEach(item => {
        if(item.nbt.getInt("Age") >= minAgeinTicks){
            
            let id = item.nbt.getCompound("Item").getString("id")
            // port (1.21.1): item stacks save "count" (lower case, int) instead of the byte "Count"
            let count = item.nbt.getCompound("Item").getInt("count")
            Kaunt += count;
            //SetChest(Item.of(id,count))

            let bool = false
            for (let index = 0; index < deleteditems.length; index++) {
                    if (deleteditems[index] != null){
                    if (deleteditems[index].id === id){
                        if(deleteditems[index].count + count <= 64){deleteditems[index].count += count;bool = true;}
                    }
                }
            }
            if(!bool){deleteditems.push(Item.of(id,count));}
            item.discard()
            
    }
    
    })
    if(Kaunt > 0){
    event.server.tell(Text.gold(Kaunt + " Items that are older than "+Math.floor(minAgeinTicks/20)+" seconds have been moved to be destroyed!"));
    event.server.tell(Text.darkGreen(`You can save these items by rightclicking with a ${Item.of(passageitem)}, you have ${Math.floor(activeconstant/20)} seconds!`))}
    let dumbshit = '{Inventory:{Items:['
    let slot = 1;
    deleteditems.forEach(G =>{
        if(slot == 0){
            dumbshit += '{Slot:'+ slot + ', id:"'+G.id+'", count:'+G.count+'}'
        }
        if(slot < deleteditems.length){

            dumbshit += '{Slot:'+ slot + ', id:"'+G.id+'", count:'+G.count+'},'
        }
        if (slot == deleteditems.length){

            dumbshit += '{Slot:'+ slot + ', id:"'+G.id+'", count:'+G.count+'}'
        }
        slot++;
    })

    dumbshit += ']}}'
    //event.server.tell(dumbshit)
    SetChest(dumbshit)
    minutestodeath = 20 * 60 * 5
    activelycounter = activeconstant;
    deleteditems = []
    }
})
LevelEvents.tick(event => {
    if(!activated) return
    if(String(event.level.dimension) == 'cae:clearlag'){
        event.level.getEntities().filter(e => e.isPlayer()).forEach(player =>{
            if (activelycounter < -1 * timeallowedinticks && String(player.level.dimension) == "cae:clearlag"){
                event.server.runCommandSilent(`effect give ${player.name.string} minecraft:slow_falling 50 100 true`)
                event.server.runCommandSilent(`effect give ${player.name.string} minecraft:absorption 100 100 true`)
                event.server.runCommandSilent(`execute in minecraft:overworld run tp ${player.name.string} 0 100 0`)
                event.server.runCommandSilent(`execute in minecraft:overworld run tp ${player.name.string} 0 100 0`)
                player.tell("The Enigmatic Essence of a Dimension filled with nothingness, made you transmute space and time, as to where you ended up in the overworld!")
            }
            
        })
    minutestodeath -= deathsubtractor;
    if (minutestodeath == 20 * 60 * 2){event.server.tell(Text.darkRed("Items on the ground will be cleared in 2 Minutes!"))}
    if (minutestodeath == 20 * 60){event.server.tell(Text.darkRed("Items on the ground will be cleared in 1 Minute!"))}
    if (minutestodeath == 20 * 30){event.server.tell(Text.darkRed("Items on the ground will be cleared in 30 Seconds!"))}}
})

if(activelycounter>0){
ItemEvents.rightClicked(event =>{
    if(!activated) return
    if(String(event.level.dimension) != "cae:clearlag" && !(activelycounter < -1 * timeallowedinticks)){
    if(event.item.id == passageitem){
        let flooredx = Math.floor(event.player.x)
        let flooredy = Math.floor(event.player.y)
        let flooredz = Math.floor(event.player.z)
        let dimension = event.level.dimension
        
        event.player.setStatusMessage(Text.darkRed(`You have ${Math.floor(timeallowedinticks/20)} seconds left!`))
        event.server.runCommandSilent(`execute in cae:clearlag run tp ${event.player.name.string} 3 67 -4`)
        event.server.runCommandSilent(`gamemode adventure ${event.player.name.string}`)
        event.server.scheduleInTicks(timeallowedinticks, c=>{
            event.server.runCommandSilent(`execute in ${dimension} run tp ${event.player.name.string} ${flooredx} ${flooredy} ${flooredz}`)
            event.server.runCommandSilent(`execute in ${dimension} run tp ${event.player.name.string} ${flooredx} ${flooredy} ${flooredz}`)
            event.server.runCommandSilent(`gamemode survival ${event.player.name.string}`)
        })
    }
}
    
})
LevelEvents.tick(event => {
    if(!activated) return
    if(String(event.level.dimension) != 'minecraft:overworld'){return}
    else{
    activelycounter--;}
})
}