angular.module('starter.services', [])

    .factory('Service', function (ConfigConstant, $http) {
        // Might use a resource here that returns a JSON array

        // Some fake testing data
        var chats = [{
            id: 0,
            name: 'Ben Sparrow',
            lastText: 'You on your way?',
            face: 'img/ben.png'
        }, {
            id: 1,
            name: 'Max Lynx',
            lastText: 'Hey, it\'s me',
            face: 'img/max.png'
        }, {
            id: 2,
            name: 'Adam Bradleyson',
            lastText: 'I should buy a boat',
            face: 'img/adam.jpg'
        }, {
            id: 3,
            name: 'Perry Governor',
            lastText: 'Look at my mukluks!',
            face: 'img/perry.png'
        }, {
            id: 4,
            name: 'Mike Harrington',
            lastText: 'This is wicked good ice cream.',
            face: 'img/mike.png'
        }];

        var isLoggedIn = function () {
            var configPromise = $http.get(ConfigConstant.server + '/api/users/configCall').then(function (configObject) {
                //alert(JSON.stringify(configObject));
                return configObject.data;
            });
            return configPromise;
        };

        return {
            all: function () {
                return chats;
            },
            remove: function (chat) {
                chats.splice(chats.indexOf(chat), 1);
            },
            get: function (chatId) {
                for (var i = 0; i < chats.length; i++) {
                    if (chats[i].id === parseInt(chatId)) {
                        return chats[i];
                    }
                }
                return null;
            },
            isLoggedIn: isLoggedIn
        };
    })

    .factory('socket', function ($rootScope, ConfigConstant) {
        var socket = io.connect(ConfigConstant.server);
        socket.on('connect', function () {
            socket.emit('registerUser');
        });
        socket.on('disconnect', function () {
            alert('connected');
        });

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    })

    .factory('GameService', function (ConfigConstant, $http) {

        var gameInvite = function (data, success, failure) {
            $http({
                method: 'POST',
                data: data,
                url: ConfigConstant.server + '/api/game/gameInvite'
            }).then(function successCallback(response) {
                // Inform other player about success
                success();
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                failure();
            });
        };

        var joinGame = function (data, success, failure) {
            $http({
                method: 'POST',
                data: data,
                url: ConfigConstant.server + '/api/game/gameRequest'
            }).then(function successCallback(response) {
                success();
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                failure();
            });
        };
        return {
            gameInvite: gameInvite,
            joinGame: joinGame
        }
    }

);
