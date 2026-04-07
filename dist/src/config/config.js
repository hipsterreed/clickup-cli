import Conf from 'conf';
const store = new Conf({
    projectName: 'clickup-cli',
    schema: {
        apiToken: { type: 'string' },
        teamId: { type: 'string' },
        userId: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string' },
    },
});
export function getConfig() {
    return store.store;
}
export function setConfig(data) {
    for (const [key, value] of Object.entries(data)) {
        store.set(key, value);
    }
}
export function isConfigured() {
    return store.has('apiToken') && store.has('teamId');
}
export function clearConfig() {
    store.clear();
}
export function getConfigPath() {
    return store.path;
}
