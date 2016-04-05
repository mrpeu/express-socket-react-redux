
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';

const ChatMessage = ( { client, onSendClick } ) =>
  <form className="chat-form" id="chat-form" action="">
    <div className="icon-left-pad"
      role={ client.role } style={{ backgroundColor: client.color }}
    />
    <input className="chat-entry" autoComplete="off" autoFocus />
    <button className="chat-send" onSubmit={ onSendClick }>Send</button>
  </form>
;

ChatMessage.propTypes = {
  client: PropTypes.object.isRequired,
  onSendClick: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onSendClick: e => dispatch( Actions.sendMessage( e.target.value ) )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ChatMessage );
