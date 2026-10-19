package com.caeport.cae.mixin;

import com.caeport.cae.compat.SafeWalk;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

import java.io.IOException;
import java.nio.file.FileVisitOption;
import java.nio.file.Path;
import java.util.stream.Stream;

/** FTB Backups' scan of the server folder, which aborted the backup when a save's temporary file vanished: see {@link SafeWalk}. */
@Pseudo
@Mixin(targets = "net.creeperhost.ftbbackups.BackupHandler", remap = false)
public abstract class FtbBackupsHandlerMixin {
    @Redirect(method = "lambda$createBackup$1", remap = false, require = 0,
            at = @At(value = "INVOKE", target = "Ljava/nio/file/Files;walk(Ljava/nio/file/Path;[Ljava/nio/file/FileVisitOption;)Ljava/util/stream/Stream;"))
    private static Stream<Path> cae$safeWalk(Path start, FileVisitOption[] options) throws IOException {
        return SafeWalk.walk(start);
    }
}
