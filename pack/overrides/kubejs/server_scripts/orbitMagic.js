const ORBIT_BLOCKS = ['cae:source_time_crystal']
let blck
//values for tweaky tweaky
let addition = 0.05 //used to be +0.05 and no delay but for whatever reason that broke
let endpoint = 0.3	// this is literally just the same circle though
let delay = 1
// 1211: KubeJS 7 renames Entity.setDeltaMovement to setMotion for scripts (@RemapForJS); the old name is "not a function"

// port: KubeJS 6 has no level.getEntities('@e[type=...]'); filter level.entities by type instead
// audit 4 S-4: that wrapped every entity in the level for JS (three times a tick, in every dimension). The type filter now
// runs in Java (ServerLevel.getEntities(EntityTypeTest, Predicate)), so only the wanted entities reach the script.
let CaeEntityType = Java.loadClass('net.minecraft.world.entity.EntityType')
let CAE_ENTITY_TYPES = {}
function entitiesOfType(level, type) {
	let t = CAE_ENTITY_TYPES[type]
	if (t === undefined) { t = CaeEntityType.byString(type).orElse(null); CAE_ENTITY_TYPES[type] = t }
	let out = []
	if (t == null) return out
	level.getEntities(t, e => true).forEach(e => out.push(e))
	return out
}
// port (1.21.1): the core mod's cae:properties is a NeoForge data attachment now (com.caeport.cae.CaeProperties, see
// the port's core notes). CaeProperties.getValue(entity) is the old kubejsdoshit string ("" by default); no ForgeCaps tag exists.
const CaeProperties = Java.loadClass('com.caeport.cae.CaeProperties')
function doShit(entity) {
	return String(CaeProperties.getValue(entity))
}

LevelEvents.tick(event =>{
	// 1211: was overworld only (as in 1.18.2), which made the Nether and End rewards below unreachable: a crystal solved
	// there was used up for nothing. Every dimension now; the others (cae:arcane, cae:void, modded ones) get the default
	// reward, ancient debris
	entitiesOfType(event.level, 'minecraft:area_effect_cloud').forEach(spell => {
		if (doShit(spell) == "IM ALIVE") {
			let random2 = Math.random();
			spell.block.set('air')
			let d = "minecraft:ancient_debris"
			if(String(spell.level.dimension) == 'minecraft:overworld'){d = "minecraft:diamond"}
			if(String(spell.level.dimension) == 'minecraft:the_nether'){d = "minecraft:ancient_debris"}
			if(String(spell.level.dimension) == 'minecraft:the_end'){d = "minecraft:firework_rocket"}
			for (let i = 0; i < 3; i++) {

				spell.block.popItem(d)
			}


			spell.discard()
			return
		   }})
		entitiesOfType(event.level, 'ars_nouveau:spell_proj').forEach(spell => {
		if (doShit(spell) != "doit") {
			if(doShit(spell) == "dontdoit"){spell.discard()}
			return
			}

			//painful block detection
			if (!spell.getTags().contains("found_block") && !spell.getTags().contains("no_block")){
				blck = spell.block;
				let size = 12 //provisional, 7x7x7 cube
				let r
				if (size % 2) {r = (size-1)/2} else {r = size/2}
				for (let a = -r; a <= r; a++) {
					for (let b = -r; b <= r; b++) {
						for (let c = -r; c <= r; c++) {
							if (ORBIT_BLOCKS.includes(String(blck.offset(a,b,c).id))){
								blck = blck.offset(a,b,c)
								spell.addTag("found_block")
								break
							} else if (a==b && b==c && c==r) {
								//event.server.tell("§4 ERROR: Couldnt detect an orbit Block")
								spell.setMotion(0,0,0)
								spell.hurtMarked = true
								spell.addTag("no_block")
								return
							}
						}

						if (blck.id != spell.block) {break}
					}

					if (blck.id != spell.block) {break}
				}
			}
			if (!spell.getTags().contains("orbit") && !spell.getTags().contains("no_block")) {

				let mX = 0; let mXDown = false; let circleX = true; let xPos = 0.5
				let mY = 0; let mYDown = false; let circleY	= true; let yPos = 0.5
				let mZ = 0; let mZDown = false; let circleZ = true; let zPos = 0.5
				let Armorstand = blck.createEntity("area_effect_cloud")
			   // Armorstand.Duration = 300
				Armorstand.spawn()

				spell.setMotion(0,0,0);
				spell.hurtMarked = true;
				let random = Math.random();
				// port: offset(dir, -1) written as explicit offsets (down/up/east/west/north/south, -1)
				if (random <= 1/6) {blck = blck.offset(0, 1, 0); xPos = 0.35; yPos = 0.3; mX = -0.3; mY = 0; circleZ = false; mYDown = true}
				else if (random <= 2/6) {blck = blck.offset(0, -1, 0); xPos = 0.35; yPos = 0.5; mX = -0.3; mY = 0; circleZ = false}
				else if (random <= 3/6) {blck = blck.offset(-1, 0, 0); xPos = 0.6; yPos = 0.4; zPos = 0.35; mX = 0; mZ = -0.3; circleY = false}
				else if (random <= 4/6) {blck = blck.offset(1, 0, 0); xPos = 0.375; yPos = 0.4; zPos = 0.35; mX = 0; mZ = -0.3; circleY = false; mXDown = true}
				else if (random <= 5/6) {blck = blck.offset(0, 0, 1); yPos = 0.25; zPos = 0.4; mY = -0.3; mZ = 0; circleX = false; mZDown=true}
				else {blck = blck.offset(0, 0, -1); yPos = 0.25; zPos = 0.6; mY = -0.3; mZ = 0; circleX = false}

				spell.setPosition((blck.getX() + xPos), (blck.getY() + yPos), (blck.getZ() + zPos));
				spell.mergeNbt('{pierce: 600}') //otherwise the client doesnt properly get updated on the new position of the spell
				spell.addTag("orbit");
				// port: 1.18's entity.nbt was the persistent data; in KubeJS 6 entity.nbt is a copy of the full NBT
				let pd = spell.persistentData
				pd.putBoolean("circleX", circleX);
				pd.putBoolean("circleY", circleY);
				pd.putBoolean("circleZ", circleZ);
				pd.putDouble("mX", mX);
				pd.putDouble("mY", mY);
				pd.putDouble("mZ", mZ);
				pd.putBoolean("mXDown", mXDown);
				pd.putBoolean("mYDown", mYDown);
				pd.putBoolean("mZDown", mZDown);
				spell.hurtMarked = true
				pd.putDouble("delay", 0)
			}
	})
	entitiesOfType(event.level, 'ars_nouveau:spell_proj').forEach(spell => {
		if (spell.getTags().contains("orbit")){
			let pd = spell.persistentData
			pd.putDouble("delay", pd.getDouble("delay")+1)
			if (pd.getDouble("delay") >= delay) {
				pd.putDouble("delay", 0)
				//X
				if (pd.getBoolean("circleX")){
					if (pd.getBoolean("mXDown")) {pd.putDouble("mX", pd.getDouble("mX") - addition)}
					else {pd.putDouble("mX", pd.getDouble("mX") + addition)}
					if (pd.getDouble("mX") >= endpoint) {pd.putBoolean("mXDown", true)}
					else if (pd.getDouble("mX") <= -endpoint) {pd.putBoolean("mXDown", false)}
				}
				//Y
				if (pd.getBoolean("circleY")){
					if (pd.getBoolean("mYDown")) {pd.putDouble("mY", pd.getDouble("mY") - addition)}
					else {pd.putDouble("mY", pd.getDouble("mY") + addition)}
					if (pd.getDouble("mY") >= endpoint) {pd.putBoolean("mYDown", true)}
					else if (pd.getDouble("mY") <= -endpoint) {pd.putBoolean("mYDown", false)}
				}
				//Z
				if (pd.getBoolean("circleZ")){
					if (pd.getBoolean("mZDown")) {pd.putDouble("mZ", pd.getDouble("mZ") - addition)}
					else {pd.putDouble("mZ", pd.getDouble("mZ") + addition)}
					if (pd.getDouble("mZ") >= endpoint) {pd.putBoolean("mZDown", true)}
					else if (pd.getDouble("mZ") <= -endpoint) {pd.putBoolean("mZDown", false)}
				}
				spell.setMotion(pd.getDouble("mX"), pd.getDouble("mY"), pd.getDouble("mZ"))
				//event.server.tell("§rmX:§3  " + pd.getDouble("mX") + "  §rmY:§3  " + pd.getDouble("mY") + "  §rmZ:§3  " + pd.getDouble("mZ"))
				spell.hurtMarked = true
			}

		}
	})
})
