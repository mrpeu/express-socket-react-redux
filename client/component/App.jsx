
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientList from './ClientList.jsx';

const AppContent = ( { value, onIncreaseClick, clients } ) =>
  <div>
    <h3>active clients: { clients.length }</h3>
    <ClientList clients={ clients } />
    <div style={{ borderBottom: '1px #ddd solid' }}>
      <h3>counter</h3>
      <span>{ value }</span>
      <button onClick = { onIncreaseClick } >Increase</button>
    </div>
  </div>
;

AppContent.propTypes = {
  value: PropTypes.number.isRequired,
  onIncreaseClick: PropTypes.func.isRequired,
  clients: PropTypes.array.isRequired
};

// Map Redux state to component props
function mapStateToProps( state ) {
  return {
    value: state.count,
    clients: state.clients
  };
}

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onIncreaseClick: () => dispatch( Actions.dummyIncreaseCount() )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( AppContent );
