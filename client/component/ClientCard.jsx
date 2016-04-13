
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitle from './ClientTitle.jsx';

const ClientCard = ( { client, clients } ) =>
  <div className="client-card" role={ client.role }>
    <ClientTitle client={ client } />
    <pre>{ JSON.stringify( {
      ...client
    }, 0, 2 ) }</pre>
    { client.status ?
      <div className="status">
        <div className="run-status">
          {client.status.state}&nbsp;{client.status.total}&nbsp;{client.status.value}
          <div style={ { width: `${100 / client.status.total * client.status.value}%`,
            backgroundColor: '#57B' } }
          ></div>
        </div>
      </div>
      :
      null
    }
  </div>
;

ClientCard.propTypes = {
  client: PropTypes.object.isRequired,
  clients: PropTypes.array
};

// Map Redux state to component props
const mapStateToProps = state => ( { clients: state.clients } );

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientCard );
