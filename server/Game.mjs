import { Player } from './Player.mjs';



export const Game = {
	id_cnt:1,
	get ID(){
		return this.id_cnt++;
	},
	init: function(){

	},
	players: {
		all: [],
		online: [],
		game_boards: [],
		winCases: [
			[0,1,2],
			[3,4,5],
			[6,7,8],
			[0,3,6],
			[1,4,7],
			[2,5,8],
			[0,4,8],
			[2,4,6]
		],
		add:function(webSocket){
			let players = this;
			let plyr = new Player({ws:webSocket,id:Game.ID},this.remove.bind(this),this.playMatch.bind(this));
			this.all.push(plyr);
			this.online.push(plyr.id);
			plyr.ws.send("add");
			plyr.ws.send(plyr.id);
			this.broadcast();
		},
		unexpectedLeave: function(plyrHere){
			plyrHere.ws.send("left");
			plyrHere.ws.send("");
			plyrHere.ws.onmessage=(e)=>{
				let p = this.playMatch.bind(this);
				p(plyrHere,e);
			};
			plyrHere.ws.onclose = ()=>{
				let fn = this.remove.bind(this);
				fn(plyrHere);
			};
		},
		playMatch: function(plyr,ev){
			this.remove(plyr,true);
			ev = ev.data;
			ev = JSON.parse(ev);
			let plyr_oth = this.all.find((val)=>val.id==ev.launch_match.id2);
			this.remove(plyr_oth,true);

			plyr_oth.ws.send("request");
			plyr_oth.ws.send(plyr.id);

			plyr.ws.onclose = (e) => {
				this.unexpectedLeave(plyr_oth);
				this.online.push(plyr_oth.id);
				this.online.push(plyr.id);
				this.remove(plyr);
			};

			plyr_oth.ws.onclose = (e) => {
				this.unexpectedLeave(plyr);
				this.online.push(plyr.id);
				this.online.push(plyr_oth.id);
				this.remove(plyr_oth);
			};

			plyr_oth.ws.onmessage=(e)=>{
				e = e.data;
				if(e === "accept")
				{
					plyr.ws.send("launch");
					plyr_oth.ws.send("launch");

					plyr.ws.send(plyr_oth.id);
					plyr_oth.ws.send(plyr.id);

					let game_board = {
						turn:plyr,
						nextTurn:plyr_oth,
						curr_char:"X",
						plyr_char:"X",
						plyr_oth_char:"O",
						plyr,
						plyr_oth,
						board: [1,2,3,4,5,6,7,8,9],
						filled: 0
					};
					this.game_boards.push(game_board);
					let idx = this.game_boards.length-1;

					plyr.ws.send("game");
					plyr.ws.send("Your turn");
					plyr.ws.onmessage=(e)=>{
						let fn = this.plyr_game_handle.bind(this);
						fn(idx,e);
					}
					plyr.ws.onclose=(e)=>{
						this.unexpectedLeave(plyr_oth);
						this.online.push(plyr.id);
						this.online.push(plyr_oth.id);
						this.removeGameBoard(game_board);
						this.remove(plyr);
					}

					plyr_oth.ws.send("game");
					plyr_oth.ws.send("Other turn");
					plyr_oth.ws.onmessage = (e) => {
						this.plyr_ev(game_board,e.data,plyr_oth);
					}
					plyr_oth.ws.onclose=(e)=>{
						this.unexpectedLeave(plyr);
						this.online.push(plyr.id);
						this.online.push(plyr_oth.id);
						this.removeGameBoard(game_board);
						this.remove(plyr_oth);
					}

				}else if(e === "reject") {
					plyr.ws.send("reject");
					plyr.ws.send(plyr_oth.id);
					plyr_oth.ws.onmessage=(e)=>{
						let p=this.playMatch.bind(this);
						p(plyr_oth,e);
					};
					this.online.push(plyr.id);
					this.online.push(plyr_oth.id);
					this.broadcast();
				}
			};

		},
		plyr_ev(game_board,data,plyr)
		{
			if(data === "Reload")
			{
				game_board.board = [1,2,3,4,5,6,7,8,9];
				game_board.turn.ws.send(game_board.board.toString());
				game_board.nextTurn.ws.send(game_board.board.toString());
				game_board.filled = 0;

				game_board.turn.ws.onmessage=(e)=>{
					let fn = this.plyr_game_handle.bind(this);
					fn(this.game_boards.indexOf(game_board),e);
				}

				game_board.nextTurn.ws.onmessage = (e) =>{
					this.plyr_ev(game_board,e.data,game_board.nextTurn);
				}

				game_board.turn.ws.send("Reload");
				game_board.nextTurn.ws.send("Reload");

				return true;
			}else if(data === "Quit")
			{
				game_board.turn.ws.send("Quit");
				game_board.nextTurn.ws.send("Quit");

				game_board.plyr.ws.onmessage=(e)=>{
					let p = this.playMatch.bind(this);
					p(game_board.plyr,e);
				}

				game_board.plyr.ws.onclose = ()=>{
					let fn = this.remove.bind(this);
					fn(game_board.plyr);
				}

				game_board.plyr_oth.ws.onmessage=(e)=>{
					let p = this.playMatch.bind(this);
					p(game_board.plyr_oth,e);
				}

				game_board.plyr_oth.ws.onclose = ()=>{
					let fn = this.remove.bind(this);
					fn(game_board.plyr_oth);
				}

				this.online.push(game_board.plyr.id);
				this.online.push(game_board.plyr_oth.id);
				this.removeGameBoard(game_board);
				this.broadcast();
				return true;
			}

			return false;
		},
		plyr_game_handle: function(idx,e){
			let game_board = this.game_boards[idx];

			if(!this.plyr_ev(game_board,e.data,game_board.turn))
			{
				let i = parseInt(e.data);
				if (game_board.board[i] === "X" || game_board.board[i] === "O"){
					game_board.turn.ws.send("Error");
					return;
				}
				game_board.board[i] = game_board.curr_char;
				game_board.filled++;
			}

			game_board.plyr.ws.send("Board");
			game_board.plyr_oth.ws.send("Board");
			game_board.plyr.ws.send(game_board.board.toString());
			game_board.plyr_oth.ws.send(game_board.board.toString());

			let wins = this.wins(game_board.board);

			if(wins)
			{
				game_board.turn.ws.send("Won");
				game_board.nextTurn.ws.send("Lost");
			}else if(game_board.filled == 9)
			{
				game_board.plyr.ws.send("Draw");
				game_board.plyr_oth.ws.send("Draw");
			}

			if(wins || game_board.filled === 9)
			{
				game_board.turn.ws.onmessage=(e)=>{
					this.plyr_ev(game_board,e.data,game_board.turn);
				}

				game_board.nextTurn.ws.onmessage = (e) =>{
					this.plyr_ev(game_board,e.data,game_board.nextTurn);
				}

				return;
			}

			game_board.turn.ws.send("Other turn");
			game_board.nextTurn.ws.send("Your turn");

			if(game_board.turn === game_board.plyr)
			{
				game_board.turn = game_board.plyr_oth;
				game_board.nextTurn = game_board.plyr;
				game_board.curr_char = game_board.plyr_oth_char;
			}else{
				game_board.turn = game_board.plyr;
				game_board.nextTurn = game_board.plyr_oth;
				game_board.curr_char = game_board.plyr_char;
			}

			game_board.turn.ws.onmessage=(e)=>{
				let fn = this.plyr_game_handle.bind(this);
				fn(idx,e);
			}

			game_board.nextTurn.ws.onmessage = (e) =>{
				this.plyr_ev(game_board,e.data,game_board.nextTurn);
			}
		},
		wins: function(board){
			let winCases = this.winCases;
			for(let i=0; i<winCases.length; i++)
			{
				if(board[winCases[i][0]] == board[winCases[i][1]] && board[winCases[i][0]] == board[winCases[i][2]])
					return board[winCases[i][0]];
			}

			return false;
		},
		removeGameBoard: function(game_board){
			this.game_boards = this.game_boards.filter((val)=>{
				if(val != game_board)
					return val;
			});
		},
		remove: function(plyr,matchMaking = false){

			if(!matchMaking){
				this.all = this.all.filter((val)=>{
					if(val.id != plyr.id)
						return val;
				});
			}

			this.online = this.online.filter((val)=>{
				if(val != plyr.id)
					return val;
			});
			this.broadcast();
		},
		broadcast: function(){
			this.all.forEach((plyr,i)=>{
				let plyrID = plyr.id;
				plyr.ws.send("broadcast");
				plyr.ws.send(JSON.stringify(this.online.filter((val)=>{
					if(plyrID != val) return val;
				})));
			});
		}
	}
};
