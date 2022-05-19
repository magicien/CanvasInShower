import Button from './Button';
import Canvas from './Canvas';
import Menu from './Menu';
import Sound from './Sound';
import { animate, addPressEvent, stopPressEventPropagation } from './utils';

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('touchmove', (event) => {
    event.preventDefault();
  });
  window.addEventListener('touchstart', (event) => {
    event.preventDefault();
  });

  const root = document.getElementById('root');
  const canvas = new Canvas();
  canvas.readyPromise.then(() => {
    canvas.loadDrawingURL();
  });
  canvas.appendTo(root);
  canvas.play();

  const sound = new Sound('./rain.mp3');
  const bgm = new Button('sound', 'volume-xmark', () => {
    if (!sound.isPlaying) {
      bgm.setIcon('volume-high');
      sound.play();
    } else {
      bgm.setIcon('volume-xmark');
      sound.pause();
    }
  });

  const reset = new Button('reset', 'wind', () => {
    canvas.resetDrawing();
  });

  const screenshot = new Button('screenshot', 'camera', () => {
    const flash = document.getElementById('flash');
    flash.style.opacity = 1;
    flash.style.visibility = 'visible';
    const flashDur = 0.5;
    animate(flashDur, 0, (t) => {
      flash.style.opacity = 1.0 - t / flashDur;
    }, () => {
      flash.style.visibility = 'hidden';
    });

    canvas.screenshot().then((image) => {
      const dur1 = 0.5;
      const maxBlur = 5;
      animate(dur1, 0, (t) => {
        const blur = Math.floor(t / dur1 * maxBlur);
        root.style.filter = `blur(${blur}px)`;
      });

      image.className = 'ss-image';
      image.id = 'ss';
      image.alt = 'photo.png';
      const oldImage = document.getElementById('ss');
      oldImage.replaceWith(image);

      const wrapper = document.getElementById('ss-wrapper');
      wrapper.style.visibility = 'visible';
    });
  });
  const closeScreenshot = () => {
    const dur1 = 0.5;
    const maxBlur = 5;
    animate(dur1, 0, (t) => {
      const blur = maxBlur - Math.floor(t / dur1 * maxBlur);
      root.style.filter = `blur(${blur}px)`;
    });

    const wrapper = document.getElementById('ss-wrapper');
    wrapper.style.visibility = 'hidden';
  };
  addPressEvent('ss-wrapper', closeScreenshot);
  stopPressEventPropagation('ss-frame');
  addPressEvent('ss-close', closeScreenshot);

  const save = new Button('save', 'arrow-up-from-bracket', () => {
    const dur1 = 0.5;
    const maxBlur = 5;
    animate(dur1, 0, (t) => {
      const blur = Math.floor(t / dur1 * maxBlur);
      root.style.filter = `blur(${blur}px)`;
    });

    const [url, overflow] = canvas.generateDrawingURL();
    const wrapper = document.getElementById('save-wrapper');

    const urlInput = document.getElementById('save-url');
    urlInput.value = url;

    const overflowWarning = document.getElementById('save-warning-text');
    overflowWarning.style.display = overflow ? 'block' : 'none';

    const copiedMessage = document.getElementById('copied-message-wrapper');
    copiedMessage.style.visibility = 'hidden';

    const link = document.getElementById('save-url-twitter-link');
    link.href = `https://twitter.com/share?text=%E2%98%94&url=${url}`;

    if (!navigator.share) {
      const shareButton = document.getElementById('save-url-share');
      shareButton.style.display = 'none';
    }

    wrapper.style.visibility = 'visible';
  });
  const closeSave = () => {
    const dur1 = 0.5;
    const maxBlur = 5;
    animate(dur1, 0, (t) => {
      const blur = maxBlur - Math.floor(t / dur1 * maxBlur);
      root.style.filter = `blur(${blur}px)`;
    });

    const wrapper = document.getElementById('save-wrapper');
    wrapper.style.visibility = 'hidden';
  };
  addPressEvent('copy-url-button', () => {
    const urlInput = document.getElementById('save-url');

    const showMessage = () => {
      const message = document.getElementById('copied-message-wrapper');
      message.style.opacity = 0;
      message.style.visibility = 'visible';

      const dur = 0.1;
      const delay = 1.0;
      animate(dur, 0, (t) => {
        message.style.opacity = t / dur;
      }, () => {
        animate(dur, delay, (t) => {
          message.style.opacity = 1.0 - t / dur;
        }, () => {
          message.style.visibility = 'hidden';
        });
      });
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(urlInput.value).then(showMessage, () => {
        // Error
      });
    } else {
      urlInput.contentEditable = true;
      urlInput.readOnly = false;
      const range = document.createRange();
      range.selectNodeContents(urlInput);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      urlInput.setSelectionRange(0, 100000);
      document.execCommand('copy');
      urlInput.contentEditable = false;
      urlInput.readOnly = true;
      window.getSelection().removeAllRanges();

      showMessage();
    }
  });
  addPressEvent('save-url-share', () => {
    if (!navigator.share) {
      return;
    }

    const urlInput = document.getElementById('save-url');
    navigator.share({
      title: 'しぐれうい先生誕生日記念非公式ファンアート',
      text: '☔',
      url: urlInput.value,
    });
  });
  addPressEvent('save-wrapper', closeSave);
  stopPressEventPropagation('save-frame');
  addPressEvent('save-close', closeSave);

  const desc = document.getElementById('description');
  const help = new Button('help', 'question', () => {
    desc.scrollTop = 0;
    desc.scrollLeft = 0;
    desc.style.visibility = 'visible';

    const dur1 = 0.5;
    const maxBlur = 5;
    animate(dur1, 0, (t) => {
      const blur = Math.floor(t / dur1 * maxBlur);
      root.style.filter = `blur(${blur}px)`;
    });

    const dur2 = 0.5;
    animate(dur2, 0, (t) => {
      desc.style.opacity = t / dur2;
    });
  });

  const closeDesc = () => {
    const dur1 = 0.5;
    const maxBlur = 5;
    animate(dur1, 0, (t) => {
      const blur = maxBlur - Math.floor(t / dur1 * maxBlur);
      root.style.filter = `blur(${blur}px)`;
    });

    const dur2 = 0.5;
    animate(dur2, 0, (t) => {
      desc.style.opacity = 1.0 - t / dur2;
    }, () => {
      desc.style.visibility = 'hidden';
    });
  };
  addPressEvent('description-close', closeDesc);
  stopPressEventPropagation('description-outer-wrapper');
  addPressEvent('description', closeDesc);

  const buttons = [bgm, reset, screenshot, save, help];
  // eslint-disable-next-line no-unused-vars
  const menu = new Menu(buttons);
});
