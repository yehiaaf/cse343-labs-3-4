
const MAX_DIGITS = 12;
const SYMBOLS = { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7" };

const display = document.getElementById("result");
const expressionLine = document.getElementById("expression");
const buttons = document.querySelectorAll(".key");

let current = "0";           
let tokens = [];              
let startNew = true;          
let lastWasOperator = false;  
let hasError = false;         


function compute(a, op, b) {
  let answer;
  if (op === "+") answer = a + b;
  else if (op === "-") answer = a - b;
  else if (op === "*") answer = a * b;
  else answer = b === 0 ? NaN : a / b;

  if (!Number.isFinite(answer)) return null;
  return answer;
}

function calculate(list) {
  const items = list.slice(); 

  let i = 1;
  while (i < items.length) {
    if (items[i] === "*" || items[i] === "/") {
      const answer = compute(items[i - 1], items[i], items[i + 1]);
      if (answer === null) return null;
      items.splice(i - 1, 3, answer); 
    } else {
      i += 2; 
    }
  }

  while (items.length > 1) {
    const answer = compute(items[0], items[1], items[2]);
    if (answer === null) return null;
    items.splice(0, 3, answer);
  }
  return items[0];
}

function format(number) {
  const rounded = parseFloat(number.toPrecision(12));
  if (Math.abs(rounded) >= 1e15) return rounded.toExponential();
  return String(rounded);
}

function addCommas(text) {
  if (text === "Error" || text.includes("e")) return text;
  const parts = text.split(".");
  parts[0] = Number(parts[0]).toLocaleString("en-US");
  return parts.join(".");
}

function showError() {
  current = "Error";
  tokens = [];
  startNew = true;
  lastWasOperator = false;
  hasError = true;
}

function clearAll() {
  current = "0";
  tokens = [];
  startNew = true;
  lastWasOperator = false;
  hasError = false;
}


function pressDigit(digit) {
  const firstDigit = digit === "00" ? "0" : digit;
  if (startNew || current === "0") {
    current = firstDigit;
  } else if (current.replace(".", "").length + digit.length <= MAX_DIGITS) {
    current += digit;
  }
  startNew = false;
  lastWasOperator = false;
}

function pressDecimal() {
  if (startNew) current = "0.";
  else if (!current.includes(".")) current += ".";
  startNew = false;
  lastWasOperator = false;
}

function pressOperator(op) {
  if (lastWasOperator) {
    tokens[tokens.length - 1] = op; 
  } else {
    tokens.push(Number(current));
    tokens.push(op);
  }
  lastWasOperator = true;
  startNew = true;
  showResultSoFar();
}

function showResultSoFar() {
  const op = tokens[tokens.length - 1];
  let part = tokens.slice(0, -1); 

  if (op === "*" || op === "/") {
    let start = 0;
    for (let i = 1; i < part.length; i += 2) {
      if (part[i] === "+" || part[i] === "-") start = i + 1;
    }
    part = part.slice(start);
  }

  const value = calculate(part);
  if (value === null) showError();
  else current = format(value);
}

function pressEquals() {
  if (tokens.length === 0) return;
  tokens.push(Number(current));
  const answer = calculate(tokens);
  if (answer === null) {
    showError();
    return;
  }
  current = format(answer);
  tokens = [];
  startNew = true;
  lastWasOperator = false;
}

function pressPercent() {
  current = format(Number(current) / 100);
  startNew = true;
  lastWasOperator = false;
}

function pressBackspace() {
  if (startNew) return; 
  current = current.length > 1 ? current.slice(0, -1) : "0";
}


function updateScreen() {
  const shown = addCommas(current);
  display.textContent = shown;

  if (shown.length > 14) display.dataset.size = "xs";
  else if (shown.length > 10) display.dataset.size = "sm";
  else display.dataset.size = "md";

  let text = "";
  for (const item of tokens) {
    if (typeof item === "number") text += addCommas(format(item)) + " ";
    else text += SYMBOLS[item] + " ";
  }
  expressionLine.textContent = text.trim();

  const waiting = lastWasOperator ? tokens[tokens.length - 1] : null;
  for (const button of buttons) {
    if (button.dataset.type === "operator") {
      button.classList.toggle("active", button.dataset.value === waiting);
    }
  }
}


function handleKey(type, value) {
  if (hasError && type !== "clear") clearAll(); 

  if (type === "digit") pressDigit(value);
  else if (type === "decimal") pressDecimal();
  else if (type === "operator") pressOperator(value);
  else if (type === "equals") pressEquals();
  else if (type === "percent") pressPercent();
  else if (type === "backspace") pressBackspace();
  else if (type === "clear") clearAll();

  updateScreen();
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    handleKey(button.dataset.type, button.dataset.value);
  });
});

document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  if (key.length === 1 && key >= "0" && key <= "9") handleKey("digit", key);
  else if (key === "+" || key === "-" || key === "*" || key === "/") handleKey("operator", key);
  else if (key === "Enter" || key === "=") handleKey("equals");
  else if (key === ".") handleKey("decimal");
  else if (key === "%") handleKey("percent");
  else if (key === "Backspace") handleKey("backspace");
  else if (key === "Escape" || key === "c" || key === "C") handleKey("clear");
  else return; 

  event.preventDefault();
});

updateScreen();
