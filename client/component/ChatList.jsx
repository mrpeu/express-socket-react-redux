
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ChatMessage from './ChatMessage.jsx';

const ChatList = ( { messages } ) =>
// ( {
//   componentDidUpdate() {
//     const el = ReactDOM.findDOMNode( this );
//     el.scrollTop = el.scrollHeight;
//   },
//   render: () => (
    <ul className = "chat-list" style = {{ borderBottom: '1px #ddd solid' }}>
      { messages.map( m =>
        <li key = {`${m.t}#${m.cid}`}>
          <ChatMessage message={ m } />
        </li>
      ) }
    </ul>
//   )
// } )
;

ChatList.propTypes = {
  messages: PropTypes.array.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( { messages: state.chat.messages } );

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ChatList );
