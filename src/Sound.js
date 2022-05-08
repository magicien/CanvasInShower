export default class Sound {
  constructor(url, loop = true) {
    this.isPlaying = false;
    this.isStarted = false;
    this.isReady = false;
    this.context = new AudioContext();
    this.source = this.context.createBufferSource();

    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      this.context.decodeAudioData(
        request.response,
        (response) => {
          this.source.buffer = response;
          this.source.loop = loop;
          this.source.loopStart = 0.5;
          this.source.loopEnd = response.duration - 0.5;
        },
        () => {
          // Error
        },
      );
    };
    request.send();
  }

  play() {
    if (this.isPlaying) {
      return;
    }

    if (!this.isStarted) {
      this.source.connect(this.context.destination);
      this.source.start(0);
      this.isStarted = true;
    } else {
      this.context.resume();
    }
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying) {
      return;
    }
    this.context.suspend();
    this.isPlaying = false;
  }
}
