
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ChatMessage from './ChatMessage.jsx';

const ChatList = ( { messages } ) =>
  <ul className="chat-list" style={{ borderBottom: '1px #ddd solid' }}>
    { messages.map( m =>
      <li key={`${m.t}#${m.cid}`}>
        <ChatMessage
          name = {m.name}
          role = {m.role}
          color = {m.color}
          t = { m.t }
          data = { m.data }
        />
      </li>
    ) }
  </ul>
;

ChatList.propTypes = {
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
)( ChatList );
