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
		return {questions: [], selectedQuestion: {}};
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
					console.log(res);
					if(res && res != null || res != undefined) {
						for(var i=0, len = QuestionStore.length; i < len; i++) {
							if (QuestionStore[i].id === questionId) {
								QuestionStore[i].status = res;
								QuestionStore[i].selectedAnswer = selectedAnswer;
								this.setState({questions: QuestionStore});
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
		var questionNodes = this.state.questions.map(function(question) {
			return (
				<Question data={question} key={question.id} submitCallback={this.handleQuestionSubmit} />
			);
		}, this);
		return (
			<div className="buzzQuizApp">
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
			return (
				<li key={choice.id}>
	        		<label><input type="radio" name="choice" value={choice.id} selected={this.props.data.selectedAnswerId === choice.id} disabled={this.props.data.status !== 'unanswered'} /> {choice.text}</label>
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
				        	
				        </div>
			       	</div>
				</form>
			</li>
		);
	}
});


ReactDOM.render(
	<BuzzQuizApp url="questions.json" />,
	document.getElementById('content')
);


