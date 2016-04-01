export const Types = {
  dummyIncreaseCount: 'dummyIncreaseCount',
  receiveState: 'receiveState',
  cleanState: 'cleanState',

  authenticateSocketOnConnection: 'authenticateSocketOnConnection',
  welcome: 'welcome',
  notwelcome: 'notwelcome',

  receiveMessage: 'receiveMessage',
  sendMessage: 'sendMessage'
};


/* app */
export function dummyIncreaseCount() {
  return { type: Types.dummyIncreaseCount };
}
export function receiveState( serverState ) {
  return { type: Types.receiveState, serverState };
}
export function cleanState() {
  return { type: Types.cleanState };
}

/* client */
export function authenticateSocketOnConnection( socket ) {
  return { type: Types.authenticateSocketOnConnection, socket };
}
export function notwelcome( data ) {
  return { type: Types.notwelcome, data };
}

export function welcome( data ) {
  return { type: Types.welcome, data };
}

/* clients */
export function updateClientList( clients ) {
  return { type: Types.update, clients };
}

/* messages */
export function receiveMessage( msg ) {
  return { type: Types.receiveMessage, msg };
}

export function sendMessage( msg ) {
  return { type: Types.sendMessage, msg };
}
