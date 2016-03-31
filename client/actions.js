export const Types = {
  dummyIncreaseCount: 'dummyIncreaseCount',
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
export function cleanState() {
  return { type: Types.cleanState };
}

/* client */
export function authenticateSocketOnConnection( client ) {
  return { type: Types.authenticateSocketOnConnection, client };
}
export function notwelcome( msg ) {
  return { type: Types.notwelcome, msg };
}

export function welcome( msg ) {
  return { type: Types.welcome, msg };
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
