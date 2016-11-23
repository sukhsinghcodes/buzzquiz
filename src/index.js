(function() {

function QuestionObj(id, questionText, choices) {
	this.id = id;
	this.questionText = questionText;
	this.choices = choices;
	this.status = 'unanswered';
	this.selectedAnswer = -1;
	this.correctAnswer = -1;
}

var QuestionStore = [];
var correctAnswersCount = 0;
var wrongAnswersCount = 0;

var React = require('react');
var ReactDOM = require('react-dom');

var BuzzQuizApp = React.createClass({
	getInitialState: function() {
		return {
			questions: [], 
			selectedQuestion: -1, 
			correctAnswers: correctAnswersCount, 
			wrongAnswers: wrongAnswersCount,
			errorMessage: '',
			showQuestion: false
		};
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
				try {
					data.forEach(function(obj, i) {
						QuestionStore.push(new QuestionObj(obj.id, obj.questionText, obj.choices));
					});
					this.setState({questions: QuestionStore, errorMessage: ''});
				} catch(err) {
					this.setState({errorMessage: err.toString()});
				}
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
				this.setState({errorMessage: err.toString()});
			}.bind(this)
		});
	},
	handleQuestionSelect: function(questionId) {
		this.setState({selectedQuestion: questionId, showQuestion: true});
	},
	handleQuestionSubmit: function(questionId, selectedAnswer) {
		if (selectedAnswer && selectedAnswer > 0) {
			$.ajax({
				url: 'answers.json',
				success: function(res) {
					if(res && res != null || res != undefined) {
						try {
							var answers = JSON.parse(res);
							var result = 'wrong', correctAnswer = -1;
							for (var i = 0, len = answers.length; i < len; i++) {
								if(answers[i].id === questionId) {
									correctAnswer = parseInt(answers[i].answer);
									console.log(correctAnswer + ' = ' + selectedAnswer);
									if (correctAnswer === parseInt(selectedAnswer)) {
										result = 'correct';
									console.log(result);
									}
									break;
								}
							}
							for(var i = 0, len = QuestionStore.length; i < len; i++) {
								if (QuestionStore[i].id === questionId) {
									QuestionStore[i].status = result;
									QuestionStore[i].correctAnswer = correctAnswer;
									QuestionStore[i].selectedAnswer = selectedAnswer;
									result === 'correct' ? correctAnswersCount++ : wrongAnswersCount++;
									this.setState({
										questions: QuestionStore, 
										correctAnswers: correctAnswersCount, 
										wrongAnswers: wrongAnswersCount,
										errorMessage: ''
									});
									break;
								}
							}
						} catch (err) {
							this.setState({errorMessage: err.toString()});
						}
					}
				}.bind(this),
				error: function(xhr, status, err) {
					console.error('Error mocking answer check', status, err.toString());
					this.setState({errorMessage: err.toString()});
				}.bind(this)
			});

		}

	},
	handleNavClick: function(direction) {
		var d = parseInt(direction);
		var newSelectedQuestion = this.state.selectedQuestion;
		if (d > 0 && newSelectedQuestion < this.state.questions.length) {
			newSelectedQuestion++;
		} else if (d < 0 && newSelectedQuestion > 1) {
			newSelectedQuestion--;
		}
		if (newSelectedQuestion !== this.state.selectedQuestion) this.setState({selectedQuestion: newSelectedQuestion});
	},
	handleGridClick: function() {
		this.setState({showQuestion: false});
	},
	render: function() {
		var questionNodes = this.state.questions.map(function(question, i) {
			if (question.id == this.state.selectedQuestion) {
				return (
					<Question number={i+1} data={question} key={question.id} submitCallback={this.handleQuestionSubmit} show={this.state.showQuestion} />
				);
			}
		}, this);
		var hideNext = (this.state.selectedQuestion === this.state.questions.length || this.state.selectedQuestion < 0) ? "hide":"show",
			hidePrev = (this.state.selectedQuestion === 1 || this.state.selectedQuestion < 0) ? "hide":"show",
			showNav = this.state.showQuestion ? "show":"hide";

		return (
			<div className="buzzQuizApp">
				<Summary total={this.state.questions.length} correctAnswers={this.state.correctAnswers} wrongAnswers={this.state.wrongAnswers} />
				<div className="container">
					<ErrorBlock message={this.state.errorMessage} />
					{questionNodes}
					<QuestionGrid data={this.state.questions} selectCallback={this.handleQuestionSelect} selectedQuestion={this.state.selectedQuestion} show={!this.state.showQuestion} />
				</div>
				<QuestionNav navCallback={this.handleNavClick} gridCallback={this.handleGridClick} hideNext={hideNext} hidePrev={hidePrev} show={showNav} />
			</div>
		);
	}
});

var Question = React.createClass({
	handleSubmit: function(e) {
		e.preventDefault();
		var selected = $(e.currentTarget).find("input[type='radio']:checked");
		this.props.submitCallback(this.props.data.id, selected.val());
	},
	render: function() {
		var cssClasses = "";
		var choices = this.props.data.choices.map(function(choice) {
			cssClasses = (this.props.data.selectedAnswer == choice.id) + " " + (this.props.data.correctAnswer == choice.id ? "text-success" : "");
			return (
				<li key={choice.id} className={cssClasses}>
	        		<label><input type="radio" name="choice" value={choice.id} disabled={this.props.data.status !== 'unanswered'} /> {choice.text}</label>
        		</li>
			);
		}, this);
		var showQuestionCssClass = this.props.show ? "show" : "hide";
		return(
			<div className={"panel panel-default questionPanel " + showQuestionCssClass}>
				<div className="panel-body">
			      	<form className={"questionForm " + this.props.data.status} role="form" onSubmit={this.handleSubmit}>
			      		<input type="hidden" value={this.props.data.id} name="id" />
						<h4>{this.props.number + ". " + this.props.data.questionText}</h4>
						<ul>
							{choices}
						</ul>
				        <div className="row">
					        <div className="col-xs-12">
					        	<button type="submit" className="btn btn-success pull-right">Submit</button>
					        	<label className="result pull-right"><span className="glyphicon glyphicon-ok"></span><span className="glyphicon glyphicon-remove"></span> {this.props.data.status}</label>
					        </div>
				       	</div>
					</form>
				</div>
			</div>
		);
	}
});

var Summary = React.createClass({
	render: function() {
		return (
			<div className="summary">
				<div className="container">
					<div className="text-center">
						<div className="col-xs-4">
							<h3><span className="glyphicon glyphicon-th"></span> <strong>{this.props.total}</strong></h3>
						</div>
						<div className="col-xs-4">
							<h3><span className="glyphicon glyphicon-ok text-success"></span> <strong>{this.props.correctAnswers}</strong></h3>
						</div>
						<div className="col-xs-4">
							<h3><span className="glyphicon glyphicon-remove text-danger"></span> <strong>{this.props.wrongAnswers}</strong></h3>
						</div>
					</div>
				</div>
			</div>
		);
	}
});

var QuestionGrid = React.createClass({
	tileClick: function(e) {
		if ($(e.currentTarget).data('question')) this.props.selectCallback($(e.currentTarget).data('question'));
	},
	render: function() {
		var questionNodes = this.props.data.map(function(question, i) {
			var selectedCssClass = (question.id == this.props.selectedQuestion ? "selected" : "");
			return (
				<div key={question.id} className={"col-xs-4 col-sm-3 col-md-2 questionTile"}>
					<div className={question.status + " " + selectedCssClass} role="button" onClick={this.tileClick} data-question={question.id}>
						{i+1}
					</div>
				</div>
			);
		}, this);
		var showGridCssClass = this.props.show ? "show" : "hide";
		return (
			<div className={"row questionGrid " + showGridCssClass}>
				<div className="col-xs-12">
					<h3>Select a question</h3>
					{questionNodes}
				</div>
			</div>
		);
	}
});

var QuestionNav = React.createClass({
	navClick: function(e) {
		if ($(e.currentTarget).data('direction')) this.props.navCallback($(e.currentTarget).data('direction'));
	},
	gridClick: function(e) {
		this.props.gridCallback();
	},
	render: function() {
		return (
			<nav className={"navbar navbar-inverse navbar-fixed-bottom questionNav " + this.props.show}>
				<div className="container">
					<div className="col-xs-4">
						<button type="button" className={"btn btn-primary btn-lg navbar-btn pull-left " + this.props.hidePrev} data-direction="-1" onClick={this.navClick}><span className="glyphicon glyphicon-chevron-left"></span></button>
					</div>
					<div className="col-xs-4">
						<button type="button" className="btn btn-primary btn-lg navbar-btn center-block" onClick={this.gridClick}><span className="glyphicon glyphicon-th"></span></button>
					</div>
					<div className="col-xs-4">
						<button type="button" className={"btn btn-primary btn-lg navbar-btn pull-right " + this.props.hideNext} data-direction="1" onClick={this.navClick}><span className="glyphicon glyphicon-chevron-right"></span></button>
					</div>
				</div>
			</nav>
		);
	}
});

var ErrorBlock = React.createClass({
	render: function() {
		return (
			<div className="help-block text-danger">{this.props.message}</div>
		);
	}
});

ReactDOM.render(
	<BuzzQuizApp url="questions.json" />,
	document.getElementById('content')
);


})();