import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const readInput = () => {
  rl.question(
    "Quel est le nom de l'objet que vous souhaitez acheter ? ",
    (answer) => {
      console.log(answer);
      rl.close();
    }
  );
};

readInput();
