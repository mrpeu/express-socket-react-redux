
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';

const ClientCardMini = ( { name, role, color } ) =>
  <div className="client-card-mini" role={ role } style={{ backgroundColor: color }}>
    <div className="left-pad"></div>
    <span className="name">{ name }</span>
  </div>
;

ClientCardMini.propTypes = {
  role: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired
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
)( ClientCardMini );
