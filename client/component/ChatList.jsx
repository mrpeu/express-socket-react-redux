
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ChatMessage from './ChatMessage.jsx';

const ChatList = ( { chat } ) =>
  <ul className = "chat-list" style = {{ borderBottom: '1px #ddd solid' }}>
    { chat.messages.map( m =>
      <li key = {`${m.t}#${m.cid}`}>
        <ChatMessage message={ m } />
      </li>
    ) }
  </ul>
;

ChatList.propTypes = {
  chat: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ChatList );
