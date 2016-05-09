function QuestionObj(id, questionText, choices) {
	this.id = id;
	this.questionText = questionText;
	this.choices = choices;
	this.status = 'unanswered';
	this.selectedAnswerId = -1;
}

var QuestionStore = [];

var React = require('react');
var ReactDOM = require('react-dom');

var BuzzQuizApp = React.createClass({
	getInitialState: function() {
		return {data: [], selectedQuestion: {}};
	},
    componentDidMount: function() {
      this.loadQuestionsFromServer();
    },
	loadQuestionsFromServer: function() {
		$.ajax({
			url: this.props.url,
			dataType: 'json',
			cache:false,
			success: function(data) {
				data.forEach(function(obj, i) {
					QuestionStore.push(new QuestionObj(obj.id, obj.questionText, obj.choices));
				});
				console.log(QuestionStore);
				this.setState({data: QuestionStore});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	handleQuestionSelect: function(qId) {
		var q = null;
		var len = this.state.data.length;
		for (var i=1; i <= len; i++) {
			if (qId === i) {
				q = this.state.data[i-1];
				break;
			}
		}
		this.setState({selectedQuestion: q});
	},
	render: function() {
		return (
		<div className="buzzQuizApp">
			<QuestionGrid data={this.state.data} onQuestionSelect={this.handleQuestionSelect} />
			<Question question={this.state.selectedQuestion} />
		</div>
		);
	}
});

var QuestionTile = React.createClass({
	getInitialState: function() {
		return {status: 'unanswered'};
	},
	handleTileClick: function(e) {
		e.preventDefault();
		this.props.onTileClick(this.props.number);
	},
	render: function() {
		return (
			<div className="col-sm-6 col-md-4">
				<div className={"questionTile " + this.state.status} role="button" data-toggle="modal" data-target="#questionModal" onClick={this.handleTileClick}>
					{this.props.number}
				</div>
			</div>
		);
	}
});
var QuestionGrid = React.createClass({
	handleQuestionSelect: function(qId) {
		this.props.onQuestionSelect(qId);
	},
	render: function() {
		var questionNodes = this.props.data.map(function(question) {
			return (
				<QuestionTile number={question.id} key={question.id} onTileClick={this.handleQuestionSelect} />
			);
		}, this);
		return (
			<div className="row questionGrid">
				{questionNodes}
			</div>
		);
	}
});
var Question = React.createClass({
	render: function() {
		return (
			<div className="modal" id="questionModal" tabindex="-1" role="dialog" aria-labelledby="questionModalLabel">
			  <div className="modal-dialog" role="document">
			    <div className="modal-content">
					<QuestionHeader />
					<div className="modal-body">
						<QuestionForm question={this.props.question} />
					</div>
					<QuestionFooter />
			    </div>
			  </div>
			</div>

		);
	}
});
var QuestionChoice = React.createClass({
    getInitialState: function() {
      return {selected: false};
    },
    AnswerClick: function(e) {
    	console.log(e.target.value);
    	this.props.handleAnswerClick(e);
    	this.setState({selected: !this.state.selected});
    },
    render: function() {
    	return (
        	<li>
        		<label>
	        		<input type="radio" name="choice" value={this.props.choice.id} onClick={this.AnswerClick} /> {this.props.choice.text}
        		</label>
        	</li>
    	);
    }
});
var QuestionForm = React.createClass({
    getInitialState: function() {
      return {selectedAnswer: '', questionId: -1};
    },
    handleAnswerClick: function(e) {
      this.setState({selectedAnswer: e.target.value});
    },
    handleSubmit: function(e) {
    	e.preventDefault();
		if (this.state.selectedAnswer) {
	      	console.log(this.state.selectedAnswer);
			$.ajax({
				url: 'checkanswer.php',
				data: {'id':this.id, 'answerId':this.state.selectedAnswer},
				type: 'post',
				success: function(res) {

				},
				error: function(xhr, status, err) {
					console.error('checkanswer.php', status, err.toString());
				}
			});

		}
    },
	componentWillReceiveProps: function(newProps) {
	  if (newProps.question.id != this.state.questionId) {
	    this.setState({questionId: newProps.question.id});
	    this.setState({selectedAnswer: ''});
	  }
	},
	render: function() {
		if (this.props.question.choices) {
			var choiceNodes = this.props.question.choices.map(function(choice) {
				return (
		        	<QuestionChoice key={this.props.question.id+"-"+choice.id} choice={choice} handleAnswerClick={this.handleAnswerClick} />
				);
			}, this);
		}
		return (
	      	<form className="questionForm" role="form" onSubmit={this.handleSubmit}>
		        <p>{this.props.question.questionText}</p>
	            <ul>
	            	{choiceNodes}
		        </ul>
		        <div className="row">
			        <div className="col-xs-12">
				        <button type="submit" className="btn btn-success btn-lg btn-block pull-right">Submit</button>
				    </div>
			    </div>
	      	</form>
		);
	}
});
var QuestionHeader = React.createClass({
	render: function() {
		return (
	      <div className="modal-header">
	        <button className="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
	        <h4 className="modal-title" id="questionModalLabel">Question X of Y</h4>
	      </div>
		);
	}
});
var QuestionFooter = React.createClass({
	render: function() {
		return (
	      <div className="modal-footer">
	      	<button type="button" className="btn btn-default pull-left">Prev</button>
	      	<button type="button" className="btn btn-default pull-right">Next</button>
	      </div>
		);
	}
});


ReactDOM.render(
	<BuzzQuizApp url="questions.json" />,
	document.getElementById('content')
);


