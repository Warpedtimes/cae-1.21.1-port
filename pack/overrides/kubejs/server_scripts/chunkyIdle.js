// 1211 (not in the original pack): pre-generate only while nobody is online. With players on, Chunky crawls (0.1
// chunks/s on the live server) and adds to the lag, while players exploring past the pre-generated area freeze the server
// generating chunks live. So Chunky pauses when someone joins and continues 5 s after the last player leaves, or 30 s
// after the server starts empty (config/chunky continueOnRestart stays false). `chunky continue` only resumes saved,
// unfinished tasks: a cancelled one (the nether, a pack decision) stays cancelled; with none it does nothing.
PlayerEvents.loggedIn(event => {
    event.server.runCommandSilent('chunky pause')
})

PlayerEvents.loggedOut(event => {
    let server = event.server
    server.scheduleInTicks(100, () => {
        if (server.players.size() == 0) { server.runCommandSilent('chunky continue') }
    })
})

ServerEvents.loaded(event => {
    let server = event.server
    server.scheduleInTicks(600, () => {
        if (server.players.size() == 0) { server.runCommandSilent('chunky continue') }
    })
})
