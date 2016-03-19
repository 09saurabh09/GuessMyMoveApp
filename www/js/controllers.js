angular.module('starter.controllers', [])

.controller('GameCtrl', function($scope) {
    var board = jsboard.board({ attach: "game", size: "6x6" , style: "checkerboard"});
    var x = jsboard.piece({ text: "X", fontSize: "30px", textAlign: "center" });
    var o = jsboard.piece({ text: "O", fontSize: "30px", textAlign: "center"});
    var guessPiece = jsboard.piece({ text: "?", fontSize: "20px", textAlign: "center"});
  })

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('LoginCtrl', function($scope, $http, configObj, ConfigConstant, Service, $state) {
    alert(JSON.stringify(configObj.data.loggedIn));
  $scope.fbLogin = function () {
    var url = ConfigConstant.server + '/auth/facebook';
    var loginWindow = window.open(encodeURI(url), '_blank', 'location=no');
    loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
    var defaultTimer = setTimeout(function () {
      loginWindow.close();
    }, 30000);

    function loginWindow_loadStartHandler(event) {
      var url = event.url;
      if (url.indexOf("code=") > 0 || url.indexOf("error=") > 0) {
        clearTimeout(defaultTimer);
        setTimeout(function () {
          loginWindow.close();
          Service.isLoggedIn().then(function (configDetails){
            if (configDetails.loggedIn) {
              $state.go('gameOptions');
            }

          });
        }, 1000);
      }
    }
  };

    $scope.loggedIn = function() {
      $http({
        method: 'GET',
        url: ConfigConstant.server+'/api/users/configCall'
      }).then(function successCallback(response) {
        alert(JSON.stringify(response.data));
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

.controller('GameOptionsCtrl', function($scope, $ionicNavBarDelegate) {
    $ionicNavBarDelegate.showBackButton(false);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
