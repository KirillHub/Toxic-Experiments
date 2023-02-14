import { Injectable, Logger } from '@nestjs/common';
import { Helper } from '../../helper/helper';
import { QuestionsEntity } from '../entities/questions.entity';
import { QuestionsService } from './questions.service';

const letters = 'ABCDEFGHIJKLMN';

export interface Player {
  id?: string;
  letter: string;
}

interface CurrentGameAnswers {
  player: string;
  answer: {
    variant: number;
    isCorrect: boolean;
  };
}

export interface Result {
  result: 'message' | 'error' | 'result';
  message?: string;
  data?: any;
  err?: string;
  question?: any;
  step?: string;
  round?: number;
}

@Injectable()
export class AppService {
  private questionsList: QuestionsEntity[] = [];

  constructor(private questionService: QuestionsService) {}

  //lobby name
  lobbyName = '';

  //helper services
  private helper = new Helper();
  private logger: Logger = new Logger('AppService');

  //variables
  solo = false;
  currentGameState: 'in_progress' | 'waiting' | 'done';
  private currentGameAnswers: CurrentGameAnswers[] = [];
  currentQuestion: QuestionsEntity = null;
  private currentStep = null;
  private round = 0;
  playersCount = 1;
  players: Player[] = [];

  //add new player
  addNewPlayer(player: string, solo?: boolean, playersCount?: number): Result {
    //    if this player is already exists
    if (this.players.some((p) => p.id === player))
      return { result: 'error', err: 'Player with this id already connected' };

    if (this.players.length + 1 > this.playersCount)
      return {
        result: 'error',
        err: 'Max players in this room equal ' + this.playersCount,
      };

    if (solo) this.solo = true;

    if (this.playersCount === 1 && playersCount)
      this.playersCount = playersCount;

    const letter = this.getLetter();

    this.players.push({
      id: player,
      letter: letter,
    });

    solo &&
      this.players.length === 1 &&
      Array.from({ length: playersCount - 1 }).forEach((x, index) => {
        this.players.push({
          letter: this.getLetter(),
        });
      });

    this.logger.log(
      `Player #${player} has been connected, [${this.lobbyName}]`,
    );
    return {
      result: 'message',
      message: `Player #${player} has been connected`,
      data: solo ? null : letter,
    };
  }

  async getQuestion(): Promise<QuestionsEntity> {
    if (this.questionsList.length === 0)
      this.questionsList = await this.questionService.getQuestions();

    return this.questionsList.splice(
      this.helper.getRandomInt(this.questionsList.length),
      1,
    )[0];
  }

  getLetter(): string {
    const usedLetters = this.players.map((p) => p.letter);
    const unUsedLetters = letters
      .split('')
      .filter((l) => !usedLetters.includes(l));
    return unUsedLetters[0];
  }

  getPlayer(id): Player {
    return this.players.filter((x) => x.id === id)[0];
  }

  //remove player from game
  removePlayer(player: string): Result {
    //    if this player is already exists
    if (!this.players.some((p) => p.id === player))
      return { result: 'error', err: 'Player with this id not connected' };

    if (this.currentGameState === 'in_progress')
      return { result: 'message', message: 'quit' };

    this.players = this.players.filter((p) => p.id !== player);

    this.logger.log(
      `Player #${player} has been disconnected, [${this.lobbyName}]`,
    );

    return {
      result: 'message',
      message: `Player #${player} has been disconnected`,
    };
  }

  gameEnd(force = false): CurrentGameAnswers[] {
    this.currentGameState = 'done';
    if (force) {
      const alreadyAnswered = this.currentGameAnswers.map((x) => x.player);
      this.players
        .filter((p) => !alreadyAnswered.includes(p.letter))
        .forEach((p) => {
          this.currentGameAnswers.push({
            player: p.letter,
            answer: { variant: -1, isCorrect: false },
          });
        });
    }
    return this.currentGameAnswers;
  }

  //start the game
  async startGame(): Promise<Result> {
    //    if not enough players
    if (this.players.length === 0 || (this.players.length < 4 && !this.solo))
      return {
        result: 'error',
        err: 'For start game should be minimum 4 players!',
      };

    // if game is already started
    if (this.currentGameState === 'in_progress')
      return { result: 'error', err: 'Game is already started!' };

    this.players = this.players.sort((a, b) =>
      a.letter.localeCompare(b.letter),
    );
    this.round++;
    //reset all variables
    this.currentGameAnswers = [];
    this.logger.log(`Game started!, [${this.lobbyName}]`);

    this.currentQuestion = await this.getQuestion();
    console.log(this.currentQuestion);
    this.currentGameState = 'in_progress';
    this.currentStep = this.solo ? this.players[0].letter : null;

    return {
      result: 'message',
      message: `Game started!, [${this.lobbyName}]`,
      question: {
        question: this.currentQuestion?.question ?? null,
        answers: this.currentQuestion.answers ?? null,
      },
      step: this.currentStep,
      round: this.round,
    };
  }

  answer(client: string, answer: number, timeEnd?: boolean): Result {
    if (this.currentGameState !== 'in_progress')
      return { result: 'error', err: 'Game is not started!' };

    if (
      (this.currentQuestion.answers.length - 1 < answer || answer < 0) &&
      !timeEnd
    ) {
      return {
        result: 'error',
        err: 'Incorrect answer',
      };
    }

    const _curPlaya = this.solo
      ? this.currentStep
      : this.getPlayer(client).letter;

    console.log(_curPlaya);

    this.currentGameAnswers.push({
      player: _curPlaya,
      answer: {
        variant: answer,
        isCorrect: answer === this.currentQuestion.correctAnswer,
      },
    });

    if (this.solo) {
      const _cPlayer = this.players.findIndex(
        (x) => x.letter === this.currentStep,
      );
      const nextStep = _cPlayer + 1 >= this.players.length ? -1 : _cPlayer + 1;

      if (nextStep === -1) {
        const result = this.gameEnd();
        return {
          result: 'message',
          data: result,
        };
      }
      this.currentStep = this.players[nextStep].letter;

      return {
        result: 'message',
        step: this.currentStep,
      };
    } else if (this.currentGameAnswers.length === this.players.length) {
      const result = this.gameEnd();
      return {
        result: 'message',
        data: result,
      };
    }

    return {
      result: 'message',
      data: true,
    };
  }
}
