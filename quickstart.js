      var access_token, url, buttonID = '';
      var authorizeDiv = document.getElementById('authorize-div');
      var authorizeContacts = document.getElementById('authorize-contacts');

      function handleAuthClick() {
          buttonID = this.id;
          getUserInfo(true, buttonID);
      }
      
      function getButtonId(buttonId) {
        if (buttonID.search('calendar') != -1) {
          return true;
        } else if(buttonID.search('contact') != -1) {
          return false;
        }
      }

      function getUserInfo(interactive, buttonId) {
          if (getButtonId(buttonId)) {
            url = 'https://www.googleapis.com/auth/calendar.readonly';
          } else {
              url = 'https://www.googleapis.com/auth/contacts.readonly';
          }
          xhrWithAuth('GET', url, interactive, onUserInfoFetched, buttonId);
      }

      function xhrWithAuth(method, url, interactive, callback, buttonId) {
          var retry = true;
          getToken();

          function getToken() {
              chrome.identity.getAuthToken({
                  interactive: interactive
              }, function (token) {
                  if (chrome.runtime.lastError) {
                      callback(chrome.runtime.lastError);
                      return;
                  }
                  access_token = token;
                  var xhr = new XMLHttpRequest();
                  xhr.open(method, url);
                  xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                  xhr.onload = function () {
                      if (this.status == 401 && retry) {
                          retry = false;
                          chrome.identity.removeCachedAuthToken({
                              token: access_token
                          },
                          getToken);
                      } else {
                          callback(null, this.status, this.response, buttonId);
                      }
                  };
                  xhr.send();
              });
          }
      }

      function onUserInfoFetched(error, status, response, buttonId) {
          if (!error && status == 200) {
              if (getButtonId(buttonId)) {
                  loadCalendarDetails();
              } else {
                  loadContactsApi();
              }
          } else {
              console.log("not 200 : ", response);
          }
      }

      function loadCalendarApi() {
          var url = "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=10&key=" + access_token;
          xhrWithAuth('GET',
          url,
          false,
          onUserInfoFetched1);
      }
      
      function loadCalendarDetails() {
        var url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&&key=" + access_token;
        xhrWithAuth('GET',
          url,
          false,
          onUserInfoFetched3);
      }

      function onUserInfoFetched1(error, status, response, buttonId) {
          if (!error && status == 200) {
              console.log("response : " + response);
              authorizeDiv.style.display = 'none';
              var pre = document.getElementById('output');
              var textContent = document.createTextNode(response);
              pre.appendChild(textContent);
              var user_info = JSON.parse(response);
          } else {
              console.log("not 200 : ", response);
              authorizeDiv = document.getElementById('authorize-div');
              authorizeDiv.style.display = 'inline';
          }
      }

      function loadContactsApi() {
          var url = "https://www.google.com/m8/feeds/contacts/default/full?v=3.0&key=" + access_token;
          xhrWithAuth('GET',
          url,
          false,
          onUserInfoFetched2);
      }

      function onUserInfoFetched2(error, status, response, buttonId) {
          if (!error && status == 200) {
              authorizeContacts.style.display = 'none';
              var pre = document.getElementById('output');
              var textContent = document.createTextNode(response);
              pre.appendChild(textContent);
          } else {
              console.log("not 200 : ", response);
              authorizeContacts.style.display = 'inline';
          }
      }

      function onUserInfoFetched3(error, status, response, buttonId) {
         var events = JSON.parse(response).items;
              appendPre('Upcoming events:');
              if (events.length > 0) {
                  for (i = 0; i < events.length; i++) {
                      var event = events[i];
                      var when = event.start.dateTime;
                      if (!when) {
                          when = event.start.date;
                      }
                      var d = new Date();
                      if (when > d.toISOString()) {
                      appendPre(event.summary + ' (' + when + ')');
                      }
                  }
              } else {
                  appendPre('No upcoming events found.');
              }
      }

      function appendPre(message) {
         authorizeDiv.style.display = 'none';
          var pre = document.getElementById('output');
          var textContent = document.createTextNode(message + '\n');
          pre.appendChild(textContent);
      }

      var authorize_button = document.querySelector('#authorize-calendar');
      authorize_button.addEventListener('click', handleAuthClick.bind(authorize_button));

      var authorize_contacts = document.querySelector('#authorize-contacts');
      authorize_contacts.addEventListener('click', handleAuthClick.bind(authorize_contacts));