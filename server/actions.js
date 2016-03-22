const alltypes = [
  'authenticateClient',
  'connectClient',
  'refuseClient',
  'markClientAlive',
  'receiveMessage',
  'addMessage',
  'cleanState',
];

export const Types = (_alltypes => {
  const _types = {};
  _alltypes.forEach(t => {
    _types[t] = t;
  });
  return _types;
})(alltypes);


export function authenticateClient(socket, client) {
  return { type: Types.authenticateClient, socket, client };
}

export function connectClient(socket, client, isNew) {
  return { type: Types.connectClient, socket, client, isNew };
}

export function refuseClient(socket, client) {
  return { type: Types.refuseClient, socket, client };
}

export function markClientAlive(client) {
  return { type: Types.markClientAlive, client };
}

export function receiveMessage(...args) {
  return { type: Types.receiveMessage, ...args };
}

export function addMessage(...args) {
  return { type: Types.addMessage, ...args };
}

export function cleanState(state) {
  return { type: Types.cleanState, state };
}
