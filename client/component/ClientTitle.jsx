
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';


const ClientTitle = ( { client, children } ) =>
  <div className="client-title" role={ client.role } >
    <div
      className="icon-left-pad"
      role={ client.role }
      style={{ backgroundColor: client.color }}
    />
    <div className="content">
      <div className="name">{ client.name }</div>
      <div className="subtle">{ children }</div>
    </div>
  </div>
;

ClientTitle.propTypes = {
  client: PropTypes.object.isRequired,
  children: PropTypes.oneOfType( [
    PropTypes.arrayOf( PropTypes.node ),
    PropTypes.node
  ] )
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
