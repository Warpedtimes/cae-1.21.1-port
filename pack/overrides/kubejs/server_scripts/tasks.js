// priority: 0

// port (1.21.1): server scripts cannot assign to `global`. seededRandom / cachedSeed are file-local now. questLists is shared with
// mbd2_recipes.js, which reads global.questLists: the array is created once in a startup script (global.questLists = [], see the
// top of notes-scripts-logic.md) and only mutated here; without that startup line it falls back to a local array.
let seededRandom
let cachedSeed
let questLists = (global.questLists !== undefined) ? global.questLists : []
let caeTasksReady = questLists.length > 0
// not cleared when the scripts load: the level-loaded event fills it once, then the script-triggered `reload` must still see
// it. The level-loaded event empties it first: the startup global outlives a singleplayer world, so the next world opened in
// the same game got a second set of lists (the 1.18.2 script reset it there too)

console.log(questLists)

let taskCost = 8

function shuffle(array, random) {
    for (let i = 0; i < array.length; i++) {
		let j = random.nextInt(i+1)
		let temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return
};
function assign(array, values, random, item) {
	for (let i = 0; i < array.length; i++) {
		shuffle(array, random)
	}
	let tempArray = []
	let modifiedArray = array
	for (let i = 0; i < values.length; i++) {
		shuffle(modifiedArray, random)
		tempArray[i] = [modifiedArray[0], values[i]]
		modifiedArray.splice(0, 1)
		if (modifiedArray[0] == undefined) {modifiedArray = array}
	}
	questLists.push([tempArray, item])

	return
};

function capitalize(string) {;
	let stringOut = "";
	string.split(/[ \_]/).forEach(substring =>{
		substring = substring.charAt(0).toUpperCase()+substring.slice(1);
		stringOut = stringOut + substring + " ";
	});
	return stringOut;
};

let mining = [//item, value-multiplier, amount-multiplier.
	['minecraft:tuff', 1, 6], 
	['minecraft:calcite', 3, 8],
	['minecraft:deepslate', 1, 24], 
	['minecraft:deepslate', 2, 32], 
	['minecraft:raw_copper', 3, 5], 
	['minecraft:copper_ingot', 2, 6], 
	['minecraft:quartz', 1, 6], 
	['minecraft:quartz', 2, 9], 
	['minecraft:quartz', 3, 13], 
	['minecraft:raw_iron', 4, 2], 
	['minecraft:iron_ingot', 1, 3], 
	['minecraft:iron_block', 8, 1], 
	['minecraft:raw_gold', 8, 1], 
	['minecraft:diamond', 12, 1],
	['minecraft:diamond', 14, 1], 
	['minecraft:ancient_debris', 32, 1], // port (1.21.1): was 'ancient_Debris' (invalid upper case id, rejected by ResourceLocation.parse)
	['minecraft:amethyst_shard', 4, 9]
]
let hunting = [// same as above
	['minecraft:rabbit_hide', 3, 1],
	['minecraft:turtle_scute', 20, 1],
	['minecraft:feather', 1, 4],
	['minecraft:leather', 1, 4],
	['minecraft:rabbit_foot', 8, 1],
	['minecraft:chicken', 1, 12],
	['minecraft:beef', 1, 8],
	['minecraft:porkchop', 1, 8],
	['minecraft:egg', 1, 16],
	['minecraft:turtle_egg', 10, 1],
	['minecraft:mutton', 1, 8],
	['quark:diamond_heart', 24, 1], //are stonelings even enabled?
	['minecraft:white_wool', 1, 32], //maybe
	['minecraft:honey_bottle', 4, 3],
	['minecraft:honeycomb_block', 3, 3]
]
let slaying = [// i am repeating comments.
	['minecraft:ender_pearl', 1, 6],
	['minecraft:bone', 1, 10],
	['minecraft:blaze_rod', 1, 4],
	['minecraft:wither_skeleton_skull', 8, 1],
	['cae:necrotic_bone', 1, 10], // 1211: tinkers
	['minecraft:spider_eye', 1, 4],
	['minecraft:gunpowder', 1, 6],
	['minecraft:slime_ball', 1, 3],
	['minecraft:shulker_shell', 10, 1],
	['minecraft:nautilus_shell', 20, 1],
	['quark:slime_in_a_bucket', 1, 1],
	['minecraft:rotten_flesh', 1, 16],
	['minecraft:string', 1, 8], //flax is a thing
	['minecraft:prismarine_crystals', 1, 2],
	['minecraft:prismarine_shard', 1, 4],
	['minecraft:phantom_membrane', 3, 1],
	['minecraft:ghast_tear', 3, 1],
	['minecraft:nether_star', 48, 1]
]
let farming = [
	['minecraft:wheat', 1, 5], 
	['minecraft:chorus_fruit', 1, 2], 
	['supplementaries:flax', 1, 3], 
	['minecraft:carrot', 1, 9], 
	['minecraft:potato', 1, 9], 
	['minecraft:apple', 1, 3], // villager trades; prb needs a nerf 
	['minecraft:glow_berries', 1, 16], 
	['minecraft:sweet_berries', 1, 16], 
	['minecraft:beetroot', 1, 4], 
	['minecraft:poisonous_potato', 3, 1], //maybe?
	['farmersdelight:rice_bag', 2, 1], 
	['minecraft:hay_block', 2, 1], 
	['farmersdelight:tomato', 1, 12], 
	['farmersdelight:cabbage', 1, 5], 
	['minecraft:bamboo', 1, 32], 
	['minecraft:sugar_cane', 1, 8], 
	['minecraft:melon_slice', 1, 16], 
	['minecraft:pumpkin', 3, 4], 
	['minecraft:melon', 3, 4],
	['minecraft:cocoa_beans', 1, 5],
	['minecraft:nether_wart', 1, 3],
	['minecraft:red_mushroom', 1, 6],
	['minecraft:brown_mushroom', 1, 6],
	['minecraft:warped_fungus', 1, 3],
	['minecraft:crimson_fungus', 1, 3]
]
let fishing = [
	['minecraft:tropical_fish_bucket', 8, 1], 
	['minecraft:tropical_fish', 6, 1], 
	['minecraft:pufferfish_bucket', 6, 1], 
	['minecraft:salmon_bucket', 2, 1], 
	['minecraft:pufferfish', 4, 1], 
	['minecraft:cod_bucket', 2, 1], 
	['minecraft:salmon', 1, 3], 
	['minecraft:cod', 1, 3], 
	['minecraft:glow_ink_sac', 3, 5], 
	['minecraft:ink_sac', 1, 3], 
	['minecraft:nautilus_shell', 20, 1],
	['minecraft:axolotl_bucket', 8, 1],
	['minecraft:fishing_rod', 1, 1]
]
let deforesting = [
	['minecraft:oak_log', 1, 32], 
	['minecraft:spruce_log', 1, 32], 
	['minecraft:birch_log', 1, 32], 
	['minecraft:jungle_log', 1, 32], 
	['minecraft:acacia_log', 1, 32], 
	['minecraft:dark_oak_log', 1, 32], 
	['biomeswevegone:green_enchanted_log', 1, 26], // 1211: tinkers
	['biomeswevegone:blue_enchanted_log', 1, 26], // 1211: tinkers
	['biomeswevegone:redwood_log', 1, 20], // 1211: tinkers
	['minecraft:warped_stem', 1, 26], 
	['minecraft:crimson_stem', 1, 26], 
	['integrateddynamics:menril_log', 1, 26] 
]
let cooking = [ //fd meals n stuff, too lazy rn
]

let collecting = [
	['quark:bottled_cloud', 5, 6], 
	['quark:golden_apple_crate', 40, 1], 
	['minecraft:end_crystal', 24, 1], 
	['minecraft:wither_rose', 15, 3], 
	['minecraft:beacon', 56, 1], 
	//['randomium:randomium', 63 , 1], //you can just dupe gold coins
	['minecraft:fire_charge', 16, 1], 
	['minecraft:experience_bottle', 5, 5], 
	['minecraft:writable_book', 2, 1], 
	['minecraft:name_tag', 5, 1], 
	['minecraft:bundle', 16, 1], 
	['minecraft:enchanted_golden_apple', 40, 1], 
	['forbidden_arcanus:deorum_ingot', 24, 1], 
	['forbidden_arcanus:dragon_scale', 32, 1], 
	['minecraft:saddle', 16, 1], 
	['minecraft:glowstone', 2, 5]
]
let processing //needs to be done in actual pack
let magic //same as processing

let values = [ //multiplier, modifier (output-only)
	[1, 1],
	[1.5, 0],
	[2, -1],
	[2, 1],
	[2.5, 0],
	[3, 0],
	[3, 1],
	[3.5, 1],
	[3.7, 0],
	[4, -1]
]

LevelEvents.loaded(event => {
	if (String(event.level.dimension) != 'minecraft:overworld') {return}
	if (cachedSeed == event.level.getSeed()) {return}
	cachedSeed = event.level.getSeed()
	// port: new java("java.util.Random")(...) -> Java.loadClass
	let JRandom = Java.loadClass('java.util.Random')
	seededRandom = new JRandom(cachedSeed)
	questLists.splice(0, questLists.length)

	//quest types
	assign(mining, values, seededRandom, "quests:mining_task")
	assign(farming, values, seededRandom, "quests:farming_task")
	assign(collecting, values, seededRandom, "quests:collecting_task")
	assign(deforesting, values, seededRandom, "quests:deforesting_task")
	assign(fishing, values, seededRandom, "quests:fishing_task")
	assign(hunting, values, seededRandom, "quests:hunting_task")
	assign(slaying, values, seededRandom, "quests:slaying_task")

	// The task lists depend on the world seed, known only now, after the recipes were built: reload once (per server
	// start, the seed check above stops repeats) so the seeded recipes, tags and loot exist. port: a second later
	// rather than inside the level-load event.
	event.server.scheduleInTicks(20, () => event.server.runCommandSilent('reload'))
})

ServerEvents.recipes(event => {
	let identifier
	// port: step 5 (Multiblocked2): the Custom Machinery "quests:quest_station" recipes in this event are commented out
	/*
	questLists.forEach(array =>{
		if (array[0] == undefined) {array[0] = []}
		identifier = 0
		array[0].forEach(element =>{

			identifier++
			let silverOutput = Math.round(element[0][1]*element[1][0]+element[1][1])
			let itemAmount = Math.round(element[0][2]*element[1][0])
			let task = Item.of(array[1], '\{identifier:' + identifier.toString() + '\}').withName('§4§lQuest: §r§6Collect ' + itemAmount + capitalize(element[0][0].replace(/^.*\:/, ' ')))

			event.recipes.custommachinery.custom_machine("quests:quest_station", 20)
				.requireItem(task, "task_slot")
				.requireItem(Item.of(element[0][0].toLowerCase().replace(/ /g, '_'), itemAmount))
				.produceItem(Item.of("cae:silver_coin", (silverOutput))) // 1211: thermal
				.produceItem(Item.of("cae:silver_coin", taskCost)) // 1211: thermal
				.requireEnergy(1000)
		})
	})
	*/
	//imports
	for (let i = 0; i < global.trades.length; i++) {
		let card = Item.of('trade:trade_card_' + global.trades[i]);
		global.transactions[i].forEach((trade, j) =>{
			let input = Item.of(trade.in)
			let output = Item.of(trade.out)
			if (trade.in.includes("x ")) {
				input = Item.of(trade.in.replace(/^.*x /, ""), Number.parseInt(trade.in.slice(0, trade.in.indexOf("x"))))
			}
			if (trade.out.includes("x ")) {
				output = Item.of(trade.out.replace(/^.*x /, ""), Number.parseInt(trade.out.slice(0, trade.out.indexOf("x"))))
			}
			// port: step 5 (Multiblocked2)
			/*
			event.recipes.custommachinery.custom_machine("quests:quest_station", 20)
				.requireItem(card, "card_slot").chance(0)
				.requireItem(input, "input1")
				.produceItem(output, "output1")
				.requireEnergy(1000)
			*/
			// port (1.21.1): PneumaticCraft 8 amadron offers need an "offer_id" and each side is {"resource": <item stack or fluid stack>}
			// ({id, count}); the old {type, id, amount} form is gone (pnc-repressurized 1.21 AmadronOffer / AmadronTradeResource codecs)
			event.custom({
				"type": "pneumaticcraft:amadron",
				"offer_id": "cae:trade/" + global.trades[i] + "_" + j,
				"static": true,
				"input": {
					"resource": {
						"id": input.id,
						"count": input.count
					}
				},
				"output": {
					"resource": {
						"id": output.id,
						"count": output.count
					}
				},
				"level": 0
			})

		})
	}
	//task imports
	questLists.forEach(array =>{
		let task = array[1]
		let taskImport = Item.of(task.replace(/^.*\:/, "trade:").concat("_import"))
		// port: step 5 (Multiblocked2)
		/*
		event.recipes.custommachinery.custom_machine("quests:quest_station", 20)
			.requireItem(Item.of(taskImport), "task_slot").chance(0)
			.requireItem(Item.of("cae:silver_coin", taskCost)) // 1211: thermal
			.produceItem(Item.of(task)).chance(0)
			.lootTableOutput(task)
			.requireEnergy(1000)
		*/
		event.custom({
			"type": "pneumaticcraft:amadron",
			"offer_id": "cae:task/" + task.replace(/^.*\:/, ""),
			"static": true,
			"input": {
				"resource": {
					"id": "cae:silver_coin", // 1211: thermal
					"count": taskCost
				}
			},
			"output": {
				"resource": {
					"id": task,
					"count": 1
				}
			},
			"level": 0
		})
	})
})

ServerEvents.tags('item', event =>{
	questLists.forEach(questType =>{
		event.add("quests:task_items", [questType[1], questType[1].replace(/^.*\:/, "trade:").concat("_import")])
	})
	global.trades.forEach(trade =>{
		event.add("trade:cards", "trade:trade_card_" + trade)
	})
})

// port (1.21.1): LootJS 3.7 has no addLootTableModifier(...).addWeightedLoot(...) any more; the loot table itself is edited in
// LootJS.lootTables (the data pack tables quests:<type>_task each have one empty pool; a vanilla pool's entries all have weight 1,
// so adding the entries to the first pool is the same "one weighted roll" as before). addNbt became setCustomData (the
// minecraft:custom_data component), setName/addLore take Components (LootFunctionsContainer).
LootJS.lootTables(event=>{
	questLists.forEach(questType =>{
		let identifier = 0
		let table = event.getLootTable(questType[1])
		questType[0].forEach(element => {
			identifier++
			let lootItem = LootEntry.of(questType[1])
			let requiredAmount = Math.round(element[0][2]*+element[1][0])
			let coinOutput = Math.round(element[0][1]*element[1][0]+element[1][1] + taskCost)
			// 1211: a BYTE, on purpose. The quest station recipe (mbd2_recipes.js) matches custom_data={identifier:N}; recipes go
			// through JSON, and DFU's JsonOps turns a JSON number into the smallest NBT type (1 -> byte), so an int tag here
			// would never equal the recipe's byte tag. Identifiers are 1..10; getInt("identifier") reads a byte fine.
			lootItem.setCustomData(NBT.compoundTag({identifier: NBT.b(identifier)}))
			lootItem.setName(Text.of('§4§lQuest: §r§6Collect ' + requiredAmount + capitalize(element[0][0].replace(/^.*\:/, ' '))))
			lootItem.addLore(Text.of('§7' + requiredAmount + capitalize(element[0][0].replace(/^.*\:/, ' ')) + ' §8 -> §7  ' + coinOutput + " Silver"))
			table.firstPool(pool => pool.addEntry(lootItem))
		})
	})
})

ItemEvents.rightClicked(event =>{
	if (!event.item.hasTag("quests:task_items")) {return}
	if (String(event.item.id).includes("import")) {return}
	// port (1.21.1): there is no item NBT; the task's {identifier:N} lives in the minecraft:custom_data component.
	// getCustomData() (KubeJS ComponentFunctions) returns a copy of it, an empty compound when the stack has none.
	let stackTag = event.item.getCustomData()
	if (stackTag.isEmpty()) {
		// the task loot tables only exist after the reload that follows the world load (this script then loads with the
		// lists already filled)
		if (!caeTasksReady) {
			event.player.setStatusMessage("§7The task board is still being written, try again in a moment")
			return
		}
		let itemId = event.item.id
		if (!event.player.isCreative()) {event.item.count--}
		event.server.runCommandSilent(`/loot give ${event.player.name.string} loot ${itemId}`)
		return
	}
	if (stackTag.contains("identifier")) {
		questLists.forEach(questType =>{
			if (questType[1] != event.item.id) {return}
			let id = stackTag.getInt("identifier") - 1
			let reqItem = questType[0][id][0][0]
			let amtMultpl = questType[0][id][1][0]
			let reqAmt = Math.round(amtMultpl * questType[0][id][0][2])
			let silver = Math.round((amtMultpl * questType[0][id][0][1]) + questType[0][id][1][1] + taskCost)
			// port (1.21.1): ItemStack.ignoreNBT() is gone; a plain item id as ItemPredicate already ignores components
			let currentAmt = event.player.inventory.count(reqItem)
			if (currentAmt < reqAmt) {
				event.player.setStatusMessage("§7You need§r " + (reqAmt - currentAmt).toString() + " §7more§r " + capitalize(reqItem.replace(/^.*\:/, "")) + "§7to complete this Quest!")
				event.player.swing()
				return
			}
			if (!event.player.isCrouching()) {
				event.player.setStatusMessage("  §7'§rSneak + Rightclick§7'   to complete this Quest!")
				event.player.swing()
				return
			}
			if (!event.player.isCreative()) {event.item.count--}
			let toTake = reqAmt
			// port: InventoryKJS: get(slot) -> getStackInSlot(slot), extract -> extractItem
			while (toTake > 0) {
				let slot = event.player.inventory.find(reqItem)
				if (slot < 0) {break}
				let slotAmt = event.player.inventory.getStackInSlot(slot).count
				if (toTake <= slotAmt) {
					event.player.inventory.extractItem(slot, toTake, false)
					toTake = 0
					break
				}
				event.player.inventory.extractItem(slot, slotAmt, false)
				toTake -= slotAmt
			}
			event.player.giveInHand(Item.of("cae:silver_coin", silver)) // 1211: thermal
			event.player.setStatusMessage("§6Congrats on completing a Quest!")
			event.player.swing()
		})
	}
})
