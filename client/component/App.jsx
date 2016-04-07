
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitleList from './ClientTitleList.jsx';
import ClientCardList from './ClientCardList.jsx';
import Chat from './Chat.jsx';

const AppMain = ( { value, onIncreaseClick, client, clients, chat } ) =>
  <div>
    <div id="header">
      <ClientTitleList />
    </div>
      {/*
      <div style={{ borderBottom: '1px #ddd solid' }}>
        <h3>counter</h3>
        <span>{ value }</span>
        <button onClick={ onIncreaseClick } >Increase</button>
      </div>
      */}
    <div id="content">
      <ClientCardList />
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
