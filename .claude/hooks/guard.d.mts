/** The reason a command must not run, or null. `dirty`: the working tree has uncommitted work. */
export function blockReason(command: string, options?: { dirty?: boolean }): string | null;
/** The files a command would put into a commit (`git` runs a git command and returns stdout). */
export function commitCandidates(command: string, git: (args: string[]) => string): string[];
/** Why the secret gate stops this command, or null. */
export function secretReason(command: string, cwd: string): Promise<string | null>;
