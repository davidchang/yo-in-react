/** @jsx React.DOM */

var baseUrl = 'https://yo-in-react.firebaseio.com';

// USER DISPLAY COMPONENT (to display username)
var UserDisplay = React.createClass({
  render : function() {
    return (
      <section>
        <div className="panel panel-default">
          <div className="panel-heading">Username</div>
          <div className="panel-body">
            <strong>{this.props.user.name}</strong>
          </div>
        </div>
      </section>
    );
  }
});

// YO DISPLAY COMPONENT (to display yo count and received yos)
var YoDisplay = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount : function() {
    this.bindAsArray(new Firebase(baseUrl + '/users/' + this.props.name + '/notifications'), 'notifications');
  },
  getInitialState : function() {
    return {
      notifications : []
    };
  },
  render : function() {
    var notifications = '';
    if (this.state.notifications.length) {
      notifications = (
        <div className="panel panel-default">
          <div className="panel-heading">Yos</div>
          <div className="panel-body">
            <ul className="list-unstyled">{this.state.notifications.slice().reverse().map(function(notification) {
              var timestamp = new Date(notification.timestamp).toString();
              return <li>{notification.from} on {timestamp}</li>;
            })}</ul>
          </div>
        </div>
      );
    }
    return (
      <section>
        <div className="panel panel-default">
          <div className="panel-heading">Yo Count</div>
          <div className="panel-body">
            {this.props.user.yoCount || 0}
          </div>
        </div>

        {notifications}
      </section>
    );
  }
});

// PEOPLE TO YO COMPONENT (to display list of people you can yo)
var PeopleToYo = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount : function() {
    this.bindAsArray(new Firebase(baseUrl + '/users/' + this.props.name + '/yoList'), 'yoList');
  },
  getInitialState : function() {
    return {
      newPerson : '',
      yoList : [],
      showError : false
    };
  },
  _sendYo : function(personToYo) {
    var $this = this;
    var yoRecipient = new Firebase(baseUrl + '/users/' + personToYo);

    yoRecipient.once('value', function(data) {
      if (!data.val()) {
        return;
      }

      yoRecipient.child('yoCount').set((data.val().yoCount + 1) || 1);
      yoRecipient.child('notifications').push({
        from : $this.props.name,
        timestamp : new Date().getTime()
      });
    });
  },
  _handleChange : function(event) {
    this.setState({
      showError : false,
      newPerson : event.target.value
    });
  },
  _addPerson : function(e) {
    e.preventDefault();
    if (!this.state.newPerson.trim()) {
      return;
    }

    var $this = this;
    var newPersonRef = new Firebase(baseUrl + '/users/' + this.state.newPerson.trim());
    newPersonRef.once('value', function(data) {
      if (!data.val()) {
        $this.setState({
          showError : true
        });
        return;
      }

      $this.firebaseRefs['yoList'].push({
        name: $this.state.newPerson.trim()
      });

      $this.setState({
        showError : false,
        newPerson : ''
      });
    });

  },
  render : function() {
    var errorHtml = '';
    if (this.state.showError) {
      errorHtml = <div className="alert alert-danger" role="alert">That person does not exist!</div>;
    }

    var usersToYoHtml = '';
    if (this.state.yoList.length) {
      usersToYoHtml = (
        <div className="panel panel-default">
          <div className="panel-heading">Users To Yo</div>
          <div className="panel-body">
            <ul className="list-unstyled">{this.state.yoList.map(function(person) {
              return <li>{person.name} <button className="btn btn-primary" onClick={this._sendYo.bind(this, person.name)}>Yo</button></li>;
            }, this)}</ul>
          </div>
        </div>
      );
    }

    return (
      <section>
        {usersToYoHtml}

        <div className="panel panel-default">
          <div className="panel-heading">Add New User</div>
          <div className="panel-body">
            <form role="form">
              {errorHtml}
              <div className="form-group">
                <input type="text" className="form-control text-center" placeholder="Twitter Handle" value={this.state.newPerson} onChange={this._handleChange} />
              </div>

              <button type="submit" onClick={this._addPerson} className="btn btn-default">Add to Yo List</button>
            </form>
          </div>
        </div>

      </section>
    );
  }
});