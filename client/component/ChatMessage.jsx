
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitle from './ClientTitle.jsx';

const ChatMessage = ( { message } ) =>
  <div className="chat-message" title={ new Date( message.t ) }>
    <ClientTitle data={{ ...message }} />
    <span style={{ paddingTop: '.2em', flex: '0 1 auto' }}>:&nbsp;</span>
    <span className="chat-message-data">{ message.data.toString() }</span>
  </div>
;

ChatMessage.propTypes = {
  message: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onToggleClick: () => dispatch( Actions.toggleChat() )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ChatMessage );
