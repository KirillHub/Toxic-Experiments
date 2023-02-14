import { useState } from 'react';
import { Box, ImageList, ImageListItem, ImageListItemBar } from "@mui/material";
import { Result } from "../index";
import style from "./style.module.css";
import Button from "../../../components/Button";
import { useSelector } from "react-redux";
import { SelectSocket, SelectUserLetter, SelectUserRoom } from "../../../redux/store/socket/selector";
import { getAnimalNameByLetter } from "../../../helpers/animalHelpIcons";
import { getAnimalColorImageByLetter } from '../../../helpers/animalHelpColor';
import { Players } from '../../../models/Data';

interface DataGameResult {
	players: Players[],
	result: Result,
	question: {
		question: string;
		answers: string[]
	}
}
interface WhoDrinking {
	isCorrectAnswer: boolean
}

const GameResultItem = ({ players, result, question }: DataGameResult) => {

	const [isUserNeedDrink, setUserNeedDrink] = useState<boolean>(false);

	const socket = useSelector(SelectSocket);
	const userLetter = useSelector(SelectUserLetter);
	const userRoom = useSelector(SelectUserRoom);

	const handleGameStart = () => {
		socket?.emit('startGame');
	}

	const handleLeave = () => {
		socket?.emit('leaveRoom');
	}


	const WhoDrinking = ({ isCorrectAnswer }: WhoDrinking) => {
		return (
			<Box className={style.answer} style={isCorrectAnswer ?
				{ color: '#00FFA3' } : { color: '#FF0000' }}>
				{isCorrectAnswer ? 'correct' : 'wrong'}
			</Box>
		)
	}

	const UserName = (props: { playerName: string }) => {
		const name = getAnimalNameByLetter(props.playerName)[0].toUpperCase() +
			getAnimalNameByLetter(props.playerName).slice(1)

		return (
			<Box className={style.answer}>
				{name}
			</Box>
		)
	};

	const EndButtons = () => {
		return (
			<>
				<Box style={{ width: '80%', margin: '0 auto' }}>
					{userRoom.isOwner &&
						<Button style={{ marginBottom: '5%' }} onClick={handleGameStart}
						>continue</Button>}
					<Button onClick={handleLeave}>leave</Button>
				</Box>
			</>
		)
	};

	const UserImageMultiplayer = () => {
		// checking that user answer is correct
		const isCorrect = result.results.filter(p => p.player === userLetter)[0].answer.isCorrect;
		const userInfo = isCorrect ? 'You not drinking!' : 'You drinking!';
		// get the name of the animal that belongs to the player
		const userName = result.results.filter(p => p.player === userLetter)[0];

		return (
			<>
				<Box className={style.user_image_multiplayer}>
					<ImageListItem>
						<img
							style={{ width: userRoom.isOwner ? '60%' : '85%', display: 'block', margin: '0 auto', objectFit: 'cover' }}
							src={getAnimalColorImageByLetter(userName.player ?? '')}
							alt={'animal-img' + userName.player}
							loading="lazy"
						/>
					</ImageListItem>

					<Box className={style.text_custom}>{userInfo}</Box>

					<EndButtons />
				</Box>
			</>
		)
	};

	const SinglePlayerAllUsersCorrect = () => {
		const whoDrinking = result.results.filter(r => !r.answer.isCorrect);

		return (
			<>
				{!whoDrinking.length &&
					userRoom.isOwner &&
					<Button onClick={handleGameStart}
						style={{ color: '#FF0000', fontWeight: '700' }}
					>Nobody drinking :(</Button>
				}
			</>
		)
	};

	const onHandleClickLetsDrink = () => {
		setUserNeedDrink(prev => !prev)
	};

	const BeerIcon = () => {
		return (
			<>
				<Box className={style.beer}></Box>
			</>
		)
	};

	const UserImages = () => {

		return (
			<ImageList className={style.custom_image_list}
				cols={result.results.length > 4 ? 3 : 2}  >
				{result.results.map((p, id) => (

					<ImageListItem key={id}>
						<ImageListItemBar
							title={<UserName playerName={p.player ?? ''} />}
							position="below" />
						{isUserNeedDrink && !p.answer.isCorrect && <BeerIcon />}
						<img
							style={{ width: '50%', display: 'block', margin: '0 auto', objectFit: 'cover' }}
							src={getAnimalColorImageByLetter(p.player ?? '')}
							alt={'animal' + p.player}
							loading="lazy"
						/>
						{!isUserNeedDrink && <WhoDrinking isCorrectAnswer={p.answer.isCorrect} />}

					</ImageListItem>
				))}
			</ImageList>
		)
	}

	if (result.results.length > 0)
		return (
			<>
				<Box className={style.results_main}>

					{userRoom.single &&
						<Box style={{ width: '80%', margin: '0 auto' }}>
							<SinglePlayerAllUsersCorrect />
						</Box>}

					<Box className={style.results_body}>
						<h2>Who drinks today?</h2>
						{userRoom.single && <UserImages />}

						{!userRoom.single && <UserImageMultiplayer />}

						{!isUserNeedDrink && <Button style={{ width: '90%', margin: '0 auto' }}
							onClick={onHandleClickLetsDrink}>Let's drink</Button>}

						{isUserNeedDrink && <EndButtons />}
					</Box>
				</Box>
			</>
		);
	else
		return <Box></Box>
};

export default GameResultItem;

