
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import ClientTitle from './ClientTitle.jsx';
import ClientActionList from './ClientActionList.jsx';

const ClientCard = ( { client, clients, startAction } ) =>
  <div className="client-card" role={ client.role } id={ client.cid }>
    <ClientTitle client={ client }>
      <div>cid: { client.cid }</div>
      <div>{`Running since ${new Date( client.ts ).toLocaleString()}`}</div>
    </ClientTitle>
    <div className="content">

    </div>
    <ClientActionList data={ client.actions } startAction={ startAction } />
  </div>
;

ClientCard.propTypes = {
  client: PropTypes.object.isRequired,
  clients: PropTypes.array,
  startAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( { clients: state.clients } );

// Connected Component:
export default connect(
  mapStateToProps
)( ClientCard );
