export const Types = {
  authenticateClient: 'authenticateClient',
  connectClient: 'connectClient',
  disconnectClient: 'disconnectClient',
  startClientAction: 'startClientAction',
  refuseClient: 'refuseClient',
  markClientAlive: 'markClientAlive',
  receiveRunStatus: 'receiveRunStatus',

  receiveMessage: 'receiveMessage',
  addMessage: 'addMessage',

  cleanState: 'cleanState'
};

const noop = () => {};

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

export function startClientAction( socket, clientAction, cb ) {
  return { type: Types.startClientAction, socket, clientAction, cb };
}

export function receiveRunStatus( socket, client, data, cb ) {
  return { type: Types.receiveRunStatus, socket, client, data, cb };
}

/* messages */
export function receiveMessage( socket, client, data, cb ) {
  return { type: Types.receiveMessage, socket, client, data,
    cb: cb || noop };
}

export function addMessage( from, data ) {
  return { type: Types.addMessage, from, data };
}


export function cleanState() {
  return { type: Types.cleanState };
}
