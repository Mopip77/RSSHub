function normalizeDomain(domain) {
    return String(domain || '').replace(/^@/, '');
}

function buildResolveLink(domain, text) {
    const d = normalizeDomain(domain);
    const t = String(text || '');
    return `tg://resolve?domain=${encodeURIComponent(d)}&text=${encodeURIComponent(t)}`;
}

function buildBotCommandText(command, args) {
    const cmd = String(command || '').startsWith('/') ? String(command || '') : `/${command}`;
    const a = args === undefined || args === null ? '' : String(args);
    return a ? `${cmd} ${a}` : cmd;
}

function buildBotCommandLink(domain, command, args) {
    return buildResolveLink(domain, buildBotCommandText(command, args));
}

// https link for clients/readers that block tg:// scheme.
function buildBotHttpLink(domain, text) {
    const d = normalizeDomain(domain);
    const t = String(text || '');
    return `https://t.me/${encodeURIComponent(d)}?text=${encodeURIComponent(t)}`;
}

function buildBotCommandHttpLink(domain, command, args) {
    return buildBotHttpLink(domain, buildBotCommandText(command, args));
}

// Single-arg helper for common "search resource" use-case.
function buildResourceSearchLink(query) {
    return buildBotCommandLink('kejiqubot', '/sq', query);
}

function buildResourceSearchHttpLink(query) {
    return buildBotCommandHttpLink('kejiqubot', '/sq', query);
}

module.exports = {
    buildResolveLink,
    buildBotCommandLink,
    buildBotHttpLink,
    buildBotCommandHttpLink,
    buildResourceSearchLink,
    buildResourceSearchHttpLink,
};
