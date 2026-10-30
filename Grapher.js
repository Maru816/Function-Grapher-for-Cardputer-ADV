// Visible graph range; includes negative y-values.
// Operators: + - * / ^ and parentheses.
// Multiplication can be written as 2*x or 2x.
// Functions: sin, cos, tan, sqrt, abs, ln, log, exp.
var xMin = -5;
var xMax = 5;
var yMin = -10;
var yMax = 10;

var display = require("display");
var keyboard = require("keyboard");
var width = display.width();
var height = display.height();
var black = display.color(0, 0, 0);
var white = display.color(255, 255, 255);
var gray = display.color(100, 100, 100);
var curveColor = display.color(0, 255, 255);

function evaluateFormula(text, x) {
    var position = 0;

    function skipSpaces() {
        while (position < text.length && text.charAt(position) == " ") {
            position++;
        }
    }

    function parseExpression() {
        var value = parseTerm();
        skipSpaces();
        while (position < text.length) {
            var operator = text.charAt(position);
            if (operator != "+" && operator != "-") {
                break;
            }
            position++;
            var next = parseTerm();
            if (operator == "+") {
                value = value + next;
            } else {
                value = value - next;
            }
            skipSpaces();
        }
        return value;
    }

    function parseTerm() {
        var value = parseUnary();
        skipSpaces();
        while (position < text.length) {
            var operator = text.charAt(position);
            if (operator == "*" || operator == "/") {
                position++;
                var next = parseUnary();
                if (operator == "*") {
                    value = value * next;
                } else {
                    value = value / next;
                }
            } else if (isPrimaryStart(operator)) {
                value = value * parseUnary();
            } else {
                break;
            }
            skipSpaces();
        }
        return value;
    }

    function isPrimaryStart(character) {
        return character == "(" || character == "." ||
            (character >= "0" && character <= "9") ||
            (character >= "a" && character <= "z") ||
            (character >= "A" && character <= "Z");
    }

    function parseUnary() {
        skipSpaces();
        var operator = text.charAt(position);
        if (operator == "+") {
            position++;
            return parseUnary();
        }
        if (operator == "-") {
            position++;
            return -parseUnary();
        }
        return parsePower();
    }

    function parsePower() {
        var value = parsePrimary();
        skipSpaces();
        if (text.charAt(position) == "^") {
            position++;
            value = Math.pow(value, parseUnary());
        }
        return value;
    }

    function parsePrimary() {
        skipSpaces();
        var character = text.charAt(position);

        if (character == "(") {
            position++;
            var value = parseExpression();
            skipSpaces();
            if (text.charAt(position) != ")") {
                throw "Missing closing parenthesis";
            }
            position++;
            return value;
        }

        if ((character >= "0" && character <= "9") || character == ".") {
            var start = position;
            var hasDigit = false;
            while (position < text.length) {
                character = text.charAt(position);
                if (character >= "0" && character <= "9") {
                    hasDigit = true;
                    position++;
                } else if (character == ".") {
                    position++;
                } else {
                    break;
                }
            }
            if (!hasDigit) {
                throw "Invalid number";
            }
            return parseFloat(text.substring(start, position));
        }

        if ((character >= "a" && character <= "z") ||
            (character >= "A" && character <= "Z")) {
            var nameStart = position;
            while (position < text.length) {
                character = text.charAt(position);
                if ((character >= "a" && character <= "z") ||
                    (character >= "A" && character <= "Z")) {
                    position++;
                } else {
                    break;
                }
            }
            var name = text.substring(nameStart, position);
            skipSpaces();

            if (text.charAt(position) == "(") {
                position++;
                var argument = parseExpression();
                skipSpaces();
                if (text.charAt(position) != ")") {
                    throw "Missing closing parenthesis";
                }
                position++;
                if (name == "sin") return Math.sin(argument);
                if (name == "cos") return Math.cos(argument);
                if (name == "tan") return Math.tan(argument);
                if (name == "sqrt") return Math.sqrt(argument);
                if (name == "abs") return Math.abs(argument);
                if (name == "ln") return Math.log(argument);
                if (name == "log") return Math.log(argument) / Math.LN10;
                if (name == "exp") return Math.exp(argument);
                throw "Unknown function: " + name;
            }

            if (name == "x") return x;
            if (name == "pi") return Math.PI;
            if (name == "e") return Math.E;
            throw "Unknown variable: " + name;
        }

        throw "Incomplete expression";
    }

    var result = parseExpression();
    skipSpaces();
    if (position != text.length) {
        throw "Unexpected character in formula";
    }
    return result;
}

function tickStep(minimum, maximum) {
    var roughStep = (maximum - minimum) / 5;
    var magnitude = Math.pow(10, Math.floor(Math.log(roughStep) / Math.LN10));
    var normalized = roughStep / magnitude;
    var multiplier;
    if (normalized <= 1) {
        multiplier = 1;
    } else if (normalized <= 2) {
        multiplier = 2;
    } else if (normalized <= 5) {
        multiplier = 5;
    } else {
        multiplier = 10;
    }
    return multiplier * magnitude;
}

function tickLabel(value) {
    var rounded = Math.round(value * 100) / 100;
    if (Math.abs(rounded) < 0.005) {
        rounded = 0;
    }
    return String(rounded);
}

function drawGraph() {
    if (xMax <= xMin || yMax <= yMin) {
        throw "Minimum must be less than maximum";
    }

    var left = 27;
    var right = width - 5;
    var top = 17;
    var bottom = height - 22;

    display.fill(black);
    display.setTextSize(1);
    display.setTextColor(white);
    display.drawString("f(x)=" + formula, 4, 3);
    display.drawString("Arrows=move  ESC=exit", 4, height - 9);

    var xStep = tickStep(xMin, xMax);
    var yStep = tickStep(yMin, yMax);
    var tick;
    var screenPosition;
    for (tick = Math.ceil(xMin / xStep) * xStep; tick <= xMax + xStep * 0.0001; tick += xStep) {
        screenPosition = Math.round(left + (tick - xMin) * (right - left) / (xMax - xMin));
        display.drawLine(screenPosition, top, screenPosition, bottom, gray);
        var labelX = screenPosition - 7;
        if (labelX < left) labelX = left;
        if (labelX > right - 18) labelX = right - 18;
        display.drawString(tickLabel(tick), labelX, bottom + 3);
    }
    for (tick = Math.ceil(yMin / yStep) * yStep; tick <= yMax + yStep * 0.0001; tick += yStep) {
        screenPosition = Math.round(bottom - (tick - yMin) * (bottom - top) / (yMax - yMin));
        display.drawLine(left, screenPosition, right, screenPosition, gray);
        display.drawString(tickLabel(tick), 1, screenPosition - 3);
    }

    if (xMin <= 0 && xMax >= 0) {
        var axisX = Math.round(left + (0 - xMin) * (right - left) / (xMax - xMin));
        display.drawLine(axisX, top, axisX, bottom, white);
    }
    if (yMin <= 0 && yMax >= 0) {
        var axisY = Math.round(bottom - (0 - yMin) * (bottom - top) / (yMax - yMin));
        display.drawLine(left, axisY, right, axisY, white);
    }

    var previousX = 0;
    var previousY = 0;
    var previousValid = false;
    var pixel;
    for (pixel = 0; pixel <= right - left; pixel++) {
        var x = xMin + pixel * (xMax - xMin) / (right - left);
        var y;
        try {
            y = evaluateFormula(formula, x);
        } catch (error) {
            display.fill(black);
            display.setTextColor(white);
            display.drawString("Formula error", 4, 25);
            display.drawString(String(error), 4, 40);
            return;
        }

        if (isNaN(y) || y < yMin || y > yMax) {
            previousValid = false;
            continue;
        }

        var screenX = left + pixel;
        var screenY = Math.round(bottom - (y - yMin) * (bottom - top) / (yMax - yMin));
        if (previousValid) {
            display.drawLine(previousX, previousY, screenX, screenY, curveColor);
        } else {
            display.drawPixel(screenX, screenY, curveColor);
        }
        previousX = screenX;
        previousY = screenY;
        previousValid = true;
    }
}

var formula = keyboard.keyboard("", 80, "Formula only, e.g. x^2");
if (formula != "") {
    drawGraph();
    while (!keyboard.getEscPress()) {
        var keys = keyboard.getKeysPressed();
        if (keys.length > 0) {
            var movement = (xMax - xMin) / 10;
            var verticalMovement = (yMax - yMin) / 10;
            var moved = false;
            switch (keys[0]) {
                case ",":
                    xMin = xMin - movement;
                    xMax = xMax - movement;
                    moved = true;
                    break;
                case "/":
                    xMin = xMin + movement;
                    xMax = xMax + movement;
                    moved = true;
                    break;
                case ";":
                    yMin = yMin + verticalMovement;
                    yMax = yMax + verticalMovement;
                    moved = true;
                    break;
                case ".":
                    yMin = yMin - verticalMovement;
                    yMax = yMax - verticalMovement;
                    moved = true;
                    break;
            }
            if (moved) {
                drawGraph();
            }
        }
        delay(50);
    }
}
