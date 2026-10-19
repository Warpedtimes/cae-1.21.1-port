ServerEvents.recipes(event => {
	function PCBMadness(A,B,C,D){
		event.recipes.create.sequenced_assembly([
			"2x " + D,
		], B, [
			event.recipes.create.deploying(B, [B, A]),
			event.recipes.create.deploying(B, [B, C]),
		]).transitionalItem(B).loops(1)
	}
	PCBMadness('kubejs:damaged_a','kubejs:damaged_b','kubejs:damaged_c','kubejs:b')
	PCBMadness('kubejs:damaged_b','kubejs:damaged_c','kubejs:damaged_d','kubejs:c')
	PCBMadness('kubejs:damaged_c','kubejs:damaged_d','kubejs:damaged_e','kubejs:d')
	PCBMadness('kubejs:damaged_d','kubejs:damaged_e','kubejs:damaged_f','kubejs:e')
	PCBMadness('kubejs:damaged_e','kubejs:damaged_f','kubejs:damaged_g','kubejs:f')
	PCBMadness('kubejs:damaged_f','kubejs:damaged_g','kubejs:damaged_a','kubejs:g')
	PCBMadness('kubejs:damaged_g','kubejs:damaged_a','kubejs:damaged_b','kubejs:a')
	  event.recipes.create.mechanical_crafting('kubejs:finalpcb', [
        'AAAAAAA',
		'BBBBBBB',
		'CCCCCCC',
		'DDDDDDD',
		'EEEEEEE',
		'FFFFFFF',
		'GGGGGGG'
      ], {
        A: 'kubejs:a',
		B: 'kubejs:b',
		C: 'kubejs:c',
		D: 'kubejs:d',
		E: 'kubejs:e',
		F: 'kubejs:f',
		G: 'kubejs:g'
      })
	let c = 0.15	;
	event.recipes.create.crushing([
		// port (1.21.1): ItemStack.withChance() throws on 1.21; CreateItem.of(stack, chance) is KubeJS Create's replacement
		CreateItem.of('kubejs:damaged_a',c),
		CreateItem.of('kubejs:damaged_b',c),
		CreateItem.of('kubejs:damaged_c',c),
		CreateItem.of('kubejs:damaged_d',c),
		CreateItem.of('kubejs:damaged_e',c),
		CreateItem.of('kubejs:damaged_f',c),
		CreateItem.of('kubejs:damaged_g',c),
	],'pneumaticcraft:printed_circuit_board')
})
