angular.module('starter.controllers', [])

    .controller('GameCtrl', function ($scope, $rootScope, socket, $cordovaToast, ConfigConstant, $http, $ionicPopup, $ionicModal) {
        var board = jsboard.board({attach: "game", size: "6x6", style: "checkerboard"});
        var x = jsboard.piece({text: "X", fontSize: "30px", textAlign: "center"});
        var o = jsboard.piece({text: "O", fontSize: "30px", textAlign: "center"});
        var guessPiece = jsboard.piece({text: "?", fontSize: "20px", textAlign: "center"});
        var gameStarted, playerOne, nTurnInGame, turn, guess, turnCount, beginning, points, playingGameId;
        $scope.friends = [];
        $scope.graphAPIHost = ConfigConstant.graphAPIHost;
        $scope.temp = [];
        $scope.friendSocialId = null;
        $scope.friendSocialName = null;

        function init() {
            $scope.gameId = Math.random().toString(36).substring(2, 2 + $rootScope.gameIdLength).toLowerCase();
            gameStarted = false;
            playerOne = true;
            nTurnInGame = 5;
            turn = true;
            guess = true;
            turnCount = 0;
            beginning = true;
            playingGameId = $scope.gameId;

            $scope.myScore = 0;
            $scope.opponentScore = 0;
            $scope.id = {};
            board.cell("each").rid();
            // Register the game
            socket.emit('newGame', {id: $scope.gameId});
        }

        init();
        socket.on('gameJoined', function () {
            board.cell("each").rid();
            gameStarted = true;
            if (playerOne) {
                $cordovaToast.showShortBottom("Your turn, make your guess");
            }
        });

        $ionicModal.fromTemplateUrl('templates/friendInvite.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.challengeFriends = function () {
            $http({
                method: 'GET',
                url: ConfigConstant.graphAPIHost + '/me/friends?access_token=' + $rootScope.fbToken
            }).then(function successCallback(response) {
                var friendResponse = response.data;
                if (friendResponse.data) {
                    $scope.friends = friendResponse.data;
                    $scope.modal.show();
                }

            }, function errorCallback(response) {
                alert('error');
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
            //$scope.modal.show();
            //$scope.modal.hide();
        };

        $scope.inviteFriend = function (friendSocial) {
            $scope.friendSocialId = friendSocial.id;
            $scope.friendSocialName = friendSocial.name;
            $scope.modal.hide();
            alert($scope.friendSocialId);
        };

        if ($rootScope.gameOption == 1) {
            //$cordovaToast.showShortBottom('Connected');
            var myPiece, opponentPiece, myGuess, opponentGuess;
            board.cell("each").on("click", function () {
                if (board.cell(this).get() === null) {

                    if (gameStarted) {
                        // Emit a event for this turn
                        if (beginning && playerOne) {
                            turn = !turn;
                        }
                        myPiece = playerOne ? x : o;
                        opponentPiece = !playerOne ? x : o;

                        myGuess = board.cell(this).where();
                        if ((beginning && playerOne) || (!beginning)) {
                            if (turn) {
                                board.cell("each").rid();
                                board.cell(this).place(myPiece.clone());
                                board.cell(opponentGuess).place(guessPiece.clone());
                                points = computePoints(myGuess, opponentGuess);
                                $cordovaToast.showShortBottom(points + " points to you, now make your guess");
                                $scope.myScore = $scope.myScore + points;
                                $scope.$apply();
                                turn = !turn;

                                // Player one will decide when to finish the game, will send an event when game will finish
                                turnCount = turnCount + 1;
                                if (playerOne && (turnCount === nTurnInGame)) {
                                    declareWinner();
                                    updateWinner();
                                    socket.emit('newTurn', {gameId: playingGameId, location: myGuess, gameOver: true});
                                } else {
                                    socket.emit('newTurn', {gameId: playingGameId, location: myGuess});
                                }

                            } else if (guess) {
                                board.cell("each").rid();
                                board.cell(this).place(guessPiece.clone());
                                guess = !guess;
                                $cordovaToast.showShortBottom("Great!!!, now wait for opponent move and guess");
                                socket.emit('turnTransfer', {gameId: playingGameId, location: myGuess});
                            }
                            beginning = false;
                        }


                    }
                }
            });

            socket.on('opponentTurn', function (opponentTurn) {
                board.cell(opponentTurn.location).place(opponentPiece.clone());

                //Update opponent's score
                points = computePoints(myGuess, opponentTurn.location);
                $cordovaToast.showShortBottom(points + " points to your opponent");
                $scope.opponentScore = $scope.opponentScore + points;

                if (opponentTurn.gameOver) {
                    declareWinner();
                }

            });

            socket.on('takeTurn', function (oppGuess) {
                turn = true;
                guess = true;
                beginning = false;
                opponentGuess = oppGuess;
                $cordovaToast.showShortBottom("Your turn, make your move close to opponent guess");
            });

            $scope.joinGame = function () {
                if ($scope.id.friendGameId.length == $rootScope.gameIdLength) {
                    var data = {
                        ownGameId: $scope.gameId.toLowerCase(),
                        requestGameId: $scope.id.friendGameId.toLowerCase()
                    };
                    $http({
                        method: 'POST',
                        data: data,
                        url: ConfigConstant.server + '/api/game/gameRequest'
                    }).then(function successCallback(response) {
                        // Inform other player about success
                        board.cell("each").rid();
                        playingGameId = $scope.id.friendGameId.toLowerCase();
                        gameStarted = true;
                        playerOne = false;
                        socket.emit('newGameJoined', {gameId: playingGameId});
                        $cordovaToast.showShortBottom("Opponent turn, wait for guess");
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                    });
                }

            };

            function computePoints(a, b) {
                return 10 - (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]));
            }

            function declareWinner() {
                var message = '';
                if ($scope.myScore > $scope.opponentScore) {
                    message = 'Congratulations!!! You have won the match\n';
                } else if ($scope.myScore < $scope.opponentScore) {
                    message = 'You Lost!!! Better luck next time\n';
                } else {
                    message = 'Its a tie, Play one more game to decide who is champion\n';
                }
                message = message + '\nYour Score: ' + $scope.myScore;
                message = message + '\nOpponent Score: ' + $scope.opponentScore;

                // An alert dialog
                var showAlert = function () {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Game Over',
                        template: message
                    });
                    alertPopup.then(function (res) {
                        //New game will be created after this
                        init();
                    });

                };

                showAlert();
            }

            function updateWinner() {
                var data = {};
                data.gameId = gameId;
                data.playerOneWinner = ($scope.myScore > $scope.opponentScore);
                data.tie = ($scope.myScore === $scope.opponentScore);
                //$.ajax({
                //    type: "POST",
                //    url: '/api/game/updateWinner',
                //    data: data,
                //    success: function(response) {
                //        console.log(response)
                //    },
                //    error : function () {
                //        console.log('winner not updated')
                //    }
                //});
            }
        }
    })

    .controller('ChatsCtrl', function ($scope, Chats) {
        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        $scope.chats = Chats.all();
        $scope.remove = function (chat) {
            Chats.remove(chat);
        };
    })

    .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
        $scope.chat = Chats.get($stateParams.chatId);
    })

    .controller('LoginCtrl', function ($scope, $http, configObj, ConfigConstant, Service, $state, $rootScope) {
        if (configObj.data.loggedIn) {
            $rootScope.fbToken = configObj.data.fbToken;
            $state.go('gameOptions');
        }
        $scope.fbLogin = function () {
            var url = ConfigConstant.server + '/auth/facebook';
            var loginWindow = window.open(encodeURI(url), '_blank', 'location=no');
            loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
            //var defaultTimer = setTimeout(function () {
            //    loginWindow.close();
            //}, 30000);

            function loginWindow_loadStartHandler(event) {
                var url = event.url;
                if (url.indexOf("code=") > 0 || url.indexOf("error=") > 0) {
                    //clearTimeout(defaultTimer);
                    setTimeout(function () {
                        loginWindow.close();
                        Service.isLoggedIn().then(function (configDetails) {
                            if (configDetails.loggedIn) {
                                $rootScope.gameIdLength = 5; // Will be updated by config call
                                $rootScope.fbToken = configDetails.fbToken;
                                $state.go('gameOptions');
                            }

                        });
                    }, 1000);
                }
            }
        };

        $scope.loggedIn = function () {
            $http({
                method: 'GET',
                url: ConfigConstant.server + '/api/users/configCall'
            }).then(function successCallback(response) {
                //window.location.href = 'http://www.facebook.com';
                //$state.go('tab.dash');
                // this callback will be called asynchronously
                // when the response is available
            }, function errorCallback(response) {
                alert('failure');
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    })

    .controller('GameOptionsCtrl', function ($scope, $ionicNavBarDelegate, $rootScope, $state) {
        $ionicNavBarDelegate.showBackButton(false);
        $scope.setGameOption = function (option) {
            $rootScope.gameOption = option;
            $state.go('tab.game');
        }

    })

    .controller('AccountCtrl', function ($scope) {
        $scope.settings = {
            enableFriends: true
        };
    });
