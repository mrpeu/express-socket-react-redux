
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitle from './ClientTitle.jsx';

const ClientCard = ( { client } ) =>
  <div className="client-card" role={ client.role }>
    <ClientTitle client={ client } />
    <pre>{ JSON.stringify( {
      ...client,
      status: !!client.status
    }, 0, 2 ) }</pre>
    { client.status ?
      <div className="status">
        { /* }<pre>{ JSON.stringify( {
          ...client.status,
          runs: client.status.runs ? client.status.runs.length : 0
        } ) }</pre> */ }
        <div className="run-status">
          {client.status.state}&nbsp;{client.status.total}&nbsp;{client.status.value}
          <div style={ { width: `${100 / client.status.total * client.status.value}%`,
            backgroundColor: '#57B' } }
          ></div>
        </div>
        { Array.isArray( client.status.runs ) ? client.status.runs.map( r => (
            <div key={ r.id } className="run-status"
              style={ { borderLeftWidth: 100 / r.total * r.value } }
            >
              {r.state}&nbsp;{r.total}&nbsp;{r.value}
            </div>
        ) ) : typeof( client.status.runs ) }
      </div>
      :
      null
    }
  </div>
;

ClientCard.propTypes = {
  client: PropTypes.object.isRequired
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
