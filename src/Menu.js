import { animate } from './utils';

export default class Menu {
  constructor(buttons) {
    this.itemsElement = document.getElementById('menu-items');
    this.buttonElement = document.getElementById('menu-toggle-button');
    this.iconElement = document.getElementById('menu-toggle-icon');

    this.buttons = buttons;
    this.isOpen = false;
    this.delay = 0.05;

    buttons.forEach((button) => button.appendTo(this.itemsElement));

    const angleStep = 90 / (buttons.length - 1);
    buttons.forEach((button, i) => {
      const angle = angleStep * i + 270;
      button.container.style.transform = `rotate(-${angle}deg)`;
      button.iconElement.style.transform = `rotate(${angle}deg)`;
    });

    this.buttonElement.addEventListener('touchstart', (ev) => this.handleClick(ev));
    this.buttonElement.addEventListener('mousedown', (ev) => this.handleClick(ev));
  }

  handleClick(ev) {
    ev.preventDefault();

    const duration = 0.2;
    if (this.isOpen) {
      this.isOpen = false;
      this.buttons.forEach((button, i) => button.close(i * this.delay));
      animate(duration, 0, (time) => {
        const rot = -45 * (1.0 - time / duration);
        this.iconElement.style.transform = `rotate(${rot}deg)`;
      });
    } else {
      this.isOpen = true;
      this.buttons.forEach((button, i) => button.open(i * this.delay));
      animate(duration, 0, (time) => {
        const rot = -45 * time / duration;
        this.iconElement.style.transform = `rotate(${rot}deg)`;
      });
    }
  }
}
