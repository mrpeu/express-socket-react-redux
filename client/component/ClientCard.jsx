
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientTitle from './ClientTitle.jsx';

const ClientCard = ( { data } ) =>
  <div className="client-card" role={ data.role }>
    <ClientTitle data={ data } />
    <pre>{ JSON.stringify( data, 0, 2 ) }</pre>
    <div>
      { data.runs.map( r => (
          <div key={ r.id }>{ r.id }</div>
      ) ) }
    </div>
  </div>
;

ClientCard.propTypes = {
  data: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;
// const mapStateToProps = ( state ) => {
//   console.warn( state );
//   return state;
// };

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {
  onIncreaseClick: () => dispatch( Actions.dummyIncreaseCount() )
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientCard );
