// 1211: scheduleInTicks callbacks get an event without a usable `server` in KubeJS 7 (c.server was undefined, so every
// delayed step threw: no void rooms, no arcane arrival platform; found by the 19 Oct sweep). They use the handler's event.server.
// 1211: FTB Quests 2101 only lets a player run /ftbquests block_rewards (PermissionsHelper.hasEditorPermission needs a player
// source), so the server-run command never blocked anything. The team's flag is set directly (it saves and syncs itself).
let CaeQuestFile = Java.loadClass('dev.ftb.mods.ftbquests.quest.ServerQuestFile')
function caeBlockRewards(player, blocked) {
    // the Entity overload finds the player's FTB team (a party's own id); the UUID one takes a team id, which is only the
    // player's uuid while they play solo
    try { CaeQuestFile.INSTANCE.getOrCreateTeamData(player).setRewardsBlocked(blocked) } catch (e) { console.warn('structure.js: block rewards: ' + e) }
}
// 1211: /setblock fails on a chunk that isn't loaded, and the rooms are placed right after a teleport. Load the chunks a room
// covers (templates are at most 62 blocks wide) before its structure block is set; the void's chunks are empty, so this is cheap.
function caeRoomChunks(level, x, z) {
    for (let cx = x >> 4; cx <= (x + 64) >> 4; cx++) {
        for (let cz = z >> 4; cz <= (z + 64) >> 4; cz++) { level.getChunk(cx, cz) }
    }
}
function advRound (number, digits) {
    let multiplier = digits ? 10 ** digits : 100
    return Math.round(number*multiplier)/multiplier
}
PlayerEvents.advancement(event => {
    // port (1.21.1): event.advancement is a vanilla AdvancementNode now; its id is `advancement.id` (KubeJS AdvancementNodeKJS)
    let advId = String(event.advancement.id)
    if (advId == "cae:end"){
        event.server.runCommandSilent(`execute in minecraft:overworld run tp ${event.player.name.string} 0 200 0`)
        event.server.runCommandSilent(`effect give ${event.player.name.string} minecraft:absorption 100 100 true`)
        caeBlockRewards(event.player, false)
        event.server.runCommandSilent(`gamemode survival ${event.player.name.string}`)
        let Time = event.player.stats.playTime
        let TimeString = advRound(Time) + "ticks"
        if (Time >= 1728000) {TimeString = advRound(Time/1728000) + " Days"}
        else if (Time >= 72000) {TimeString = advRound(Time/72000) + " Hours"}
        else if (Time >= 1200) {TimeString = advRound(Time/1200) + " Minutes"}
        else if (Time >= 20) {TimeString = advRound(Time/20) + " Seconds"}

        event.server.tell("§5 <The Arcane Gods>§6 Congratulations on finishing this pack, Engineer!\n" + (Time <= 12096000 ? "It only took you " + TimeString + "! - You were born for this!" : TimeString + " is how long you've spent - that's true dedication to the craft!"))
    }
    if (advId == "cae:verycool"){
        event.server.tell(Text.lightPurple(`§k ${event.player.name.string} §r has discovered the Arcane Altar`))
        let d = { //this defines the position the structure will spawn at.
            x: 10000,
            y: 64, //this is constant, but it doesnt have to be
            z: 10000,
            id: event.player.id,
            name: event.player.name.string
        }
        event.server.runCommandSilent(`execute in cae:void run gamemode adventure ${d.name}`)
        caeBlockRewards(event.player, true) //block quest rewards
        event.server.runCommandSilent(`effect give ${d.name} minecraft:absorption 100 100 true`)
        event.server.runCommandSilent(`execute in cae:void run clear ${d.name}`)
        event.server.runCommandSilent(`execute in cae:void run curios clear ${d.name}`)
        event.server.runCommandSilent(`effect give ${d.name} minecraft:slow_falling 50 100 true`)
        event.server.runCommandSilent(`execute in cae:void run tp ${d.name} 10026 500 10028`)
        event.server.scheduleInTicks(40, c =>{
            event.server.runCommandSilent(`execute in cae:void run setblock ${d.x} ${d.y} ${d.z} minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:start",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
            event.server.runCommandSilent(`execute in cae:void run setblock ${d.x} ${d.y - 1} ${d.z} minecraft:redstone_block`)
            event.server.runCommandSilent(`execute in cae:void run fill ${d.x} ${d.y} ${d.z} ${d.x} ${d.y - 1} ${d.z} air`)//get rid of the structure and redstone block
            event.server.runCommandSilent(`execute in cae:void run setblock 10026 69 10003 air`)
            event.server.runCommandSilent(`execute in cae:void run setblock 10026 69 10003 cae:start`)
        })
        event.server.scheduleInTicks(50, c => { //make sure the chunks are loaded before trying to set the block
            event.server.tell("<"+ d.name +">"+  " §4...Where am §k§m§dI?")

            event.server.runCommandSilent(`execute in cae:void run tp ${d.name} ${10026} ${70} ${10028}`)
            event.server.runCommandSilent(`execute in cae:void run tp ${d.name} ${10026} ${70} ${10028}`) //these numbers should be half the size of the structure, so the player and spawn ends up in the middle. will need tweaking for your structure.
            event.server.runCommandSilent(`execute in cae:void run spawnpoint ${d.name} ${d.x + 10} ${d.y + 4} ${d.z + 140}`)
        })

        // As soon as player enters the Arcane Altar, let them see the recipes and items/fluids for automating Keystones
        // 1211: the titles went to "@p" from the server, i.e. whoever is nearest world spawn; now to the player who got here
        if (! event.player.stages.has('keystone_crafting')) {
            event.player.stages.add('keystone_crafting');
            event.player.tell("§6New Recipes have been unlocked!")
            event.server.runCommand('/title ' + event.player.username + ' subtitle ["",{"text":"Your adventure into the Arcane is reaching the end!","color":"dark_aqua"}]')
            event.server.runCommand('/title ' + event.player.username + ' title ["",{"text":"Congratulations Engineer!","bold":true,"underlined":true,"color":"dark_green"}]')
        }
        event.player.sendData('jei_show_stage_two', {})
    }
    if (advId == "cae:start"){
        let d = { //this defines the position the strucututre will spawn at.
            x: 10000,
            y: 64, //this is constant, but it doesnt have to be
            z: 10000,
            id: event.player.id,
            name: event.player.name.string
        }

        event.level.players.forEach(player => {
            if(String(player.level.dimension) != "cae:void"){return;}
            event.server.runCommandSilent(`execute in cae:void run gamemode survival ${player.name.string}`)
            event.server.runCommandSilent(`effect give ${player.name.string} minecraft:absorption 100 100 true`)
            caeBlockRewards(player, true) //block quest rewards
            event.server.runCommandSilent(`effect give ${player.name.string} minecraft:slow_falling 20 100 true`)
            event.server.runCommandSilent(`execute in cae:void run tp ${player.name.string} -31985 103 32293`)
            event.server.runCommandSilent(`execute in cae:void run tp ${player.name.string} -31985 103 32293`)
            event.server.runCommandSilent(`tell ${player.name.string} §6 §l You are being Watched. Automate The Keystone. And once you have a stack. Rightclick it.`)
            event.server.runCommandSilent(`execute in cae:void run spawnpoint ${player.name.string} -31985 103 32293`)
            event.server.scheduleInTicks(2, c => { event.server.runCommandSilent(`execute in cae:void run tp ${player.name.string} -31985 103 32293`);})

            event.server.scheduleInTicks(1, cb => {
                event.server.runCommandSilent(`execute in cae:void run setblock -31998 92 32279 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:eggroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -31998 91 32279 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -31998 92 32279 -31998 91 32279 air`)
                event.server.runCommandSilent(`execute in cae:void run tp ${d.name} -31985 103 32293`)
                event.server.runCommandSilent(`execute in cae:void run tp ${d.name} -31985 103 32293`) //these numbers should be half the size of the structure, so the player and spawn ends up in the middle. will need tweaking for your structure.
                event.server.runCommandSilent(`execute in cae:void run spawnpoint ${d.name} -31985 103 32293`)
                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)
            })
        })

        // As soon as player enters the Arcane Dungeon, there's no going back, may as well see the zyzzium
        if (! event.player.stages.has('zyzzium')) {
            event.player.stages.add('zyzzium');
        }
        event.player.sendData('jei_show_stage_three', {})
    }
    if (advId == "cae:arcane"){
        let d = { //this defines the position the strucututre will spawn at.
            x: 8039,
            y: 136, //this is constant, but it doesnt have to be
            z: 10147,
            id: event.player.id,
            name: event.player.name.string
        }

        event.server.runCommandSilent(`effect give ${d.name} minecraft:absorption 100 100 true`)
        event.server.runCommandSilent(`advancement revoke ${d.name} only cae:arcane`)
        event.server.runCommandSilent(`execute in cae:arcane run tp ${d.name} ${d.x} ${d.y} ${d.z}`)
        event.player.tell("§4 §n §l BEFORE ENTERING THE SUN PORTAL PUT ALL ITEMS AWAY, THEY WILL GET DESTROYED")
        event.player.tell("§4 §n §l BEFORE ENTERING THE SUN PORTAL PUT ALL ITEMS AWAY, THEY WILL GET DESTROYED")
        event.player.tell("§4 §n §l BEFORE ENTERING THE SUN PORTAL PUT ALL ITEMS AWAY, THEY WILL GET DESTROYED")
        event.player.tell("§4 §n §l BEFORE ENTERING THE SUN PORTAL PUT ALL ITEMS AWAY, THEY WILL GET DESTROYED")

        // As soon as player enters the Arcane dimension, let them see the recipes and items/fluids for God Actuation Fluid
        if (! event.player.stages.has('arcane_crafting')) {
            event.player.stages.add('arcane_crafting');
            event.player.tell("§6New Recipes have been unlocked!")
            event.server.runCommand('/title ' + event.player.username + ' subtitle ["",{"text":"Your adventure into the Arcane is just beginning.","color":"dark_aqua"}]')
            event.server.runCommand('/title ' + event.player.username + ' title ["",{"text":"Congratulations Engineer!","bold":true,"underlined":true,"color":"dark_green"}]')
        }
        event.player.sendData('jei_show_stage_one', {})

        event.server.scheduleInTicks(40, c => { //make sure the chunks are loaded before trying to set the block
            event.server.runCommandSilent(`execute in cae:arcane run setblock ${d.x} ${d.y} ${d.z} minecraft:water`)
            event.server.runCommandSilent(`execute in cae:arcane run setblock ${d.x} ${d.y-1} ${d.z} minecraft:soul_sand`)
            event.server.runCommandSilent(`execute in cae:arcane run setblock ${d.x} ${d.y+1} ${d.z} minecraft:air`)
            event.server.runCommandSilent(`execute in cae:arcane run tp ${d.name} ${d.x} ${d.y+1} ${d.z}`)
            event.server.runCommandSilent(`execute in cae:arcane run tp ${d.name} ${d.x} ${d.y+1} ${d.z}`)

            if (event.server.getLevel('cae:arcane').getBlock(8090, 110, 10047) === 'create:creative_fluid_tank') {
                event.server.runCommandSilent('execute in cae:arcane run fill 8096 105 10099 8094 105 10097 kubejs:dry_essence')
                event.server.runCommandSilent('execute in cae:arcane run fill 8089 110 10046 8089 110 10047 kubejs:soul_essence replace')
                event.server.runCommandSilent('execute in cae:arcane run setblock 8090 110 10047 create:fluid_tank{Window: 1b, Size: 1, Luminosity: 6, Boiler: {ActiveHeat: 0, Whistles: 0, Supply: 0.0f, PassiveHeat: 0b, Update: 1b, Engines: 0}, Height: 1, TankContent: {Fluid: {id: "kubejs:soul_essence", amount: 2000}}} replace') // port (1.21.1): fluid stacks are {id, amount} now, and a tank keeps its stack under Fluid (NeoForge FluidTank); dropped ForgeCaps/LastKnownPos/x/y/z/id (dead branch anyway, see the === above)
                event.server.runCommandSilent('execute in cae:arcane run setblock 8145 109 10047 create:fluid_tank{Window: 1b, Size: 1, Luminosity: 6, Boiler: {ActiveHeat: 0, Whistles: 0, Supply: 0.0f, PassiveHeat: 0b, Update: 0b, Engines: 0}, Height: 1, TankContent: {Fluid: {id: "kubejs:ice_essence", amount: 4000}}} replace')
                event.server.runCommandSilent('execute in cae:arcane run setblock 8146 114 10098 create:fluid_tank{Window: 1b, Size: 1, Luminosity: 6, Boiler: {ActiveHeat: 0, Whistles: 0, Supply: 0.0f, PassiveHeat: 0b, Update: 0b, Engines: 0}, Height: 1, TankContent: {Fluid: {id: "kubejs:nature_essence", amount: 4000}}} replace')
            }
        })
    }


})

// port (1.21.1): the old STC took its fluids from five PneumaticCraft huge tanks and put its output in a barrel; MBD2
// only does IO through its own hatches, so those six temple blocks become hatches (also in a temple placed before this)
let CAE_STC_HATCHES = [
    [8117, 115, 10073, 'cae:item_output_hatch'],
    [8118, 115, 10071, 'cae:huge_fluid_input_hatch'], [8118, 115, 10075, 'cae:huge_fluid_input_hatch'],
    [8120, 115, 10070, 'cae:huge_fluid_input_hatch'], [8120, 115, 10076, 'cae:huge_fluid_input_hatch'],
    [8123, 115, 10073, 'cae:huge_fluid_input_hatch']
]
function caeStcHatches(level) {
    CAE_STC_HATCHES.forEach(h => {
        let b = level.getBlock(h[0], h[1], h[2])
        if (b.id == 'minecraft:barrel' || b.id == 'pneumaticcraft:huge_tank') b.set(h[3])
    })
}

let structF = 300;
LevelEvents.tick(event => {

    if (String(event.level.dimension) == 'cae:arcane'){
        event.level.getBlock(8117,114,10073).set("cae:stc")
        if (event.level.getBlock(8117,115,10073).id == 'minecraft:barrel') caeStcHatches(event.level)
        if(structF >=1){
            event.server.runCommandSilent(`execute in cae:clearlag run forceload add 6 -8 -3 2`)
            structF--
        } else if (event.level.getBlock(8150,24,10085).id != "minecraft:barrier"){
            let d = { //this defines the position the strucututre will spawn at.
                x: 10000,
                y: 64, //this is constant, but it doesnt have to be
                z: 10000
            }


            event.server.runCommandSilent(`execute in cae:void run forceload add 9990 10053 10065 9982`)
            // port: the sun temple (220x200x200, every position stored) took ~4 GB of heap to load in one piece, so it
            // is now eight 110x100x100 pieces placed a second apart (data/cae/structure/sun_temple/<x>_<y>_<z>), at
            // the spot the old structure block put it (8040 24 9985). /place needs the whole area loaded, hence the
            // wider forceload (the temple reaches z 10185).
            event.server.runCommandSilent(`execute in cae:arcane run forceload add 8032 9968 8272 10192`)
            let piece = 0
            ;[0, 1].forEach(px => [0, 1].forEach(py => [0, 1].forEach(pz => {
                let x = 8040 + px * 110, y = 24 + py * 100, z = 9985 + pz * 100
                event.server.scheduleInTicks(20 * ++piece, () => {
                    event.server.runCommandSilent(`execute in cae:arcane run place template cae:sun_temple/${px}_${py}_${pz} ${x} ${y} ${z}`)
                })
            })))
            event.server.scheduleInTicks(20 * (piece + 1), () => {
                event.server.runCommandSilent(`execute in cae:arcane run setblock 8117 114 10073 cae:stc`)
            })

            structF = 400;
        }
    }
})


let pressed = 8
BlockEvents.rightClicked(event => {
    if(event.block.id == "cae:stc"){
        if(pressed != 0){event.player.tell("The STC might be bugged. rightclick onto it "+ pressed +" times more to replace it! If you wish to reset this counter, right-click any other block"); pressed--}
        else{event.block.set("air"); pressed = 8}

    }
    else{if(String(event.level.dimension) == "cae:arcane"){pressed = 8}}
    if(event.item.id == 'kubejs:portal_actuation_fluid_bucket'&& event.block.id == "cae:portal_core"){
        let x = event.block.x
        let y = event.block.y
        let z = event.block.z
        event.server.runCommandSilent(`execute in ${event.level.dimension} run fill ${x-7} ${y+1} ${z} ${x+7} ${y+11} ${z} cae:arcane_portal replace air`)

        event.item.setCount(0)
        event.cancel()
    }
    if(event.item.id == 'kubejs:god_actuation_fluid_bucket'&& event.block.id == "cae:void"){
        let x = event.block.x
        let y = event.block.y
        let z = event.block.z
        event.server.runCommandSilent(`execute in ${event.level.dimension} run fill ${x} ${y+1} ${z+5} ${x} ${y+11} ${z-5} cae:void_portal replace air`)
        event.item.setCount(0)
        event.cancel()
    }
})

function playerEntry (event, playerName, pos) {
    event.server.runCommandSilent(`execute in cae:void run gamemode survival ${playerName}`)
    event.server.runCommandSilent(`execute in cae:void run clear ${playerName}`)
    event.server.runCommandSilent(`execute in cae:void run curios clear ${playerName}`)
    event.server.runCommandSilent(`effect give ${playerName} minecraft:absorption 100 100 true`)
    event.server.runCommandSilent(`effect give ${playerName} minecraft:slow_falling 20 100 true`)
    event.server.runCommandSilent(`give ${playerName} minecraft:iron_pickaxe`)
    event.server.runCommandSilent(`execute in cae:void run tp ${playerName} ${pos.x} ${pos.y} ${pos.z}`)
    event.server.runCommandSilent(`execute in cae:void run spawnpoint ${playerName} ${pos.x} ${pos.y} ${pos.z}`)
    event.server.scheduleInTicks(2, c=>{
        event.server.runCommandSilent(`execute in cae:void run tp ${playerName} ${pos.x} ${pos.y} ${pos.z}`)
    })
}


ItemEvents.rightClicked(event => { //generating new rooms
    if (String(event.level.dimension) != 'cae:void') {return}
    if (event.item.count == 64){
        if (event.item.id == "minecraft:barrier"){ //this is the first room so no item id shit
            event.level.players.forEach(player => {
                if (String(player.level.dimension) != "cae:void") {return;}
                playerEntry(event, player.name.string, {x: -31985, y: 103, z: 32293})
            })
            event.server.scheduleInTicks(1, c => {
                caeRoomChunks(event.level, -31998, 32279)
                event.server.runCommandSilent(`execute in cae:void run setblock -31998 92 32279 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:eggroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -31998 91 32279 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -31998 92 32279 -31998 91 32279 air`)
                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)
            })
        }

        if(event.item.id == "cae:soul_keystone"){
            event.level.players.forEach(player => {
                if(String(player.level.dimension) != "cae:void"){return;}
                playerEntry(event, player.name.string, {x: -31995, y: 121, z: 32255})
            })
            event.server.scheduleInTicks(1, c => {
                caeRoomChunks(event.level, -32006, 32227)
                event.server.runCommandSilent(`execute in cae:void run setblock -32006 87 32227 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:iceroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32006 86 32227 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32006 87 32227 -32006 86 32227 air`)

                caeRoomChunks(event.level, -31998, 32279)
                event.server.runCommandSilent(`execute in cae:void run setblock -31998 92 32279 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:eggroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -31998 91 32279 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -31998 92 32279 -31998 91 32279 air`)

                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)
            })
        } else if (event.item.id == "cae:ice_keystone") {
            event.level.players.forEach(player => {
                if(String(player.level.dimension) != "cae:void"){return;}
                playerEntry(event, player.name.string, {x: -32036, y: 109, z: 32260})
            })
             event.server.scheduleInTicks(1, c => {
                caeRoomChunks(event.level, -32067, 32229)
                event.server.runCommandSilent(`execute in cae:void run setblock -32067 93 32229 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:dryroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32067 92 32229 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32067 93 32229 -32067 92 32229 air`)

                caeRoomChunks(event.level, -32006, 32227)
                event.server.runCommandSilent(`execute in cae:void run setblock -32006 87 32227 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:iceroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32006 86 32227 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32006 87 32227 -32006 86 32227 air`)

                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)
            })
        } else if (event.item.id == "cae:dry_keystone"){
            event.level.players.forEach(player => {
                if(String(player.level.dimension) != "cae:void"){return;}
                playerEntry(event, player.name.string, {x: -32035, y: 112, z: 32204})
            })
            event.server.scheduleInTicks(1, c => {
                caeRoomChunks(event.level, -32067, 32229)
                event.server.runCommandSilent(`execute in cae:void run setblock -32067 93 32229 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:dryroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32067 92 32229 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32067 93 32229 -32067 92 32229 air`)

                caeRoomChunks(event.level, -32058, 32188)
                event.server.runCommandSilent(`execute in cae:void run setblock -32058 97 32188 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:sourceroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32058 96 32188 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32058 97 32188 -32058 96 32188 air`)

                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)
            })
        } else if (event.item.id == "cae:source_keystone"){
            event.level.players.forEach(player => {
                if(String(player.level.dimension) != "cae:void"){return;}
                playerEntry(event, player.name.string, {x: -31996, y: 132, z: 32172})
            })
            event.server.scheduleInTicks(1, c => {
                caeRoomChunks(event.level, -32049, 32105)
                event.server.runCommandSilent(`execute in cae:void run setblock -32049 94 32105 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:insanity",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32049 93 32105 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32049 94 32105 -32049 93 32105 air`)

                caeRoomChunks(event.level, -32058, 32188)
                event.server.runCommandSilent(`execute in cae:void run setblock -32058 97 32188 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:sourceroom",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32058 96 32188 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32058 97 32188 -32058 96 32188 air`)

                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)
            })
        } else if (event.item.id == "cae:nature_keystone"){
            event.level.players.forEach(player => {
                if(String(player.level.dimension) != "cae:void"){return;}

                playerEntry(event, player.name.string, {x: -32065, y: 119, z: 32118})
                event.server.runCommandSilent(`execute in cae:void run gamemode adventure ${player.name.string}`)
            })
            event.server.scheduleInTicks(1, c => {

                caeRoomChunks(event.level, -32049, 32105)
                event.server.runCommandSilent(`execute in cae:void run setblock -32049 94 32105 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:insanity",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32049 93 32105 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32049 94 32105 -32049 93 32105 air`)

                caeRoomChunks(event.level, -32091, 32068)
                event.server.runCommandSilent(`execute in cae:void run setblock -32091 103 32068 minecraft:structure_block{ignoreEntities:1b,powered:0b,seed:0L,posX:0,mode:"LOAD",posY:1,sizeX:12,posZ:0,integrity:1.0f,showair:0b,name:"cae:end",id:"minecraft:structure_block",sizeY:10,sizeZ:12,showboundingbox:0b}`)
                event.server.runCommandSilent(`execute in cae:void run setblock -32091 102 32068 minecraft:redstone_block`)
                event.server.runCommandSilent(`execute in cae:void run fill -32091 103 32068 -32091 102 32068 air`)

                event.server.runCommandSilent(`execute in cae:void run kill @e[type=item]`)

                event.server.runCommandSilent(`execute in cae:void run setblock -32057 123 32083 air`)
                event.server.scheduleInTicks(1, c => {
                    event.server.runCommandSilent(`execute in cae:void run setblock -32057 123 32083 cae:end_port[facing=south]`)
                })
            })
        }
    }
})


let forbidden = [
    // 1211: the 1.18.2 list mapped by tools/structures.py (restored blocks keep their 1.18.2 ID); audit/1211/structure_forbidden_1211.txt.
    // The blocks restored later are here under their 1.18.2 IDs too; the stand-ins earlier versions of the port placed
    // (runic darkstone, polished andesite, the industrial iron catwalk, Create's fluid tank) stay for rooms placed then
    'forbidden_arcanus:arcane_polished_darkstone_rod',
    'forbidden_arcanus:runic_chiseled_polished_darkstone',
    'chipped:ornate_andesite_pillar',
    'createdeco:cast_iron_catwalk',
    'createdeco:orange_decal',
    'createdeco:red_decal',
    'davebuildingmod:small_smoke_passive_generator',
    'davebuildingmod:gauge_outer',
    'tconstruct:scorched_fuel_tank',
    'tconstruct:scorched_ingot_tank',
    'minecraft:mycelium',
    'create:cut_calcite_brick_wall',
    'minecraft:smooth_quartz',
    'tconstruct:black_clear_stained_glass',
    'tconstruct:gray_clear_stained_glass',
    'create:ornate_iron_window_pane',
    'minecraft:smooth_quartz_stairs',
    'chipped:tiled_bordered_quartz_block',
    'minecraft:polished_blackstone_brick_stairs',
    'forbidden_arcanus:arcane_polished_darkstone_pillar',
    'minecraft:deepslate_tile_wall',
    'minecraft:deepslate_tiles',
    'minecraft:chiseled_polished_blackstone',
    'davebuildingmod:stars',
    'forbidden_arcanus:runic_darkstone',
    'framedblocks:framed_slab',
    'framedblocks:framed_corner_pillar',
    'create:acacia_window',
    'chipped:nice_white_redstone_lamp',
    'forbidden_arcanus:polished_darkstone',
    'infernalexp:chiseled_glowstone_bricks',
    'chipped:yellow_terracotta_56',
    'infernalexp:glowdust_stone_bricks',
    'create:small_ochrum_bricks',
    'chipped:spiraled_gilded_blackstone',
    'davebuildingmod:vanta_black',
    'minecraft:beacon',
    'biomeswevegone:palm_log',
    'biomeswevegone:stripped_palm_log',
    'immersive_weathering:mossy_stone',
    'minecraft:stone',
    'minecraft:water',
    'minecraft:dirt',
    'minecraft:moss_block',
    'chipped:green_terracotta_52',
    'minecraft:deepslate',
    'biomesoplenty:mahogany_sapling',
    'immersive_weathering:biomesoplenty/jacaranda_leaf_pile',
    'biomesoplenty:bush',
    'biomesoplenty:yellow_maple_leaves',
    'biomesoplenty:jacaranda_leaves',
    'immersive_weathering:biomeswevegone/palm_leaf_pile',
    'biomeswevegone:palm_leaves',
    'minecraft:grass_block',
    'minecraft:seagrass',
    'minecraft:short_grass',
    'biomeswevegone:tiny_lily_pads',
    'minecraft:rooted_dirt',
    'immersive_weathering:hanging_roots_wall',
    'minecraft:fern',
    'chipped:deepslate_67',
    'minecraft:green_concrete_powder',
    'quark:limestone_slab',
    'chipped:rough_mossy_stone_bricks',
    'chipped:andesite_66',
    'chipped:andesite_67',
    'waystones:light_gray_sharestone',
    'decorative_blocks:brazier',
    'minecraft:pink_wool',
    'chipped:pillar_sandstone_bricks',
    'rechiseled:quartz_block_small_tiles',
    'chipped:inlayed_quartz_block',
    'minecraft:red_wool',
    'minecraft:purple_wool',
    'forbidden_arcanus:deorum_trapdoor',
    'ars_nouveau:smooth_sourcestone_alternating',
    'chipped:trodden_andesite',
    'architects_palette:gilded_sandstone_pillar',
    'quark:purpur_vertical_slab',
    'minecraft:purpur_slab',
    'minecraft:purpur_block',
    'chipped:runic_carved_purpur_block',
    'chipped:quartz_block_67',
    'biomeswevegone:rainbow_eucalyptus_wood',
    'ars_nouveau:arcane_core',
    'ars_nouveau:relay_collector',
    'quark:sandstone_bricks_stairs',
    'minecraft:cut_sandstone_slab',
    'chipped:spiraled_sandstone',
    'chipped:tiny_layered_sandstone_slabs',
    'chipped:tiled_sandstone',
    'chipped:polished_andesite',
    'chipped:ornate_purple_stained_glass',
    'quark:myalite_crystal',
    'ars_nouveau:ritual_brazier',
    'decorative_blocks:soul_brazier',
    'minecraft:light_blue_wool',
    'chipped:spiraled_blue_ice',
    'chipped:tiled_light_blue_wool',
    'chipped:smooth_ringed_quartz_block',
    'chipped:smoothed_double_inlayed_quartz_block',
    'minecraft:light_blue_glazed_terracotta',
    'chipped:stacked_gold_block',
    'minecraft:light_gray_glazed_terracotta',
    'minecraft:cyan_concrete',
    'chipped:stacked_diamond_block',
    'chipped:reinforced_gold_block',
    'chipped:pressed_gold_block',
    'chipped:unamused_quartz_block',
    'chipped:tiled_purple_stained_glass',
    'chipped:quartz_block_4',
    'chipped:square_purple_stained_glass',
    'chipped:ancient_gold_block',
    'chipped:spiraled_raw_gold_block',
    'chipped:sanded_lodestone',
    'chipped:eroded_lodestone',
    'chipped:rough_stone',
    'entangled:block',
    'create:creative_crate',
    'create:creative_fluid_tank',
    'pneumaticcraft:liquid_hopper',
    'chipped:angry_andesite',
    'minecraft:acacia_sign',
    'biomeswevegone:packed_black_ice',
    'minecraft:blackstone',
    'createdeco:cast_iron_sheet_slab',
    'minecraft:dead_brain_coral_block',
    'minecraft:snow',
    'minecraft:snow_block',
    'chipped:diorite_pointed_dripstone',
    'minecraft:diorite',
    'minecraft:calcite',
    'minecraft:smooth_basalt',
    'chipped:pearl_sand',
    'create:cut_veridium',
    'chipped:white_sand',
    'forbidden_arcanus:fungyss_slab',
    'minecraft:spruce_slab',
    'minecraft:spruce_stairs',
    'chipped:trodden_blue_ice',
    'chipped:polished_calcite',
    'createdeco:industrial_iron_bars',
    'createdeco:cast_iron_sheet_stairs',
    'chipped:woven_iron_bars',
    'create:refined_radiance_casing',
    'immersive_weathering:permafrost',
    'createdeco:industrial_iron_catwalk_stairs',
    'chipped:layed_diorite_bricks',
    'pneumaticcraft:wall_lamp_inverted_white',
    'chipped:trodden_ice',
    'immersive_weathering:soot',
    'chipped:square_light_gray_stained_glass_pane',
    'chipped:square_white_stained_glass_pane',
    'createdeco:long_pearl_bricks',
    'minecraft:basalt',
    'minecraft:red_stained_glass',
    'minecraft:orange_stained_glass',
    'minecraft:yellow_stained_glass',
    'create:polished_cut_tuff_stairs',
    'create:polished_cut_tuff',
    'create:creative_motor',
    'create:clutch',
    'ars_nouveau:archwood_trapdoor',
    'minecraft:dispenser',
    'create:redstone_link',
    'minecraft:oak_sign',
    'minecraft:grindstone',
    'decorative_blocks:chain',
    'minecraft:quartz_slab',
    'dustrial_decor:cast_iron_pillar',
    'createdeco:industrial_iron_trapdoor',
    'chipped:red_terracotta_57',
    'minecraft:red_terracotta',
    'chipped:small_raw_iron_block_bricks',
    'createdeco:industrial_iron_catwalk',
    'chipped:layed_raw_iron_block_bricks',
    'chipped:white_terracotta_58',
    'createdeco:industrial_iron_door',
    'davebuildingmod:exit_sign',
    'chipped:white_terracotta_59',
    'minecraft:waxed_copper_block',
    'minecraft:waxed_exposed_copper',
    'createdeco:copper_sheet_stairs',
    'chipped:suspicious_spruce_trapdoor',
    'minecraft:bedrock',
    'davebuildingmod:alarm_sign',
    'createdeco:industrial_iron_support',
    'createdeco:locked_industrial_iron_door',
    'createdeco:red_industrial_iron_lamp',
    'farmersdelight:white_canvas_wall_sign',
    'minecraft:smooth_quartz_slab',
    'supplementaries:book_pile',
    'davebuildingmod:pc_setup',
    'supplementaries:globe',
    'biomeswevegone:dacite',
    'framedblocks:framed_lever',
    'chipped:rough_quartz_block',
    'davebuildingmod:white_steel_tank',
    'ae2:sky_stone_tank',
    'biomeswevegone:white_mangrove_bookshelf',
    'minecraft:cobbled_deepslate',
    'framedblocks:framed_panel',
    'framedblocks:framed_stairs',
    'minecraft:deepslate_coal_ore',
    'quark:black_framed_glass_pane',
    'quark:light_gray_framed_glass_pane',
    'framedblocks:framed_slab_corner',
    'minecraft:stripped_dark_oak_wood',
    'framedblocks:framed_slab_edge',
    'minecraft:bookshelf',
    'chipped:bookshelf_1',
    'chipped:bookshelf_4',
    'supplementaries:jar',
    'supplementaries:goblet',
    'supplementaries:candle_holder_white',
    'minecraft:spore_blossom',
    'dustrial_decor:large_chain',
    'supplementaries:hourglass',
    'minecraft:spruce_planks',
    'davebuildingmod:log_pile_chair',
    'architects_palette:redstone_cage_lantern',
    'supplementaries:statue',
    'supplementaries:urn',
    'dustrial_decor:gold_chain',
    'quark:iron_ladder',
    'create:fluid_tank',
    'reliquary:apothecary_cauldron',
    'minecraft:structure_block',
    'pneumaticcraft:pressurized_spawner'

    ]



BlockEvents.broken(event => {
    if (event.player.isCreative() || String(event.level.dimension) != 'cae:void') {return}
    if (forbidden.includes(String(event.block.id))){
        event.player.setStatusMessage(Text.darkRed("Arcane Forces Protect this Block"))
        event.cancel()
    }
    if (wrenchBlockCoords.includes(String(event.block.pos.toShortString()))) {
        event.player.setStatusMessage(Text.darkRed("Arcane Forces Protect this Block"))
        event.cancel()
    }
})

let wrenchBlockCoords = [ //needs coordinates of every single create block
    //soul
    "-31979, 94, 32292",
    "-31979, 95, 32286",
    "-31977, 97, 32288",
    "-31978, 95, 32292",

    //ice
        //essence tank
    "-31979, 93, 32245",
    "-31979, 94, 32245",
    "-31979, 95, 32245",
    "-31979, 96, 32245",

    "-31978, 93, 32245",
    "-31978, 94, 32245",
    "-31978, 95, 32245",
    "-31978, 96, 32245",

    "-31978, 93, 32244",
    "-31978, 94, 32244",
    "-31978, 95, 32244",
    "-31978, 96, 32244",

    "-31979, 93, 32244",
    "-31979, 94, 32244",
    "-31979, 95, 32244",
    "-31979, 96, 32244",

        //water tank
    "-31982, 93, 32245",
    "-31982, 94, 32245",
    "-31982, 95, 32245",
    "-31982, 96, 32245",

    "-31981, 93, 32245",
    "-31981, 94, 32245",
    "-31981, 95, 32245",
    "-31981, 96, 32245",

    "-31981, 93, 32244",
    "-31981, 94, 32244",
    "-31981, 95, 32244",
    "-31981, 96, 32244",

    "-31982, 93, 32244",
    "-31982, 94, 32244",
    "-31982, 95, 32244",
    "-31982, 96, 32244",

        //lava tank
            //small
    "-31977, 93, 32264",
    "-31977, 94, 32264",
    "-31977, 95, 32264",
    "-31977, 96, 32264",
    "-31977, 97, 32264",

            //large
    "-31976, 93, 32265",
    "-31976, 94, 32265",
    "-31976, 95, 32265",
    "-31976, 96, 32265",
    "-31976, 97, 32265",
    "-31976, 98, 32265",

    "-31975, 93, 32265",
    "-31975, 94, 32265",
    "-31975, 95, 32265",
    "-31975, 96, 32265",
    "-31975, 97, 32265",
    "-31975, 98, 32265",

    "-31975, 93, 32264",
    "-31975, 94, 32264",
    "-31975, 95, 32264",
    "-31975, 96, 32264",
    "-31975, 97, 32264",
    "-31975, 98, 32264",

    "-31976, 93, 32264",
    "-31976, 94, 32264",
    "-31976, 95, 32264",
    "-31976, 96, 32264",
    "-31976, 97, 32264",
    "-31976, 98, 32264",

        //misc
    "-31982, 94, 32268",
    "-31980, 94, 32268",
    "-31985, 92, 32269",
    "-31985, 101, 32257",
    "-31985, 101, 32259",

    "-31976, 93, 32261",
    "-31976, 94, 32261",
    "-31976, 95, 32261",
    "-31976, 96, 32261",
    "-31976, 96, 32262",
    "-31976, 96, 32263",

    //dry (why is this called dry??)
        //dry essence
    "-32038, 98, 32243",
    "-32038, 99, 32243",
    "-32038, 100, 32243",
    "-32038, 101, 32243",
    "-32038, 102, 32243",
    "-32038, 103, 32243",
    "-32038, 104, 32243",
    "-32038, 105, 32243",
    "-32038, 106, 32243",
    "-32038, 107, 32243",
    "-32038, 108, 32243",
    "-32038, 109, 32243",
    "-32038, 110, 32243",

    "-32037, 98, 32243",
    "-32037, 99, 32243",
    "-32037, 100, 32243",
    "-32037, 101, 32243",
    "-32037, 102, 32243",
    "-32037, 103, 32243",

    "-32037, 104, 32243",
    "-32037, 105, 32243",
    "-32037, 106, 32243",
    "-32037, 107, 32243",
    "-32037, 108, 32243",
    "-32037, 109, 32243",
    "-32037, 110, 32243",

    "-32038, 98, 32242",
    "-32038, 99, 32242",
    "-32038, 100, 32242",
    "-32038, 101, 32242",
    "-32038, 102, 32242",
    "-32038, 103, 32242",
    "-32038, 104, 32242",
    "-32038, 105, 32242",
    "-32038, 106, 32242",
    "-32038, 107, 32242",
    "-32038, 108, 32242",
    "-32038, 109, 32242",
    "-32038, 110, 32242",

    "-32037, 98, 32242",
    "-32037, 99, 32242",
    "-32037, 100, 32242",
    "-32037, 101, 32242",
    "-32037, 102, 32242",
    "-32037, 103, 32242",
    "-32037, 104, 32242",
    "-32037, 105, 32242",
    "-32037, 106, 32242",
    "-32037, 107, 32242",
    "-32037, 108, 32242",
    "-32037, 109, 32242",
    "-32037, 110, 32242",

        //water tank
    "-32037, 98, 32271",
    "-32037, 99, 32271",
    "-32037, 100, 32271",
    "-32037, 101, 32271",
    "-32037, 102, 32271",
    "-32037, 103, 32271",
    "-32037, 104, 32271",
    "-32037, 105, 32271",
    "-32037, 106, 32271",
    "-32037, 107, 32271",
    "-32037, 108, 32271",
    "-32037, 109, 32271",
    "-32037, 110, 32271",

    "-32038, 98, 32271",
    "-32038, 99, 32271",
    "-32038, 100, 32271",
    "-32038, 101, 32271",
    "-32038, 101, 32271",
    "-32038, 102, 32271",
    "-32038, 103, 32271",
    "-32038, 104, 32271",
    "-32038, 105, 32271",
    "-32038, 106, 32271",
    "-32038, 107, 32271",
    "-32038, 108, 32271",
    "-32038, 109, 32271",
    "-32038, 110, 32271",

    "-32038, 98, 32272",
    "-32038, 99, 32272",
    "-32038, 100, 32272",
    "-32038, 101, 32272",
    "-32038, 102, 32272",
    "-32038, 103, 32272",
    "-32038, 104, 32272",
    "-32038, 105, 32272",
    "-32038, 106, 32272",
    "-32038, 107, 32272",
    "-32038, 108, 32272",
    "-32038, 109, 32272",
    "-32038, 110, 32272",

    "-32037, 98, 32272",
    "-32037, 99, 32272",
    "-32037, 100, 32272",
    "-32037, 101, 32272",
    "-32037, 102, 32272",
    "-32037, 103, 32272",
    "-32037, 104, 32272",
    "-32037, 105, 32272",
    "-32037, 106, 32272",
    "-32037, 107, 32272",
    "-32037, 108, 32272",
    "-32037, 109, 32272",
    "-32037, 110, 32272",

        //rotation input
    "-32023, 98, 32257",

    //source
        //essence tank //NOOOO A 3x3 tank
            //1st layer
    "-32052, 102, 32205",
    "-32052, 103, 32205",
    "-32052, 104, 32205",
    "-32052, 105, 32205",
    "-32052, 106, 32205",
    "-32052, 107, 32205",

    "-32052, 102, 32204",
    "-32052, 103, 32204",
    "-32052, 104, 32204",
    "-32052, 105, 32204",
    "-32052, 106, 32204",
    "-32052, 107, 32204",

    "-32052, 102, 32203",
    "-32052, 103, 32203",
    "-32052, 104, 32203",
    "-32052, 105, 32203",
    "-32052, 106, 32203",
    "-32052, 107, 32203",

            //2nd layer
    "-32053, 102, 32203",
    "-32053, 103, 32203",
    "-32053, 104, 32203",
    "-32053, 105, 32203",
    "-32053, 106, 32203",
    "-32053, 107, 32203",

    "-32053, 102, 32204",
    "-32053, 103, 32204",
    "-32053, 104, 32204",
    "-32053, 105, 32204",
    "-32053, 106, 32204",
    "-32053, 107, 32204",

    "-32053, 102, 32205",
    "-32053, 103, 32205",
    "-32053, 104, 32205",
    "-32053, 105, 32205",
    "-32053, 106, 32205",
    "-32053, 107, 32205",

            //3rd layer
    "-32054, 102, 32205",
    "-32054, 103, 32205",
    "-32054, 104, 32205",
    "-32054, 105, 32205",
    "-32054, 106, 32205",
    "-32054, 107, 32205",

    "-32054, 102, 32204",
    "-32054, 103, 32204",
    "-32054, 104, 32204",
    "-32054, 105, 32204",
    "-32054, 106, 32204",
    "-32054, 107, 32204",

    "-32054, 102, 32203",
    "-32054, 103, 32203",
    "-32054, 104, 32203",
    "-32054, 105, 32203",
    "-32054, 106, 32203",
    "-32054, 107, 32203",

        //misc
    "-32029, 103, 32209",

    "-32029, 102, 32204",

    "-32029, 103, 32199",

    //nature
        //nature essence tank
    "-32008, 117, 32173",
    "-32008, 118, 32173",
    "-32008, 119, 32173",
    "-32008, 120, 32173",
    "-32008, 121, 32173",
    "-32008, 122, 32173",

        //misc
    "-32006, 117, 32178",
    "-31980, 115, 32173",
    "-31980, 120, 32173"

    //Idk why i wrote all this manually.. should have just made a function
]

BlockEvents.rightClicked(event => {
    if (event.player.isCreative() || String(event.level.dimension) != 'cae:void') {return}

    if (event.item.id == "create:wrench" && forbidden.includes(String(event.block.id))){
        event.player.setStatusMessage(Text.darkRed("Arcane Forces Protect this Block"))
        event.cancel()
    } else if (event.item.id == "create:wrench" && wrenchBlockCoords.includes(String(event.block.pos.toShortString()))) {
        event.player.setStatusMessage(Text.darkRed("Arcane Forces Protect this Block"))
        event.cancel()
    } /*else { //coordinates for copy pasting
        if (event.hand != MAIN_HAND) {return}
        event.player.tell("Block Coords:")
        event.player.tell(Component.darkRed(event.block.pos.toShortString()).click(`copy:${"\"" + event.block.pos.toShortString() + "\","}`).hover(`Copy String`))
        event.player.tell(" ")
    }*/
})