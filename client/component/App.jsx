
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitleList from './ClientTitleList.jsx';
import ClientCardList from './ClientCardList.jsx';
import Chat from './Chat.jsx';
import { OverlayTrigger, Popover } from 'react-bootstrap';

const AppMain = ( { value, editClientAction, client, clients, chat } ) =>
  <div id="app">
    <header id="header">
      {/* <ClientTitleList /> */}
    </header>

    <div id="content">
      <ClientCardList editClientAction={ editClientAction } />
    </div>

    <pre style={{ color: 'green' }}>
    //todo:
    <br /><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    fix: on connection of runner, the web ui has to be restarted to be able
    <br />to start an action of this runner
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    enh: develop runner's action documentation.
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    add: develop runner's action configuration.
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    add: use Lokijs ( http://lokijs.org/#/docs ) as DB.
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    add: add some kind of Router.
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    add: develop a runner for ESP8266.
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    add: add historic of activity durations.
    <br /></div><div><input type="checkbox" checked="" disabled
      style={{ verticalAlign: 'sub', marginRight: '.5em' }}
    />
    add: develop a workflow system.
    <br /></div></pre>

    <Chat client={ client } />
  </div>
;

AppMain.propTypes = {
  value: PropTypes.number.isRequired,
  editClientAction: PropTypes.func.isRequired,
  client: PropTypes.object.isRequired,
  clients: PropTypes.array.isRequired,
  chat: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = ( state ) => ( {
  value: state.count,
  client: state.client,
  clients: state.clients,
  chat: state.chat
} );
// const mapStateToProps = ( state ) => {
//   console.warn( state );
//   return state;
// };

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onIncreaseClick: () => dispatch( Actions.dummyIncreaseCount() )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( AppMain );
