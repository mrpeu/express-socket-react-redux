
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';

const ChatMessage = ( { name, role, color } ) =>
  <div className="chat-message" role={ role } style={{ backgroundColor: color }}>
    <div className="left-pad"></div>
    <span className="name">{ name }</span>
  </div>
;

ChatMessage.propTypes = {
  role: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired,
  t: PropTypes.number.isRequired
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
)( ChatMessage );
