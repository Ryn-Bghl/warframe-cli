// renderer.js
export class Renderer {
  #lastFrame = "";

  clear() {
    process.stdout.write("\x1b[2J\x1b[H");
  }

  render(content) {
    if (content === this.#lastFrame) return; // skip identical frames
    this.clear();
    process.stdout.write(content);
    this.#lastFrame = content;
  }
}
