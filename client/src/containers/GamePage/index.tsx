import React, { useEffect, useState } from 'react';
import { Avatar, Backdrop, Box, CircularProgress } from "@mui/material";

import style from './style.module.css'
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SelectSocket, SelectUserId, SelectUserLetter, SelectUserRoom } from "../../redux/store/socket/selector";
import { useSnackbar } from "notistack";
import { links } from "../../router";
import { setRoom, setUserLetter } from "../../redux/store/socket/slice";
import { getAnimalByLetter } from "../../helpers/animalHelpIcons";
import Button from "../../components/Button";
import { LeaveInterface } from "../RoomPage";
import GameRunningItem from "./GameRunningItem";
import GameResultItem from './GameResultsItem';



interface GameStartedInterface {
	status: boolean,
	message?: string,
	data: {
		step?: string,
		question: { question: string; answers: string[] },
		round: number
	}
}

interface GameEndedInterface {
	status: boolean,
	message?: string,
	results: Results[]
	correct: number,
}

interface SkipInterface {
	status: boolean,
	message: string
}

export interface Results {
	player?: string,
	answer: { variant: number, isCorrect: boolean },
}

export interface Result {
	results: Results[],
	correct: number
}

interface AnswerInterface {
	status: boolean,
	message?: string,
	data?: { step?: string }
}

const GamePage = () => {
	const goto = useNavigate();
	const dispatch = useDispatch();

	const userId = useSelector(SelectUserId);
	const userLetter = useSelector(SelectUserLetter);
	const userRoom = useSelector(SelectUserRoom);
	const socket = useSelector(SelectSocket);

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [loadingRequest, setLoadingRequest] = useState(false);
	const [players, setPlayers] = useState<{ id: string, letter: string }[]>([]);
	const [gameStatus, setGameStatus] = useState<"waiting" | "running" | "results">("waiting");
	const [data, setData] = useState<{ question: string; answers: string[] }>({ question: "", answers: [] })
	const [time, setTime] = useState<number>(-1);
	const [timer, setTimer] = useState<number>(60);
	const [round, setRound] = useState(1);

	const [results, setResults] = useState<Result>({ correct: 0, results: [] });
	// single
	const [currentStep, setCurrentStep] = useState<string>("");
	// multi
	const [isAnswered, setAnswered] = useState(false);

	useEffect(() => {
		if (time === 3) {
			let timer = setInterval(() => {
				setTime(prev => {
					if (prev === -1) {
						clearInterval(timer);
						socket?.emit('startGame');
					}
					return prev - 1;
				});
			}, 1000)  
		}
	}, [time])

	useEffect(() => {
		if (!userId || (!userLetter && !userRoom.single && gameStatus !== 'results')) {
			enqueueSnackbar(`Error when tried connect to ${!userId ? 'WebSocket' : 'Room'}`, { variant: "error" });
			goto(links.start);
		} else
			setLoading(false);

		socket?.emit('getRoomInfo');

		socket?.once('getRoom', (data: { status: boolean, message?: string, playersList: { id: string, letter: string }[] }) => {
			if (data.status) {
				setPlayers(data.playersList);
				setLoading(true);
				if (userRoom.isOwner)
					setTime(3);
			} else {
				enqueueSnackbar(`Error when tried connect to Room`, { variant: "error" });
				goto(links.start);
			}
		})

		socket?.on('leavedRoom', (data: LeaveInterface) => {
			if (data.status) {
				if (gameStatus === 'waiting')
					goto(links.room);
				else if (gameStatus === 'running') {
					dispatch(setRoom({ roomNumber: null, single: null, isOwner: null }));
					dispatch(setUserLetter({ user_letter: null }));
					enqueueSnackbar(`One player leaves from a game before it gone`, { variant: "info" });
					socket?.emit('leaveRoom');
				} else {
					dispatch(setRoom({ roomNumber: null, single: null, isOwner: null }));
					dispatch(setUserLetter({ user_letter: null }));
					goto(links.lobby);
				}
			}
		})

		socket?.on('gameStarted', (data: GameStartedInterface) => {
			setLoading(false);
			if (data.status) {
				setAnswered(false);
				setData(data?.data?.question);
				setRound(data?.data?.round);
				setCurrentStep(data?.data?.step ?? "");
				setGameStatus('running');
			} else
				enqueueSnackbar(data.message, { variant: "error" });
		})

		socket?.on('gameEnded', (data: GameEndedInterface) => {
			setLoadingRequest(false);
			if (data.status) {
				setResults({ correct: data.correct, results: data.results });
				setGameStatus('results');
			}
		})

		socket?.on('time', (data: { status: boolean, data: { time: number } }) => {
			if (data.status) {
				setTimer(data.data.time);
			}
		})

		socket?.on('answer', (data: AnswerInterface) => {
			setLoadingRequest(false);
			if (data.status) {
				if (userRoom.single)
					setCurrentStep(data?.data?.step ?? "");
				else
					setAnswered(true);
			} else
				enqueueSnackbar(`Failed to send your answer. Try again.`, { variant: "error" });
		})

		return () => {
			socket?.off('time');
			socket?.off('gameEnded');
			socket?.off('answer');
			socket?.off('gameStarted');
			socket?.off('leavedRoom');
		}
	}, [])

	const handleSkipQuestion = () => {
		setLoadingRequest(true);
		socket?.emit('skip-question');

		socket?.once('skip-question', (data: SkipInterface) => {
			setLoadingRequest(false);
			if (data.status) {
				setAnswered(true);
			} else
				enqueueSnackbar(`Failed skip. Try again.`, { variant: "error" });
		})
	}

	const handleAnswer = (variant: number) => {
		setLoadingRequest(true);
		socket?.emit('answer', { answer: variant });
	}

	return (
		<Box className={style.container}>
			{gameStatus !== 'results' && <Box className={style.round}>
				Round: {round}
			</Box>}
			<Backdrop open={loading} style={{ color: 'black' }}>
				{time < 0
					?
					<h1>Waiting... <CircularProgress /></h1>
					:
					<h1>{time}</h1>}
			</Backdrop>

			<Backdrop open={loadingRequest} style={{ color: "black" }}>
				<h1>Sending request.. <CircularProgress /></h1>
			</Backdrop>

			{gameStatus === 'running' && <GameRunningItem players={players} question={data} currentStep={currentStep}
				handleAnswer={handleAnswer} handleSkip={handleSkipQuestion}
				isAnswered={isAnswered} multiplayer={!userRoom.single}
				timer={timer} />}
			{gameStatus === 'results' && <GameResultItem players={players} result={results} question={data} />}
		</Box>
	);
};

export default GamePage;