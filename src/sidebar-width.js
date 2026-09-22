/** One shared width for the Chat and Graph sidebars, so switching modes never moves the edge. */
const followers = new Map();
let latest = null;

export function shareSidebarWidth(source, width) {
  latest = { source, width };
  for (const [owner, apply] of followers) if (owner !== source) apply(width);
}

export function followSidebarWidth(source, apply) {
  followers.set(source, apply);
  if (latest && latest.source !== source) apply(latest.width);
}
