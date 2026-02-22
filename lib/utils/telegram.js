function buildResolveLink(domain, text) {
    const d = String(domain || '').replace(/^@/, '');
    const t = String(text || '');
    return `tg://resolve?domain=${encodeURIComponent(d)}&text=${encodeURIComponent(t)}`;
}

function buildBotCommandLink(domain, command, args) {
    const cmd = String(command || '').startsWith('/') ? String(command || '') : `/${command}`;
    const a = args === undefined || args === null ? '' : String(args);
    const text = a ? `${cmd} ${a}` : cmd;
    return buildResolveLink(domain, text);
}

module.exports = {
    buildResolveLink,
    buildBotCommandLink,
};
