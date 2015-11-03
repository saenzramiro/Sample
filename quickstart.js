var videoElement = document.querySelector('video');
var audioInputSelect = document.querySelector('select#audioSource');
var audioOutputSelect = document.querySelector('select#audioOutput');
var videoSelect = document.querySelector('select#videoSource');
var smallVideoSize = document.querySelector('button#Small');
var mediumVideoSize = document.querySelector('button#Medium');
var largeVideoSize = document.querySelector('button#Large');
var hDVideoSize = document.querySelector('button#HD');
var selectors = [audioInputSelect, audioOutputSelect, videoSelect];
var videoWidth = 320, videoHeight = 240;

function gotDevices(deviceInfos) {
  var values = selectors.map(function(select) {
    return select.value;
  });
  selectors.forEach(function(select) {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label ||
        'microphone ' + (audioInputSelect.length + 1);
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || 'speaker ' +
          (audioOutputSelect.length + 1);
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach(function(select, selectorIndex) {
    if (Array.prototype.slice.call(select.childNodes).some(function(n) {
      return n.value === values[selectorIndex];
    })) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices()
.then(gotDevices)
.catch(errorCallback);

function errorCallback(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    console.log("element : ", element);
    console.log("sinkId : ", sinkId);
    element.setSinkId(sinkId)
    .then(function() {
      console.log('Success, audio output device attached: ' + sinkId);
    })
    .catch(function(error) {
      var errorMessage = error;
      if (error.name === 'SecurityError') {
        errorMessage = 'You need to use HTTPS for selecting audio output ' +
            'device: ' + error;
      }
      console.error(errorMessage);
      audioOutputSelect.selectedIndex = 0;
    });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

function changeAudioDestination() {
  var audioDestination = audioOutputSelect.value;
  attachSinkId(videoElement, audioDestination);
}

smallVideoSize.onclick = function() {
  selectVideoSize(smallVideoSize.value);
};

mediumVideoSize.onclick = function() {
  selectVideoSize(mediumVideoSize.value);
};
largeVideoSize.onclick = function() {
  selectVideoSize(largeVideoSize.value);
};
hDVideoSize.onclick = function() {
  selectVideoSize(hDVideoSize.value);
};

function selectVideoSize(value) {
  if(value == "Small") {
    videoWidth = 320;
    videoHeight = 240;
  } else if(value == "Medium") {
    videoWidth = 640;
    videoHeight = 480;
  } else if(value == "Large") {
    videoWidth = 960;
    videoHeight = 720;
  } else if(value == "HD") {
    videoWidth = 1280;
    videoHeight = 720;
  }
  start();
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  var constraints = {};
  constraints.audio = {optional: [{sourceId: audioSource}]};
  constraints.video = {optional: [{sourceId: videoSource}], mandatory: {minWidth: videoWidth, minHeight: videoHeight, maxWidth: videoWidth, maxHeight: videoHeight}};
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    window.stream = stream;
    videoElement.src = window.URL.createObjectURL(stream);
    videoElement.play();
    return navigator.mediaDevices.enumerateDevices();
  })
  .then(gotDevices)
  .catch(errorCallback);
}

audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;
videoSelect.onchange = start;

start();