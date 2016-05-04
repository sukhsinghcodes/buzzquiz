var React = require('react');
var ReactDOM = require('react-dom');

var Question = React.createClass({
	render: function() {
		return (
			<div className="question">
				<h3>Hello World!</h3>
				<p>poo poo man head</p>
			</div>
		);
	}
});

ReactDOM.render(
  <Question />,
  document.getElementById('content')
);

