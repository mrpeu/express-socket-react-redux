
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientCard from './ClientCard.jsx';

const ClientCardList = ( { clients, startClientAction } ) => {
  const runners = clients.filter( c => c.role === 'runner' );
  return runners.length > 0 ? (
    <ul className="client-card-list">
      {runners.map( c =>
        <ClientCard
          key={c.cid}
          client={c}
          startAction={( caction ) => startClientAction( c.cid, caction )}
        />
      )}
    </ul>
  ) : (
    <h1 className="subtle" style={{ margin: 'auto' }}>
      Add runners to this network to see them listed here
    </h1>
  );
};

ClientCardList.propTypes = {
  clients: PropTypes.array.isRequired,
  startClientAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  startClientAction: ( cid, caction ) =>
    dispatch( Actions.startClientAction( cid, caction ) )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientCardList );
