
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitleList from './ClientTitleList.jsx';
import ClientCardList from './ClientCardList.jsx';
import Chat from './Chat.jsx';
import { OverlayTrigger, Popover } from 'react-bootstrap';

const AppMain = ( { value, onIncreaseClick, client, clients, chat } ) =>
  <div id="app">
    <header id="header">
      {/* <ClientTitleList /> */}
    </header>

    <div id="content">
      <ClientCardList />

      <pre>
      //todo:
      - fix:  on connection of runner, the web ui has to be restarted to be able
      to start an action of this runner
      - enh:  develop runner's action documentation.
      - add:  develop runner's action configuration.
      - add:  use Lokijs ( http://lokijs.org/#/docs ) as DB.
      - add:  add some kind of Router.
      - add:  develop a runner for ESP8266.
      - add:  add historic of activity durations.
      </pre>
    </div>

    <Chat client={ client } />
  </div>
;

AppMain.propTypes = {
  value: PropTypes.number.isRequired,
  onIncreaseClick: PropTypes.func.isRequired,
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
