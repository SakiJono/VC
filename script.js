const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  // top画面をクリック
  const container = document.getElementById('container');
  const logo = document.getElementById('logo');
  const top2 = document.getElementById('top2');
  const top3 = document.getElementById('top3');
  const top4 = document.getElementById('top4');

  logo.onclick = function () {
    logo.style.zIndex = 5;
    top2.style.zIndex = 4;
    top3.style.zIndex = 3;
    top4.style.zIndex = 2;
    container.style.zIndex = 20;
  };




  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  // 自分をミュートにする
  // トラックを取り出す
  var videoTrackMe = localStream.getVideoTracks()[0];
  var audioTrackMe = localStream.getAudioTracks()[0];
  const MyMuteVoiceBtn = document.getElementById('MyMuteVoiceBtn');
  const MyMuteVideoBtn = document.getElementById('MyMuteVideoBtn');

  MyMuteVoiceBtn.addEventListener('click', muteMyVoice);
  MyMuteVideoBtn.addEventListener('click', muteMyVideo);

  // Voiceのミュート切り替え
  function muteMyVoice() {

    if (MyMuteVoiceBtn.classList.contains('setMute')) {
      audioTrackMe.enabled = true;
      MyMuteVoiceBtn.classList.toggle('setMute');
      MyMuteVoiceBtn.style.backgroundImage = 'url(../img/micoff.png)'

    } else {
      MyMuteVoiceBtn.classList.toggle('setMute');
      audioTrackMe.enabled = false;
      MyMuteVoiceBtn.style.backgroundImage = 'url(../img/micon.png)'
    }
  }

  // Videoのミュート切り替え
  function muteMyVideo() {

    if (MyMuteVideoBtn.classList.contains('setMute')) {
      videoTrackMe.enabled = true;
      MyMuteVideoBtn.classList.toggle('setMute');
      MyMuteVideoBtn.style.backgroundImage = 'url(../img/videoon.png)'
    } else {
      videoTrackMe.enabled = false;
      MyMuteVideoBtn.classList.toggle('setMute');
      MyMuteVideoBtn.style.backgroundImage = 'url(../img/videooff.png)'
    }
  }


  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({


    // ここにAPI keyを入れてね★
    key: '1a50df5c-005b-4e50-be24-40dfabe6415c',
    debug: 3,
  }));

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: getRoomModeByHash(),
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);

      // 相手をミュートにする
      // トラックを取り出す
      var videoTrack = stream.getVideoTracks()[0];
      var audioTrack = stream.getAudioTracks()[0];

      const MuteVoiceBtn = document.getElementById('muteVoiceBtn');
      const MuteVideoBtn = document.getElementById('muteVideoBtn');

      MuteVoiceBtn.addEventListener('click', muteVoice);
      MuteVideoBtn.addEventListener('click', muteVideo);

      // Voiceのミュート切り替え
      function muteVoice() {

        if (MuteVoiceBtn.classList.contains('setMute')) {
          audioTrack.enabled = true;
          MuteVoiceBtn.classList.toggle('setMute');
          MuteVoiceBtn.style.backgroundImage = 'url(../img/micoff.png)'
        } else {
          MuteVoiceBtn.classList.toggle('setMute');
          audioTrack.enabled = false;
          MuteVoiceBtn.style.backgroundImage = 'url(../img/micon.png)'
        }
      }

      // Videoのミュート切り替え
      function muteVideo() {

        if (MuteVideoBtn.classList.contains('setMute')) {
          videoTrack.enabled = true;
          MuteVideoBtn.classList.toggle('setMute');
          MuteVideoBtn.style.backgroundImage = 'url(../img/videoon.png)'
        } else {
          videoTrack.enabled = false;
          MuteVideoBtn.classList.toggle('setMute');
          MuteVideoBtn.style.backgroundImage = 'url(../img/videooff.png)'
        }
      }

    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
      // ここでCSSを変更！
      console.log(`ここはデータ${data}`);
      console.log(`ここはソース${src}`);

      // dataにはvalueの値が入っている？
      // ここで相手側のCSSを変更
      if (data == 'Change filter to sepia') {
        document.getElementById('js-remote-streams').style.filter = 'sepia()';
      } else if (data == 'Change filter to grayscale') {
        document.getElementById('js-remote-streams').style.filter = 'grayscale()';
      } else if (data == 'Change filter to blur') {
        document.getElementById('js-remote-streams').style.filter = 'blur(2px)';
      } else if (data == 'Change filter to beautify') {
        document.getElementById('js-remote-streams').style.filter = 'contrast(110%) saturate(130%) brightness(130%)';
      }



    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }

    let valueCSS = "0";

    document.getElementById('testCss1').addEventListener('click', changeCSS1);
    document.getElementById('testCss2').addEventListener('click', changeCSS2);
    document.getElementById('testCss3').addEventListener('click', changeCSS3);
    document.getElementById('testCss4').addEventListener('click', changeCSS4);

    function changeCSS1() {
      valueCSS = document.getElementById('testCss1').value;
      room.send(valueCSS);
      console.log(`ここはCSS${valueCSS}`);

      // ここで自分側のCSSを変更
      if (valueCSS == 'Change filter to sepia') {
        document.getElementById('js-local-stream').style.filter = 'sepia()';
      }
    }

    function changeCSS2() {
      valueCSS = document.getElementById('testCss2').value;
      room.send(valueCSS);
      console.log(`ここはCSS${valueCSS}`);
      if (valueCSS == 'Change filter to grayscale') {
        document.getElementById('js-local-stream').style.filter = 'grayscale()';
      }
    }
    function changeCSS3() {
      valueCSS = document.getElementById('testCss3').value;
      room.send(valueCSS);
      console.log(`ここはCSS${valueCSS}`);
      if (valueCSS == 'Change filter to blur') {
        document.getElementById('js-local-stream').style.filter = 'blur(2px)';
      }
    }
    function changeCSS4() {
      valueCSS = document.getElementById('testCss4').value;
      room.send(valueCSS);
      console.log(`ここはCSS${valueCSS}`);
      if (valueCSS == 'Change filter to beautify') {
        document.getElementById('js-local-stream').style.filter = 'contrast(110%) saturate(130%) brightness(130%)';
      }
    }




  });

  peer.on('error', console.error);
})();