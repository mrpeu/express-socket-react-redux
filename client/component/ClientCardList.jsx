
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientCard from './ClientCard.jsx';

const ClientCardList = ( { clients } ) =>
  <div>
    <ul className="client-card-list" style={{ borderBottom: '1px #ddd solid' }}>
      { clients.map( c =>
        <li key={c.cid}>
          <ClientCard data={ c } />
        </li>
      ) }
    </ul>
  </div>
;

ClientCardList.propTypes = {
  clients: PropTypes.array.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;
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
)( ClientCardList );
