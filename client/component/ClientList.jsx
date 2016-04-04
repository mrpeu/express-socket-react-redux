
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientCardMini from './ClientCardMini.jsx';

const ClientList = ( { clients } ) =>
  <ul className="client-list" style={{ borderBottom: '1px #ddd solid' }}>
    { clients.map( c =>
      <li key={c.cid}>
        <ClientCardMini name={c.name} role={c.role} color={c.color} />
      </li>
    ) }
  </ul>
;

ClientList.propTypes = {
  clients: PropTypes.array.isRequired
};

// Map Redux state to component props
function mapStateToProps( state ) {
  return state;
}

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onIncreaseClick: () => dispatch( Actions.dummyIncreaseCount() )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientList );
