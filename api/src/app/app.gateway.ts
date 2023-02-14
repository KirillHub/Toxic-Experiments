import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { AppService } from './services/app.service';
import { Helper } from '../helper/helper';
import { QuestionsService } from './services/questions.service';

interface Room {
  room: string;
  players: { id: string; creator: boolean }[];
  service: AppService;
  timer: any;
  time: number;
}

interface DefaultResponse {
  status: boolean;
  message?: string | boolean;
  client?: string;
  data?: any;
}

@WebSocketGateway()
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private questionService: QuestionsService) {}

  @WebSocketServer() wss: Server;

  private rooms: Room[] = [];
  private logger: Logger = new Logger('AppGateway');
  private helper = new Helper();

  //Initialize server
  afterInit(server: Server): any {
    this.logger.log(`Initialized!`);
  }

  fixRooms(){
    let start = this.rooms.length;
    this.rooms = this.rooms.filter(r=>r.players.length !== 0);
    let end = this.rooms.length;

    if(start > end)
      this.logger.debug(`${start - end} rooms fixed.`);
  }

  //handle connection to ws
  //return connected, with args {id: string}
  handleConnection(client: Socket, ...args: any[]): any {
    this.logger.log(`Client connected: ${client.id}`);

    client.emit('connected', { id: client.id });
    this.fixRooms();
    this.logger.debug(`Rooms: ${this.rooms.map((r) => r.room)}`);
  }

  //handle disconnection from ws
  handleDisconnect(client: Socket): any {
    this.logger.log(`Client disconnected: ${client.id}`);
    const _userRooms = this.rooms.filter((r) =>
      r.players.some((u) => u.id === client.id),
    );
    _userRooms.forEach((r) => {
      this.handleLeaveRoom(client, true);
    });
  }

  //get user rooms
  getUserRooms(client: Socket) {
    return Array.from(client.rooms.values()).filter((x) => x !== client.id);
  }

  //get room object by name
  getRoom(room: string) {
    if (this.isRoomExists(room))
      return this.rooms[this.rooms.findIndex((r) => r.room === room)];
    else return null;
  }

  //check if room exists
  isRoomExists(room: string) {
    return this.rooms.some((r) => r.room === room);
  }

  //event on 'createRoom'
  //return joinedRoom, with args {status: true | false, message?: string} as DefaultResponse
  //return createdRoomName, with args {status: true | false, message?: string} as DefaultResponse
  @SubscribeMessage('createRoom')
  handleCreateRoom(
    client: Socket,
    data: { solo?: boolean; playersCount: number },
  ): void {
    //if user already in room, he cant connect to other
    if (this.getUserRooms(client).length > 0) {
      client.emit('createdRoomName', <DefaultResponse>{ status: false });
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: 'You already in another room! Please leave.',
      });
      return;
    }

    if (data.playersCount < 4 || data.playersCount > 8) {
      client.emit('createdRoomName', <DefaultResponse>{
        status: false,
        message: 'Incorrect players count. Min players - 4, max - 8!',
      });
      return;
    }

    //generate random room code
    let room = this.helper.makeid(4, true);
    while (this.isRoomExists(room)) room = this.helper.makeid(4, true);

    //create new room object
    const newRoomObj = {
      room: room,
      players: [{ id: client.id, creator: true }],
      service: new AppService(this.questionService),
    } as Room;
    newRoomObj.service.lobbyName = room;
    this.rooms.push(newRoomObj);

    this.logger.log(`Client ${client.id} created room: ${room}`);

    const _r = newRoomObj.service.addNewPlayer(
      client.id,
      data.solo ?? false,
      data.playersCount,
    );

    if (_r.result === 'error') {
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: _r.err,
      });
      return;
    }

    client.join(room);
    client.emit('createdRoomName', <DefaultResponse>{
      status: true,
      data: room,
    });
    client.emit('joinedRoom', <DefaultResponse>{
      status: true,
      client: client.id,
      letter: data.solo ? null : _r.data,
      canStart: data.solo ? true : false,
    });
  }

  //event on 'joinRoom'
  //return joinedRoom, with args {status: true | false, message?: string} as DefaultResponse
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, data: { room: string }): void {
    //if the user is already in the room, he cannot connect to another
    if (this.getUserRooms(client).length > 0) {
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: 'You already in another room! Please leave.',
      });
      return;
    }

    //if room doesnt exists user get exception
    if (!this.isRoomExists(data.room)) {
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: 'Room doesnt exists!',
      });
      return;
    }

    //get current room
    //add new player to game lobby and in array of players
    const _rm = this.getRoom(data.room);

    if (_rm.service.solo) {
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: 'This room only for 1 device!',
      });
      return;
    }

    if (_rm.service.currentGameState === 'in_progress') {
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: 'Game is already started!',
      });
      return;
    }

    _rm.players.push({ id: client.id, creator: false });
    const _r = _rm.service.addNewPlayer(client.id);
    if (_r.result === 'error') {
      client.emit('joinedRoom', <DefaultResponse>{
        status: false,
        message: _r.err,
      });
      return;
    }
    this.logger.log(`Client ${client.id} joined to room: ${data.room}`);

    client.join(data.room);

    this.wss.to(data.room).emit('joinedRoom', <DefaultResponse>{
      status: true,
      client: client.id,
      letter: _r.data,
      canStart: _rm.service.players.length === _rm.service.playersCount,
      playersList: _rm.service.players,
    });
  }

  @SubscribeMessage('initStart')
  handleInitStart(client: Socket): void {
    const rooms = this.getUserRooms(client);
    if (rooms.length === 0) {
      client.emit('initiatedStart', <DefaultResponse>{
        status: false,
        message: 'You doesnt connected to any room!',
      });
      return;
    }

    const room = rooms[0];

    this.wss.to(room).emit('initiatedStart', { status: true });
  }

  //event on 'leaveRoom'
  //return leavedRoom, with args {status: true | false, message?: string, client?: string} as DefaultResponse
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, force = false, del = false): void {
    //user cant leave from a room in which he is not a member
    const rooms = this.rooms.filter((x) =>
      x.players.map((c) => c.id).includes(client.id),
    );

    if (rooms.length === 0) {
      client.emit('leaveRoom', <DefaultResponse>{
        status: false,
        message: 'You doesnt connected to any room!',
      });
      return;
    }

    const room = rooms[0].room;

    //get current room
    const _rm = this.getRoom(room);

    //remove from players, player which leave
    const _r = _rm.service.removePlayer(client.id);

    const quit = _r.message === 'quit' && !del;

    _rm.players = _rm.players.filter((p) => p.id !== client.id);

    //check if there is no creator in the room
    //if not give creator for 1 player
    //if not enough players remove room
    if (quit) {
      clearInterval(_rm.timer);
      const others = Array.from(this.wss.sockets.sockets.values());
      others
        .filter((x) => _rm.players.map((v) => v.id).includes(x.id))
        .filter((x) => x.id !== client.id)
        .forEach((x) => this.handleLeaveRoom(x, true, del));
    }

    if (_rm.players.length > 0 && !_rm.players.some((p) => p.creator))
      _rm.players[0].creator = true;
    else if (_rm.players.length === 0)
      this.rooms = this.rooms.filter((r) => r.room !== room);

    this.logger.log(`Client ${client.id} leave from room: ${room}`);
    this.wss.to(room).emit('leavedRoom', <DefaultResponse>{
      status: true,
      client: client.id,
      newOwner: _rm.players[0]?.id ?? null,
    });
    client.leave(room);
  }

  //event on 'startGame'
  //return gameStarted, with args {status: true | false, message?: string, dips?: Player[]} as DefaultResponse
  //return playersDips, with args [{player: Player, dip: "X" | "O"}]
  @SubscribeMessage('startGame')
  async handleStartGame(client: Socket): Promise<void> {
    const rooms = this.getUserRooms(client);
    if (rooms.length === 0) {
      client.emit('startGame', <DefaultResponse>{
        status: false,
        message: 'You doesnt connected to any room!',
      });
      return;
    }

    const room = rooms[0];

    //get current room
    const _rm = this.getRoom(room);

    //call startGame method
    const result = await _rm.service.startGame();

    //if we had error, tell it to user
    if (result.result === 'error') {
      client.emit('gameStarted', <DefaultResponse>{
        status: false,
        message: result.err,
      });
      return;
    }

    this.wss.to(room).emit('gameStarted', <DefaultResponse>{
      status: true,
      data: {
        step: result.step,
        question: result?.question,
        round: result.round,
      },
    });

    _rm.time = 61;
    _rm.timer = setInterval(() => {
      _rm.time--;
      this.wss
        .to(room)
        .emit('time', <DefaultResponse>{ status: true, data: { time: _rm.time } });
      if (_rm.time === 0) {
        if (_rm.service.solo) {
          _rm.time = 61;
          this.handleSkipQuestion(client, true);
        } else {
          const results = _rm.service.gameEnd(true);
          this.wss.to(room).emit('gameEnded', <DefaultResponse>{
            status: true,
            results: results,
            correct: _rm.service.currentQuestion.correctAnswer
          });
          clearInterval(_rm.timer);
        }
      }
    }, 1000);
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, data: { answer: number }): void {
    const rooms = this.getUserRooms(client);
    if (rooms.length === 0) {
      client.emit('answer', <DefaultResponse>{
        status: false,
        message: 'You doesnt connected to any room!',
      });
      return;
    }

    const room = rooms[0];

    //get current room
    const _rm = this.getRoom(room);

    //call startGame method
    const result = _rm.service.answer(client.id, data.answer);

    //if we had error, tell it to user
    if (result.result === 'error') {
      client.emit('answer', <DefaultResponse>{
        status: false,
        message: result.err,
      });
      return;
    }

    if (_rm.service.solo) _rm.time = 61;

    if (_rm.service.currentGameState === 'done') {
      clearInterval(_rm.timer);
      this.wss.to(room).emit('gameEnded', <DefaultResponse>{
        status: true,
        results: result.data,
        correct: _rm.service.currentQuestion.correctAnswer
      });
      return;
    }

    client.emit('answer', <DefaultResponse>{
      status: true,
      data: { step: result?.step },
    });
  }

  @SubscribeMessage('getRoomInfo')
  handleGetRoomInfo(client: Socket): void {
    //user cant leave from a room in which he is not a member
    const rooms = this.rooms.filter((x) =>
      x.players.map((c) => c.id).includes(client.id),
    );

    if (rooms.length === 0) {
      client.emit('getRoom', <DefaultResponse>{
        status: false,
        message: 'You doesnt connected to any room!',
      });
      return;
    }

    const room = rooms[0];
    client.emit('getRoom', { status: true, playersList: room.service.players });
  }

  @SubscribeMessage('skip-question')
  handleSkipQuestion(client: Socket, force = false): void {
    const rooms = this.getUserRooms(client);
    if (rooms.length === 0) {
      client.emit('skip-question', <DefaultResponse>{
        status: false,
        message: 'You doesnt connected to any room!',
      });
      return;
    }

    const room = rooms[0];

    //get current room
    const _rm = this.getRoom(room);

    //call startGame method
    const result = _rm.service.answer(client.id, -1, true);

    //if we had error, tell it to user
    if (result.result === 'error' && !force) {
      client.emit('skip-question', <DefaultResponse>{
        status: false,
        message: result.err,
      });
      return;
    }

    if (_rm.service.solo) _rm.time = 61;

    if (_rm.service.currentGameState === 'done') {
      clearInterval(_rm.timer);
      this.wss.to(room).emit('gameEnded', <DefaultResponse>{
        status: true,
        results: result.data,
        correct: _rm.service.currentQuestion.correctAnswer,
      });
      return;
    }

    client.emit('answer', <DefaultResponse>{
      status: true,
      data: { step: result?.step },
    });
  }
}
