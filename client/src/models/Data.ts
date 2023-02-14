export interface Players {
	id: string,
	letter: string
}
export interface Data {
	players: Players[],
	timer: number,
	multiplayer: boolean,
	question: {
		question: string;
		answers: string[]
	},
	currentStep: string,
	handleAnswer: any,
	handleSkip: any,
	isAnswered: boolean
}


