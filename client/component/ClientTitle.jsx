
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';


const ClientTitle = ( { client } ) =>
  <div
    className="client-title"
    role={ client.role }
  >
    <div
      className="icon-left-pad"
      role={ client.role }
      style={{ backgroundColor: client.color }}
    />
    <span className="name">{ client.name }</span>
  </div>
;

ClientTitle.propTypes = {
  client: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( {} );
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
)( ClientTitle );
