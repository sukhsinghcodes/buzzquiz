<?php 
if (isset($_POST['questionId']) && isset($_POST['answerId'])) {
	$questionId = $_POST['questionId'];
	$answerId = $_POST['answerId'];
	$str = file_get_contents('answers.json');
	$json = json_decode($str, true);

	$result = 'wrong';

	foreach ($json as $key => $question) {
		if($question['id'] == $questionId && $question['answer'] == $answerId) {
			$result = 'correct';
			break;
		}
	}

	echo $result;
}
