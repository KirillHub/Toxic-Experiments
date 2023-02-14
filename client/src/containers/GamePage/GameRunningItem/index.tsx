import { Avatar, Box, Button, ButtonBase} from "@mui/material";
import parentStyle from "../style.module.css";
import style from './style.module.css';
import { useEffect, useState } from "react";
import { Data, Players } from "../../../models/Data";
import { UserImage } from "../../../components/UserImage";
import { getAnimalByLetter } from "../../../helpers/animalHelpIcons";

interface ActiveAnswer {
	activeElement: null | string
	answerList: string[]
}

interface AnsweringPlayerAvatar {
	curAnswer: number
}


const GameRunningItem = (d: Data) => {

	const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer>({
		activeElement: null,
		answerList: d.question.answers
	});
	// need to check if need a right side panel with images
	const [userLeftSideImages, setUserLeftSideImages] = useState<Players[]>([]);
	const [userRightSideImages, setUserRightSideImages] = useState<Players[]>([]);
	const [userDrink, setUserDrink] = useState<boolean>(false);

	useEffect(() => {
		if (d.players.length === 4) {
			setUserLeftSideImages(d.players)
		} else {
			const usersLeftPanel = d.players?.slice(0, 4);
			const usersRightPanel = d.players?.slice(4, d.players.length);

			setUserLeftSideImages(usersLeftPanel);
			setUserRightSideImages(usersRightPanel);
		}
	}, [])


	const toggleActive = (index: number) => {
		setActiveAnswer({ ...activeAnswer, activeElement: activeAnswer.answerList[index] });
	}

	const toggleActiveStyles = (index: number) => {
		if (activeAnswer.answerList[index] !== activeAnswer.activeElement || userDrink) {
			return style.answer
		} else return [style.answer, style.answer_onClick].join(' ')
	}

	const AnsweringPlayerAvatar = ({ curAnswer }: AnsweringPlayerAvatar) => {
		const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', ''];
		const prevIndex = letters.findIndex(letter => letter === d.currentStep);
		const prevLetter = letters[prevIndex - 1];

		return (
			<>
				{activeAnswer.answerList[curAnswer] === activeAnswer.activeElement &&
					!userDrink &&
					<Avatar className={style.user_avatar}
						src={getAnimalByLetter(prevLetter)} alt={'animal-img'} ></ Avatar>
				}
			</>
		)
	}

	return (
		<>
			<Box className={style.game_running_main}>

				<Box className={parentStyle.question}>
					<h1>
						question:
					</h1>
					<Box className={parentStyle.content} >
						{d.question.question}
					</Box>
				</Box>

				<Box className={style.user_icons_wrapper}>
					<Box className={style.users_icons_left_side}>
						<UserImage userImages={userLeftSideImages}
							isMultiplayer={d.multiplayer} currentStep={d.currentStep} rotation={'90deg'} />
					</Box>

					{userRightSideImages.length !== 0 && <Box className={style.users_icons_right_side}>
						<UserImage userImages={userRightSideImages} isMultiplayer={d.multiplayer}
							currentStep={d.currentStep} rotation={'-90deg'} />
					</Box>}
				</Box>

				<Box className={style.answers_block}>

					<Box className={style.answers_wrapper}>
						<Box className={style.timer}>
							{d.timer}
						</Box>

						<Box className={style.answers_content} >
							{d.question.answers.map((answer, i) =>

								<Box className={toggleActiveStyles(i)} key={i}
									onClick={() => { toggleActive(i), d.handleAnswer(i), setUserDrink(false) }}>
									<AnsweringPlayerAvatar curAnswer={i} />
									{answer}
									Lorem ipsum dolor sit amet consectetur adipisicing
								</Box>)}
						</Box>
					</Box>

					<Box className={style.footer}>
						<Box className={style.answer_secr}>answer secretly!</Box>
						<Box className={style.btn_block}>
							<ButtonBase onClick={d.handleSkip}
								className={style.btn_skip}>
								<Box className={style.beer} onClick={() => setUserDrink(true)}></Box>
								skip
							</ButtonBase>
							<ButtonBase className={style.btn_ok}>ok</ButtonBase>
						</Box>
					</Box>

				</Box>

			</Box>
		</>
	);
};

export default GameRunningItem;


