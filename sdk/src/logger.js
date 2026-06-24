import debug from "debug";
const isDebugEnabled = typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    process.env.ILN_DEBUG === "1";
if (isDebugEnabled) {
    debug.log = console.debug?.bind(console) ?? console.log.bind(console);
    debug.enable("iln:sdk:*");
}
function createNoopDebugger() {
    return Object.assign(() => { }, { enabled: false });
}
export function createLogger(namespace) {
    return isDebugEnabled ? debug(`iln:sdk:${namespace}`) : createNoopDebugger();
}
