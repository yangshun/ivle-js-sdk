(function (root) {
  root.IVLE = root.IVLE || {};
  root.IVLE.VERSION = '0.0.1';
}(this));

(function (root) {

  var root = this;
  var IVLE = root.IVLE;

  // If jQuery or Zepto has been included, grab a reference to it.
  if (typeof($) !== 'undefined') {
    IVLE.$ = $;
  }

  // IVLE LAPI URLs.
  var API_URL = 'https://ivle.nus.edu.sg/api/Lapi.svc/';
  var AUTH_URL = 'https://ivle.nus.edu.sg/api/login/';
  var IVLE_SDK_AUTH_URL = 'http://yangshun.github.io/ivle-js-sdk/auth.html';

  // Default configuration parameters.
  var initialized = false;
  var config = {
    apiKey: null,
    callbackUrl: null,
    popup: false,
    popupWindow: {
      width: 256,
      height: 210,
      left: (screen.width / 2) - (256 / 2),
      top: (screen.height / 3) - (210 / 2)
    }
  };
  var user = {
    authToken: null
  };
  var status = {
    loggedIn: false
  };

  IVLE.checkLoginStatus = function () {
    var storedApiKey = localStorage.getItem('ivle:apiKey');
    var storedAuthToken = localStorage.getItem('ivle:authToken');
    var storedCallbackUrl = localStorage.getItem('ivle:callbackUrl');

    var query = window.location.search;
    var authToken = null;
    if (query.charAt(0) === '?') {
      query = query.substring(1);
      var vars = query.split('&');
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair[0] === 'token') {
          authToken = pair[1].replace('/', '');
          break;
        }
      }
    }
    if (authToken) {
      storedAuthToken = authToken;
    }

    if (storedApiKey && storedAuthToken && storedCallbackUrl) {
      IVLE.api('Validate', {
        APIKey: storedApiKey,
        Token: storedAuthToken
      }, function (data) {
        if (data.Success) {
          localStorage.setItem('ivle:authToken', data.Token);
          user.authToken = data.Token;
          config.apiKey = storedApiKey;
          status.loggedIn = true;
          console.log('IVLE: Tokens are valid. User is logged in.');
          if (!initialized && readyCallback) {
            readyCallback();
          }
          initialized = true;
        } else {
          IVLE.flush();
        }
      });
    }
  };

  /* User-defined callback functions */
  loginCallback = undefined;
  readyCallback = undefined;

  IVLE.loginHandler = function (response) {
    if (response.success) {
      console.log(response)
      console.log('IVLE: Successfully logged in.');
      user.authToken = response.authToken;
      status.loggedIn = true;
      localStorage.setItem('ivle:authToken', user.authToken);
      if (loginCallback) {
        loginCallback(response);
      }
    } else {
      console.log(response.error);
    }
  };

  IVLE.login = function (params, callback) {

    if (status.loggedIn) {
      console.log('IVLE: Unable to login because user already logged in.');
      return;
    }

    if (!params.apiKey) {
      console.log('IVLE: API Key is required to use the IVLE JS SDK.');
      return;
    } else {
      localStorage.setItem('ivle:apiKey', params.apiKey);
      config.apiKey = params.apiKey;
    }

    if (!params.callbackUrl) {
      console.log('IVLE: Callback URL is required to use the IVLE JS SDK.');
      return;
    } else {
      localStorage.setItem('ivle:callbackUrl', params.callbackUrl);
      config.callbackUrl = params.callbackUrl;
    }

    var url = AUTH_URL + '?apikey=' + config.apiKey + '&url=';
    // if (config.popup) {
    //   var options = 'dependent, toolbar=no, location=no, directories=no, ' +
    //                 'status=no, menubar=no, scrollbars=no, resizable=no, ' +
    //                 'copyhistory=no, ' +
    //                 'width=' + config.popupWindow.width + ', ' +
    //                 'height=' + config.popupWindow.height + ', ' +
    //                 'top=' + config.popupWindow.top + ', ' +
    //                 'left=' + config.popupWindow.left;
    //   if (callback) {
    //     IVLE.loginCallback = callback;
    //   }
    //   var popUpUrl =  url + encodeURIComponent(IVLE_SDK_AUTH_URL);
    //   window.open(popUpUrl, '', options);
    // } else {
    //   var ivleAuthUrl = url + encodeURIComponent(config.callbackUrl);
    //   window.location.href = ivleAuthUrl;
    // }
    var ivleAuthUrl = url + encodeURIComponent(config.callbackUrl);
    window.location.href = ivleAuthUrl;
  };

  IVLE.logout = function (callback) {

    if (!status.loggedIn) {
      console.log('IVLE: Unable to logout because user is not logged in.');
      return;
    } else {
      status.loggedIn = false;
      IVLE.flush();
      console.log('IVLE: Successfully logged out.');
      if (callback) { 
        callback(); 
      }
    }
  };

  IVLE.getAccessToken = function () {
    if (!status.loggedIn) {
      console.log('IVLE: User is not logged in.');
      return;
    }
    return user.authToken;
  };

  IVLE.isLoggedIn = function () {
    return status.loggedIn === true;
  };

  function injectKeyAndToken (params) {
    if (!params.APIKey) {
      params.APIKey = config.apiKey;
    }
    if (!params.AuthToken) {
      params.AuthToken = user.authToken;
    }
    if (!params.Token) {
      params.Token = user.authToken;
    }
    return params;
  };

  IVLE.api = function (path, params, callback) {
    if (!status.loggedIn && initialized) {
      console.log('IVLE: User is not logged in.');
      return;
    }
    var url = API_URL + path;
    var newParams = injectKeyAndToken(params);
    var queryStringArray = [];
    for (var key in newParams) {
      if (newParams.hasOwnProperty(key)) {
        queryStringArray.push(key + '=' + newParams[key]);
      }
    }
    var queryString = queryStringArray.join('&');

    $.ajax({
      url: url + '?' +  queryString, 
      dataType: 'jsonp',
      success: function (data) {
        if (callback) {
          callback(data);
        }
      },
      error: function (data) {
        if (callback) {
          callback(data);
        }
      }
    });
  };

  IVLE.ready = function (fn) {
    readyCallback = fn;
  }

  IVLE.flush = function () {
    localStorage.removeItem('ivle:apiKey');
    localStorage.removeItem('ivle:authToken');
    localStorage.removeItem('ivle:callbackUrl');
  }

  IVLE.checkLoginStatus();

}(this));
