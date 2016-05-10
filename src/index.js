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
		return {questions: [], selectedQuestion: -1, correctAnswers: correctAnswersCount, wrongAnswers: wrongAnswersCount};
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
				this.setState({questions: QuestionStore});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	handleQuestionSelect: function(questionId) {
		this.setState({selectedQuestion: questionId});
	},
	handleQuestionSubmit: function(questionId, selectedAnswer) {
		if (selectedAnswer && selectedAnswer > 0) {
			$.ajax({
				url: 'checkanswer.php',
				data: {questionId:questionId, answerId:selectedAnswer},
				type: 'post',
				success: function(res) {
					if(res && res != null || res != undefined) {
						var response = JSON.parse(res);
						for(var i=0, len = QuestionStore.length; i < len; i++) {
							if (QuestionStore[i].id === questionId) {
								QuestionStore[i].status = response.result;
								QuestionStore[i].correctAnswer = response.correctAnswer;
								QuestionStore[i].selectedAnswer = selectedAnswer;
								response.result === 'correct' ? correctAnswersCount++ : wrongAnswersCount++;
								this.setState({questions: QuestionStore, correctAnswers: correctAnswersCount, wrongAnswers: wrongAnswersCount});
								break;
							}
						}
					}
				}.bind(this),
				error: function(xhr, status, err) {
					console.error('checkanswer.php', status, err.toString());
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
		if (newSelectedQuestion !== this.state.selectedQuestion) this.handleQuestionSelect(newSelectedQuestion);
	},
	render: function() {
		var questionNodes = this.state.questions.map(function(question, i) {
			if (question.id == this.state.selectedQuestion) {
				return (
					<Question number={i+1} data={question} key={question.id} submitCallback={this.handleQuestionSubmit} />
				);
			}
		}, this);
		var hideNext = (this.state.selectedQuestion === this.state.questions.length || this.state.selectedQuestion < 0) ? "hide":"show";
		var hidePrev = (this.state.selectedQuestion === 1 || this.state.selectedQuestion < 0) ? "hide":"show";
		return (
			<div className="buzzQuizApp">
				<Summary total={this.state.questions.length} correctAnswers={this.state.correctAnswers} wrongAnswers={this.state.wrongAnswers} />
				<h3>Select a question to begin</h3>
				<QuestionGrid data={this.state.questions} selectCallback={this.handleQuestionSelect} selectedQuestion={this.state.selectedQuestion} />
				{questionNodes}
				<QuestionNav navCallback={this.handleNavClick} hideNext={hideNext} hidePrev={hidePrev} />
			</div>
		);
	}
});

var Question = React.createClass({
	handleSubmit: function(e) {
		e.preventDefault();
		this.props.submitCallback(this.props.data.id, e.target.choice.value);
	},
	render: function() {
		var cssClasses = "";
		var checked = "";
		var choices = this.props.data.choices.map(function(choice) {
			cssClasses = (this.props.data.selectedAnswer == choice.id) + " " + (this.props.data.correctAnswer == choice.id ? "text-success" : "");
			return (
				<li key={choice.id} className={cssClasses}>
	        		<label><input type="radio" name="choice" value={choice.id} disabled={this.props.data.status !== 'unanswered'} /> {choice.text}</label>
        		</li>
			);
		}, this);
		return(
			<div className="panel panel-default">
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
			<div className="panel panel-default">
				<div className="panel-body">
					<h2>Summary</h2>
					<div className="text-center">
						<div className="col-sm-3">
							<h3>Total: <strong>{this.props.total}</strong></h3>
						</div>
						<div className="col-sm-3">
							<h3><span className="glyphicon glyphicon-ok text-success"></span> <strong>{this.props.correctAnswers}</strong></h3>
						</div>
						<div className="col-sm-3">
							<h3><span className="glyphicon glyphicon-remove text-danger"></span> <strong>{this.props.wrongAnswers}</strong></h3>
						</div>
						<div className="col-sm-3">
							<h3>Score: <strong>{((this.props.correctAnswers/this.props.total)*100).toFixed(0) + "%"}</strong></h3>
						</div>
					</div>
				</div>
			</div>
		);
	}
});

var QuestionGrid = React.createClass({
	tileClick: function(e) {
		if ($(e.target).data('question')) this.props.selectCallback($(e.target).data('question'));
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
		return (
			<div className="row questionGrid">
				<div className="col-xs-12">
					{questionNodes}
				</div>
			</div>
		);
	}
});

var QuestionNav = React.createClass({
	navClick: function(e) {
		if ($(e.target).data('direction')) this.props.navCallback($(e.target).data('direction'));
	},
	render: function() {
		return (
			<div className="row questionNav">
				<div className="col-xs-12">
					<button type="button" className={"btn btn-default pull-left " + this.props.hidePrev} data-direction="-1" onClick={this.navClick}>Prev</button>
					<button type="button" className={"btn btn-default pull-right " + this.props.hideNext} data-direction="1" onClick={this.navClick}>Next</button>
				</div>
			</div>
		);
	}
});

ReactDOM.render(
	<BuzzQuizApp url="questions.json" />,
	document.getElementById('content')
);


})();