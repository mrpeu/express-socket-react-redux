
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitle from './ClientTitle.jsx';

const ClientTitleList = ( { clients } ) =>
  <ul className="client-title-list">
    { clients.map( c =>
      <li key={ c.cid }>
        <ClientTitle client={ c } />
      </li>
    ) }
  </ul>
;

ClientTitleList.propTypes = {
  clients: PropTypes.array.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( { clients: state.clients } );
// const mapStateToProps = ( state ) => {
//   console.warn( state );
//   return state;
// };

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientTitleList );
