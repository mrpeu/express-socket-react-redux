
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
// import * as Remarkable from 'remarkable';
const Remarkable = require( 'remarkable' );

const md = new Remarkable();

const Markdown = ( { data } ) =>
  <div className="markdown" dangerouslySetInnerHTML={ { __html: md.render( data ) } } />
;

Markdown.propTypes = {
  data: PropTypes.string.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( {} );

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( Markdown );
