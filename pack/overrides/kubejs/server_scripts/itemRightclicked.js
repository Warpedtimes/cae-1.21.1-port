//priority: 1000
function distance(vector){
	let x = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
	return Math.floor(Math.sqrt(x))
}
// 1211: Forbidden Arcanus' orb (gone from FA 2.6) used itself up on right-click and gave 6000 ticks of creative flight
// (FA config items.orb_of_temporary_flight.time); cae:orb_of_temporary_flight is a plain item, so this does both.
// Without the shrink every right-click handed out another spawner core shell.
ItemEvents.rightClicked(event =>{
	if (event.item.id == 'cae:orb_of_temporary_flight'){
		if (!event.player.isCreative()) {
			event.item.shrink(1)
			event.player.give('pneumaticcraft:spawner_core_shell')
		}
		event.player.persistentData.putInt('caeOrbFlight', 6000)
		event.player.addTag('cae_orb_flight')
		caeOrbFlight(event.player, true)
	}
})
function caeOrbFlight(player, on) {
	if (player.isCreative() || player.isSpectator()) return
	player.abilities.mayfly = on
	if (!on) player.abilities.flying = false
	player.onUpdateAbilities()
}
// audit 4 S-8/G-1: the entity tag cae_orb_flight marks a running orb for the core mod's Magic Feather, which can't read
// KubeJS's persistentData (a separate tag from NeoForge's), so it no longer lands a player whose orb is still running
PlayerEvents.tick(event => {
	let player = event.player
	let t = player.persistentData.getInt('caeOrbFlight')
	if (t <= 0) return
	player.persistentData.putInt('caeOrbFlight', t - 1)
	if (t == 1) {
		player.removeTag('cae_orb_flight')
		// audit 4: the flight used to end mid-air with nothing to break the fall
		if (!player.onGround() && !player.isCreative() && !player.isSpectator()) {
			event.server.runCommandSilent(`effect give ${player.name.string} minecraft:slow_falling 15 0 true`)
		}
		caeOrbFlight(player, false)
		return
	}
	if (t == 200) player.tell(Text.gold('Your Orb of Temporary Flight wears off in 10 seconds.'))
	if (!player.tags.contains('cae_orb_flight')) player.addTag('cae_orb_flight')
	// audit 4 S-8: logging in (PlayerList.loadGameTypes) and respawning reset mayfly for survival players while the timer
	// kept running, so the rest of the flight was lost; it is given back while the timer runs
	if (!player.abilities.mayfly) caeOrbFlight(player, true)
})
let arcaneblox = ['forbidden_arcanus:arcane_polished_darkstone',"forbidden_arcanus:arcane_crystal_block"]
let dontIDparts = ["integratedtunnels:part_importer_item","integratedtunnels:part_interface_item","integratedtunnels:part_exporter_item"]
// 1211: part TYPE names as the cable saves them (__partType = IPartType.getUniqueName(): Integrated Tunnels 1.13 still
// "integratedtunnels:importer_item" etc.), as in the 1.18.2 script; the port had put the part ITEM IDs here, which never match
let dontIDcomponents = ["integratedtunnels:importer_item","integratedtunnels:interface_item","integratedtunnels:exporter_item"]
let nonoIDArray = ["create:basin","create:depot","create:chute","create:smart_chute","create:andesite_tunnel","create:brass_tunnel","create:belt"]
function getdirx(text){
	if(text == "north") return 0;
	if(text == "east") return 1;
	if(text == "south") return 0;
	if(text == "west") return -1;
	if(text == "up") return 0;
	if(text == "down") return 0;
}
function getdiry(text){
	if(text == "north") return 0;
	if(text == "east") return 0;
	if(text == "south") return 0;
	if(text == "west") return 0;
	if(text == "up") return 1;
	if(text == "down") return -1;
}
function getdirz(text){
	if(text =="north") return -1;
	if(text == "east") return 0;
	if(text == "south") return 1;
	if(text == "west") return 0;
	if(text == "up") return 0;
	if(text == "down") return 0;
}
function dirtostr(x,y,z){
	if(x == 0 && y== 0 && z == -1){ return "north"};
	if(x == 1 && y== 0 && z == 0){ return "east"};
	if(x == 0 && y== 0 && z == 1){ return "south"};
	if(x == -1 && y== 0 && z == 0){ return "west"};
	if(x == 0 && y== 1 && z == 0){ return "up"};
	if(x == 0 && y== -1 && z == 0){ return "down"};
}
// port: entityData is a Java CompoundTag now; read the cable's parts with CompoundTag methods
// 1211: checked 19 Oct 2026 against Integrated Dynamics 1.38.1: the multipart block entity still saves "partContainer"
// (BlockEntityMultipartTicking) and PartHelpers still writes "parts" with "__partType" (the part's unique name) and
// "__side" (Direction.getSerializedName: "north" ...).
function cableHasPart(cable, side){
	let found = false
	try {
		let container = cable.entityData.getCompound('partContainer')
		let parts = container.getList('parts', 10)
		for (let n = 0; n < parts.size(); n++) {
			let thing = parts.getCompound(n)
			if (dontIDcomponents.includes(String(thing.getString('__partType'))) && String(thing.getString('__side')) == side) {found = true}
		}
	} catch (e) {}
	return found
}
function cloudCheck(event){
	let truofal = false
	for (let i = -1; i < 2; i++) {
		for (let j = -1; j < 2; j++) {

			for (let k = -1; k < 2; k++) {
				if((i != 0 && j ==0 && k ==0) || (i == 0 && j !=0 && k ==0) || (i == 0 && j ==0 && k !=0) ){

				if(event.block.offset(i,j,k).id == "integrateddynamics:cable"){
					if (cableHasPart(event.block.offset(i,j,k), dirtostr(i*-1,j*-1,k*-1))) {truofal=true}
				}
				}
			}

		}

	}
	return truofal
}
BlockEvents.placed(event =>{
	if (nonoIDArray.includes(String(event.block.id))) {
		if(cloudCheck(event)){
			// port: '@e[type=minecraft:player]' selector -> level.players; Vec3i replaced by plain coordinates
			event.level.players.forEach(player =>{
				let dx = player.x - event.block.x
				let dy = player.y - event.block.y
				let dz = player.z - event.block.z

				if(distance({x: dx, y: dy, z: dz}) < 10){
					player.tell( Text.red('We Highly Recommend not connecting these ID parts to these Blocks, as they are known to cause a lot of lag most of the time. Only keep it if you know what you are doing.'))

				}
			})

		}
	}
})
let itemcounter = 0
BlockEvents.rightClicked(event =>{

	if (dontIDparts.includes(String(event.item.id)) && nonoIDArray.includes(String(event.block.id))) {
		event.player.tell( Text.red('We Highly Recommend not connecting these ID parts to these Blocks, as they are known to cause a lot of lag most of the time. Only keep it if you know what you are doing.'))

	}


	if (dontIDparts.includes(String(event.item.id))) {
		let letext = String(event.facing)
		if(nonoIDArray.includes(String(event.block.offset(getdirx(letext),getdiry(letext),getdirz(letext)).id))){
			event.player.tell( Text.red('We Highly Recommend not connecting these ID parts to these Blocks, as they are known to cause a lot of lag most of the time. Only keep it if you know what you are doing.'))

		}
	}

	if (event.item.id == "kubejs:runic_tablet" && event.block.entityId == "minecraft:air" && event.block.id != "minecraft:crafting_table") {
		if (!event.player.isCreative()) {event.item.count--}
		let lightning = event.block.createEntity("forbidden_arcanus:crimson_lightning_bolt")
		lightning.spawn()
	}
	if(String(event.player.name.string) == "FortnitePro420Xx" && event.item.id == "minecraft:apple"){
		//this is not to be annoying and hack your servers. Its just for debugging, I actually dont care about your server (newsflash) just disable this line if you are a concerned owner :)
		event.server.runCommandSilent(`playsound cae:developer player @e[type=player] ${event.player.x} ${event.player.y} ${event.player.z}`)
	}
    if (event.block.id == 'cae:skystone_catalyst' && event.item.id == "minecraft:wooden_axe") {
        // 1211: only into a free spot inside the world (it overwrote whatever was 10 up, and above the build limit the
        // catalyst was simply gone); water still counts as free, the point is lifting it out of an ocean
        let up = event.block.offset(0,10,0)
        if (up.y < event.level.getMaxBuildHeight() && up.blockState.canBeReplaced()) {
            event.block.set('air')
            up.set('cae:skystone_catalyst')
        } else {
            event.player.setStatusMessage(Text.red('The catalyst needs free space 10 blocks above it'))
        }
    }
	 if (event.block.id == 'minecraft:cartography_table' && event.item.id == "kubejs:portal_actuation_fluid_bucket") {
        // 1211: arcane temples only generate in the Overworld (elsewhere the map came out blank and the table was gone),
        // and the map now searches from the table, not from the server's command position (world spawn)
        if (String(event.level.dimension) != 'minecraft:overworld') {
            event.player.tell(Text.red('The Arcane Temple Map can only be drawn in the Overworld.'))
        } else {
            event.block.set('air')
            event.server.runCommandSilent(`execute in ${event.level.dimension} positioned ${event.block.x} ${event.block.y} ${event.block.z} run loot spawn ~ ~ ~ loot cae:temple`)
        }
    }
	if (event.item.id == "pneumaticcraft:pneumatic_wrench" && String(event.block.id).startsWith("create:")) {
		event.player.setStatusMessage('We\'ve prevented this item from interacting with Create components due to a possible Crash.')
		event.cancel()
	}

	if (String(event.item.id).includes("gavel") && /^forbidden_arcanus:hephaestus_forge_tier_\d$/.test(String(event.block.id))) { // 1211: tiers 1-5 are separate blocks
        // port (1.21.1): Forbidden Arcanus 2.x gavels have no RemainingRitualUses tag any more; a ritual starter costs 50 durability
        // (the minecraft:damage component, ritual_starter.damage_per_ritual). Resetting the damage before the forge sees the click
        // keeps the "gavel never runs out" behaviour of the 256-use tag.
        event.item.setDamageValue(0)
        // port: dropped "data.Essences.Corruption = 0": Forbidden Arcanus 1.20.1 has no corruption essence (only aureal, souls, blood, experience)


			let hx = event.block.x, hy = event.block.y, hz = event.block.z
			let hdim = event.level.dimension
			event.server.scheduleInTicks(3, c => {
				let forge = event.server.getLevel(hdim).getBlock(hx, hy, hz)
				// port (1.21.1): the forge's running ritual is saved under "active_ritual" with a lower case "counter"
				// (RitualManager.TAG_ACTIVE_RITUAL, ActiveRitualData.CODEC); it is absent when no ritual runs. A small window
				// instead of == 3 because the exact tick offset of the counter is not known.
				// 1211: the forge can be gone 3 ticks later (broken right away); entityData is then null and this threw
				let forgeData = forge.entityData
				if (forgeData == null) return
				let ritual = forgeData.getCompound('active_ritual')
				if (ritual.contains('counter') && ritual.getInt('counter') <= 4){
					event.server.runCommandSilent(`playsound cae:forge_start block @e[type=player] ${hx} ${hy} ${hz}`)
				}
			})


    }
	// Prevent Straw duping because it's annoying!
	if (event.item.id == "createaddition:straw" && event.block.id == 'create:blaze_burner' && String(event.level.dimension) != 'cae:void') {
		if (!event.player.isCreative()) {
			event.block.set('createaddition:liquid_blaze_burner')
			event.item.count--
		}
	}

	if(event.item.id == "forbidden_arcanus:mundabitur_dust" && arcaneblox.includes(String(event.block.id))){


		if(event.block.id == arcaneblox[0]){
			if (event.block.offset(0,1,0).id == arcaneblox[1] && event.block.offset(0,2,0).id == arcaneblox[1]){
				event.server.runCommandSilent(`playsound cae:arcane_obelisk_creation block @e[type=player] ${event.block.x} ${event.block.y} ${event.block.z}`)

			}
		}
		if(event.block.id == arcaneblox[1]){
			if (event.block.offset(0,-1,0).id == arcaneblox[0] && event.block.offset(0,1,0).id == arcaneblox[1]){
				event.server.runCommandSilent(`playsound cae:arcane_obelisk_creation block @e[type=player] ${event.block.x} ${event.block.y} ${event.block.z}`)

			}else if (event.block.offset(0,-1,0).id == arcaneblox[1] && event.block.offset(0,-2,0).id == arcaneblox[0]){
				event.server.runCommandSilent(`playsound cae:arcane_obelisk_creation block @e[type=player] ${event.block.x} ${event.block.y} ${event.block.z}`)

			}
		}

	}



})
