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
		return {questions: [], selectedQuestion: {}, correctAnswers: correctAnswersCount, wrongAnswers: wrongAnswersCount};
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
	render: function() {
		var questionNodes = this.state.questions.map(function(question, i) {
			return (
				<Question data={question} key={question.id} submitCallback={this.handleQuestionSubmit} />
			);
		}, this);
		return (
			<div className="buzzQuizApp">
				<Summary total={this.state.questions.length} correctAnswers={this.state.correctAnswers} wrongAnswers={this.state.wrongAnswers} />
				<ol className="list-group">
					{questionNodes}
				</ol>
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
		var choices = this.props.data.choices.map(function(choice) {
			var cssClasses = (this.props.data.selectedAnswer == choice.id) + " " + (this.props.data.correctAnswer == choice.id ? "text-success" : "");
			return (
				<li key={choice.id} className={cssClasses}>
	        		<label><input type="radio" name="choice" value={choice.id} disabled={this.props.data.status !== 'unanswered'} /> {choice.text}</label>
        		</li>
			);
		}, this);
		return(
			<li className="list-group-item">
		      	<form className={"questionForm " + this.props.data.status} role="form" onSubmit={this.handleSubmit}>
		      		<input type="hidden" value={this.props.data.id} name="id" />
					<h4>{this.props.data.questionText}</h4>
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
			</li>
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
							<h3>Correct: <strong><span className="text-success">{this.props.correctAnswers}</span></strong></h3>
						</div>
						<div className="col-sm-3">
							<h3>Wrong: <strong><span className="text-danger">{this.props.wrongAnswers}</span></strong></h3>
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

ReactDOM.render(
	<BuzzQuizApp url="questions.json" />,
	document.getElementById('content')
);


})();