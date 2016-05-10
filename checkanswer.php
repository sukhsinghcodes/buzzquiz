<?php 
if (isset($_POST['questionId']) && isset($_POST['answerId'])) {
	$questionId = $_POST['questionId'];
	$answerId = $_POST['answerId'];
	$str = file_get_contents('answers.json');
	$json = json_decode($str, true);

	$result = 'wrong';
	$correctAnswer = -1;

	foreach ($json as $key => $question) {
		if($question['id'] == $questionId) {
			$correctAnswer = $question['answer'];
			if($question['answer'] == $answerId) {
				$result = 'correct';
			}
			break;
		}
	}
	$return = array('result' => $result, 'correctAnswer' => $correctAnswer);
	echo json_encode($return);
}
