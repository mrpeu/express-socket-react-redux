
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';

const ChatForm = ( { client, onSendClick } ) =>
  <form className="chat-form" id="chat-form" action>
    <div className="icon-left-pad"
      role={ client.role } style={{ backgroundColor: client.color }}
    />
    <input className="chat-entry" autoComplete="off" autoFocus />
    <button className="chat-send" onClick={ onSendClick }>Send</button>
  </form>
;

ChatForm.propTypes = {
  client: PropTypes.object.isRequired,
  onSendClick: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( {} );

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onSendClick: e => {
    e.preventDefault();
    const entry = e.target.parentNode.querySelector( '.chat-entry' );
    return dispatch( Actions.sendMessage( entry.value, ( response ) => {
      if ( !response.err ) {
        entry.value = '';
      }
      entry.focus();
    } ) );
  }
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ChatForm );
