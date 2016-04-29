
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import ClientAction from './ClientAction.jsx';
import { ListGroup } from 'react-bootstrap';

// <Markdown data={ act.doc } />

const ClientActionList = ( { data, status, startAction, editAction } ) =>
  <ListGroup className="action-list" accordion defaultActiveKey="1" >{
    data ?
      ( Array.isArray( data ) ? data : [ data ] )
      .map( ( act, i ) =>
        <ClientAction
          key={i}
          data={act}
          status={
            status && act.statusNames && act.statusNames.indexOf( status.name ) >= 0
            ? status
            : null
          }
          startAction={startAction}
          editAction={editAction}
        > {
          !act.id ?
            <div className="subtle" key={i}>
              ClientAction without id: <i>{act.name}</i>
            </div>
            :
            null
        } </ClientAction>
      )
    :
      'No action advertised'
  }
  </ListGroup>
;

ClientActionList.propTypes = {
  data: PropTypes.array.isRequired,
  status: PropTypes.object,
  startAction: PropTypes.func.isRequired,
  editAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Connected Component:
export default connect(
  mapStateToProps
)( ClientActionList );
