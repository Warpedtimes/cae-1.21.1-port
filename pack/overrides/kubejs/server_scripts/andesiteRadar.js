// 1211: the cooldown was one for the whole server, so one player's scan put everyone's radar on cooldown; now each player has
// their own (the server tick their radar works again)
let cooldown = {};

BlockEvents.rightClicked(event =>{
	let who = String(event.player.uuid)
	let left = (cooldown[who] || 0) - event.server.getTickCount()
    if (event.item == 'kubejs:alloy_radar' && left > 0){
        event.player.tell(Text.red('Radar is on cooldown'))
		event.player.tell(Text.green(left/20 + " seconds left."))
    }
	if (event.item == 'kubejs:alloy_radar' && left <= 0){
        cooldown[who] = event.server.getTickCount() + 60;
		let andesite = true;
		let diorite = true;
		for (let x = -8; x <= 9; x++) {
			for (let y = -50; y <= 200; y++) {
				for (let z = -8; z <= 9; z++) {
					if (andesite) {
                        if (event.block.offset(x,y,z).id == 'minecraft:andesite'){
						    event.player.tell("Andesite found at: "+ event.block.offset(x,y,z).getPos())
						    andesite = false;
                        } else if (diorite) {
                            if (event.block.offset(x,y,z).id == 'minecraft:diorite'){
						        event.player.tell("Diorite found at: "+ event.block.offset(x,y,z).getPos())
						        diorite = false;
                            }
                        }
					} else if (diorite) {
                        if (event.block.offset(x,y,z).id == 'minecraft:diorite'){
						    event.player.tell("Diorite found at: "+ event.block.offset(x,y,z).getPos())
						    diorite = false;
                        }
					} else {return}
				}
			}
		}
		if (andesite && diorite){
			event.player.tell(Text.yellow("Nothing found nearby")) // 1211: the scan is 18x18 around the clicked block, not a chunk
		}
	}

})
ServerEvents.recipes(event =>{
	event.shaped("kubejs:alloy_radar",["SIS", " S ", " S "],{I: "minecraft:iron_ingot", S: "minecraft:stick"})
})
