/** The reason a command must not run, or null. `dirty`: the working tree has uncommitted work. */
export function blockReason(command: string, options?: { dirty?: boolean }): string | null;
