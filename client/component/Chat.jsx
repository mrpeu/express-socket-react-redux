
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ChatList from './ChatList.jsx';
import ChatForm from './ChatForm.jsx';

const Chat = ( { client, chat, onToggleClick } ) =>
  <div className={ `chat${chat.on ? ' on' : ''}` }>
    <div className="switch" onClick={ onToggleClick }>💬</div>
    <ChatList messages={ chat.messages } />
    <ChatForm client={ client } />
  </div>
;

Chat.propTypes = {
  client: PropTypes.object.isRequired,
  chat: PropTypes.object.isRequired,
  onToggleClick: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( { chat: state.chat } );

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onToggleClick: () => dispatch( Actions.toggleChat() )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( Chat );
