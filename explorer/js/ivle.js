(function (root) {
  root.IVLE = root.IVLE || {};
  root.IVLE.VERSION = '0.0.1';
} (this));

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
  var IVLE_SDK_AUTH_URL = 'http://localhost:8000/auth.html';

  // Default configuration parameters.
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
    initialized: false,
    loggedIn: false
  };

  IVLE.init = function (params) {
    if (!params.apiKey) {
      console.log('IVLE: API Key is required to use the IVLE JS SDK.');
      return;
    } else {
      localStorage.setItem('ivle:apiKey', params.apiKey);
      config.apiKey = params.apiKey;
    }

    if (params.popup) {
      config.popup = params.popup;
    } else if (!params.callbackUrl) {
      console.log('IVLE: callbackUrl has to be specified if popup mode not enabled.');
      return;
    } else {
      config.callbackUrl = params.callbackUrl;
    }
    
    status.initialized = true;
    console.log('IVLE: SDK successfully initialized');
  };

  IVLE.checkLoginStatus = function () {
    var storedApiKey = localStorage.getItem('ivle:apiKey');
    var storedAuthToken = localStorage.getItem('ivle:authToken');

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

    if (storedApiKey && storedAuthToken) {
      console.log('IVLE: Validating tokens...', storedApiKey, storedAuthToken);
      $.ajax({
        url:'https://ivle.nus.edu.sg/api/Lapi.svc/Validate?APIKey=' + storedApiKey + '&Token=' + storedAuthToken, 
        dataType: 'jsonp',
        success: function (data) {
          if (data.Success) {
            status.initialized = true;
            status.loggedIn = true;
            console.log('IVLE: User is logged in');
          }
        },
        error: function (data) {
          console.log(data);
          localStorage.removeItem('ivle:apiKey');
          localStorage.removeItem('ivle:authToken');
        }
      });
    }
  };

  IVLE.checkLoginStatus();

  /* User-defined login callback */
  IVLE.loginCallback = undefined;

  IVLE.loginHandler = function (response) {
    if (response.success) {
      console.log(response)
      console.log('IVLE: Successfully logged in.');
      user.authToken = response.authToken;
      status.loggedIn = true;
      localStorage.setItem('ivle:authToken', user.authToken);
      if (IVLE.loginCallback) {
        IVLE.loginCallback(response);
      }
    } else {
      console.log(response.error);
    }
  };

  IVLE.login = function (callback) {
    if (!status.initialized) {
      console.log('IVLE: IVLE.login() called before IVLE.init(). Please init() first');
      return;
    }
    if (status.loggedIn) {
      console.log('IVLE: Unable to login because user already logged in.');
      return;
    }
    var url = AUTH_URL + '?apikey=' + config.apiKey + '&url=';
    if (config.popup) {
      var options = 'dependent, toolbar=no, location=no, directories=no, ' +
                    'status=no, menubar=no, scrollbars=no, resizable=no, ' +
                    'copyhistory=no, ' +
                    'width=' + config.popupWindow.width + ', ' +
                    'height=' + config.popupWindow.height + ', ' +
                    'top=' + config.popupWindow.top + ', ' +
                    'left=' + config.popupWindow.left;
      if (callback) {
        IVLE.loginCallback = callback;
      }
      var popUpUrl =  url + encodeURIComponent(IVLE_SDK_AUTH_URL);
      window.open(popUpUrl, '', options);
    } else {
      var ivleAuthUrl = url + encodeURIComponent(config.callbackUrl);
      window.location.href = ivleAuthUrl;
    }
  }

  IVLE.logout = function (callback) {
    if (!status.initialized) {
      console.log('IVLE: IVLE.logout() called before IVLE.init(). Please IVLE.init() first');
      return;
    }
    if (!status.loggedIn) {
      console.log('IVLE: Unable to logout because user is not logged in.');
      return;
    } else {
      status.loggedIn = false;
      localStorage.removeItem('ivle:authToken');
      console.log('IVLE: Successfully logged out.');
      if (callback) { 
        callback(); 
      }
    }
  }

} (this));
