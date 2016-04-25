
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientCard from './ClientCard.jsx';

const ClientCardList = ( { clients, startClientAction, editClientAction } ) =>
  <ul className="client-card-list">
    { clients.filter( c => c.role === 'runner' ).map( c =>
        <ClientCard key={ c.cid } client={ c }
          startAction={ ( caction ) => startClientAction( c.cid, caction ) }
        />
    ) }
  </ul>
;

ClientCardList.propTypes = {
  clients: PropTypes.array.isRequired,
  startClientAction: PropTypes.func.isRequired,
  editClientAction: PropTypes.func.isRequired
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
