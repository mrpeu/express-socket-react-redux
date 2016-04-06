
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';


const ClientTitle = ( { data } ) =>
  <div className="client-title"
    role={ data.role }
  >
    <div className="icon-left-pad" role={ data.role } style={{ backgroundColor: data.color }}></div>
    <span className="name">{ data.name }</span>
  </div>
;

ClientTitle.propTypes = {
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
} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientTitle );
