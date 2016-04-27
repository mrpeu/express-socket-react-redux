
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import { ButtonToolbar, ButtonGroup, Button, Glyphicon } from 'react-bootstrap';
import ClientAction from './ClientAction.jsx';

// <Markdown data={ act.doc } />

const ClientActionList = ( { data, startAction, editAction } ) =>
  <ul className="action-list">{ data
    ? ( Array.isArray( data ) ? data : [ data ] )
        .map( act => (
          !!act.id ?
            <ClientAction data={ act }
              startAction={ startAction } editAction={ editAction }
            /> :
            <div className="subtle">ClientAction without id: <i>{act.name}</i></div>
      ) )
    : 'No action advertised'
  }
  </ul>
;

ClientActionList.propTypes = {
  data: PropTypes.array.isRequired,
  startAction: PropTypes.func.isRequired,
  editAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Connected Component:
export default connect(
  mapStateToProps
)( ClientActionList );
