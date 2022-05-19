import {
  easeInOut, elasticOut, quintIn, quintInOut, animate,
} from './utils';

export default class Button {
  constructor(id, icon, onClick) {
    this.id = id;
    this.icon = icon;
    this.onClick = onClick;
    this.moveY = 135;
  }

  appendTo(parent) {
    const html = `
      <li id='${this.id}-container' class='menu-item'>
        <button id='${this.id}' class='menu-item-button'>
          <i id='${this.id}-icon' class='menu-item-icon fa-solid fa-${this.icon}'></i>
        </button>
        <div id='${this.id}-bounce' class='menu-item-bounce'></div>
      </li>
    `;
    parent.insertAdjacentHTML('beforeend', html);
    this.element = document.getElementById(this.id);
    this.element.addEventListener('touchstart', (ev) => this.handleClick(ev));
    this.element.addEventListener('mousedown', (ev) => this.handleClick(ev));
    this.element.style.top = '0';
    this.element.style.right = '0';

    this.iconElement = document.getElementById(`${this.id}-icon`);
    this.bounce = document.getElementById(`${this.id}-bounce`);
    this.container = document.getElementById(`${this.id}-container`);
  }

  setIcon(icon) {
    this.iconElement.classList.replace(`fa-${this.icon}`, `fa-${icon}`);
    this.element.style.right = 1;
    setTimeout(() => {
      this.element.style.right = 0;
    }, 10);
    this.icon = icon;
  }

  handleClick(ev) {
    ev.preventDefault();
    if (this.onClick) {
      this.onClick(ev);
    }
  }

  open(delay) {
    const startY = parseInt(this.element.style.top, 10) || 0;
    const dy = this.moveY - startY;

    const duration = 0.5;
    animate(duration, delay, (time) => {
      const t = Math.min(time / duration, 1.0);
      const newY = startY + dy * quintInOut(t);
      this.element.style.top = `${newY}px`;
    }, () => {
      this.element.style.top = `${this.moveY + 1}px`;
    });

    const duration2 = 3.35;
    animate(duration2, delay, (time) => {
      if (time < 0.2) {
        const v = easeInOut(time / 0.2);
        const sx = 1.0 - 0.2 * v;
        const sy = 1.0 + 0.2 * v;
        this.bounce.style.transform = `scale(${sx}, ${sy})`;
      } else if (time < 0.35) {
        const v = easeInOut((time - 0.2) / 0.15);
        const sy = 1.2 - 0.5 * v;
        this.bounce.style.transform = `scale(0.8, ${sy})`;
      } else {
        const t = Math.min(1, (time - 0.35) / 3);
        const v = elasticOut(t);
        const sy = 0.5 + 0.3 * v;
        this.bounce.style.transform = `scale(0.8, ${sy})`;
      }
    });
  }

  close(delay) {
    const startY = parseInt(this.element.style.top, 10) || 0;
    const dy = -startY;

    const duration = 0.3;
    animate(duration, delay, (time) => {
      const t = Math.min(time / duration, 1.0);
      const newY = startY + dy * quintIn(t);
      this.element.style.top = `${newY}px`;
    });

    const duration2 = 3.35;
    animate(duration2, delay, (time) => {
      if (time < 0.2) {
        const v = easeInOut(time / 0.2);
        const sx = 0.8 + 0.2 * v;
        this.bounce.style.transform = `scale(${sx}, 0.8)`;
      } else if (time < 0.35) {
        const v = easeInOut((time - 0.2) / 0.15);
        const sy = 0.8 + 0.4 * v;
        this.bounce.style.transform = `scale(1.0, ${sy})`;
      } else {
        const t = Math.min(1, (time - 0.35) / 3);
        const v = elasticOut(t);
        const sy = 1.2 - 0.2 * v;
        this.bounce.style.transform = `scale(1.0, ${sy})`;
      }
    });
  }
}
