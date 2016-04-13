
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitle from './ClientTitle.jsx';
import RunStatus from './RunStatus.jsx';
import ClientActionList from './ClientActionList.jsx';

const ClientCard = ( { client, clients } ) =>
  <div className="client-card" role={ client.role }>
    <ClientTitle client={ client }>
      { /* TODO */ }
      <span className="subTitle">
        {`Running since ${new Date( client.ts ).toLocaleString()}`}
      </span>
    </ClientTitle>
    <div className="content">
      <ClientActionList data={ client.actions } />
      { client.status ? <RunStatus data={client.status} /> : null }
    </div>
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
