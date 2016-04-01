export const Types = {
  authenticateClient: 'authenticateClient',
  connectClient: 'connectClient',
  disconnectClient: 'disconnectClient',
  refuseClient: 'refuseClient',
  markClientAlive: 'markClientAlive',
  receiveMessage: 'receiveMessage',
  addMessage: 'addMessage',
  cleanState: 'cleanState',
};

/* clients */
export function connectClient( socket, client ) {
  return { type: Types.connectClient, socket, client };
}

export function refuseClient( socket, client ) {
  return { type: Types.refuseClient, socket, client };
}

export function markClientAlive( client ) {
  return { type: Types.markClientAlive, client };
}
export function disconnectClient( socket, client ) {
  return { type: Types.disconnectClient, socket, client };
}

/* messages */
export function receiveMessage( socket, client, data, cb ) {
  return { type: Types.receiveMessage, socket, client, data, cb };
}

export function addMessage( from, data ) {
  return { type: Types.addMessage, from, data };
}


export function cleanState() {
  return { type: Types.cleanState };
}
