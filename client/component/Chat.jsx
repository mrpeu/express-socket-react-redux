
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ChatList from './ChatList.jsx';
import ChatForm from './ChatForm.jsx';

const Chat = ( { client, messages } ) =>
  <Chat className="chat">
    <ChatList messages={ messages } />
    <ChatForm me={ client } />
  </Chat>
;

Chat.propTypes = {
  client: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired
};

// Map Redux state to component props
function mapStateToProps( state ) {
  return state;
}

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( Chat );
