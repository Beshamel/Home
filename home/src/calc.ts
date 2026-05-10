// Parenthesis request levels :
// -1 : %
// 0 : +-
// 1 : */
// 2 : ^!

export interface Expression {
  display: (reqP?: boolean, reqL?: number) => string
  evaluate: () => number
}

class Number implements Expression {
  value: number
  displayStr: string

  display = () => this.displayStr

  evaluate = () => {
    return this.value
  }

  constructor(value: number, display: string) {
    this.value = value
    this.displayStr = display
  }
}

class Function implements Expression {
  args: Expression[]
  f: (...args: number[]) => number
  display: (reqP?: boolean, reqL?: number) => string

  evaluate: () => number = () => {
    try {
      return this.f(...this.args.map((arg) => arg.evaluate()))
    } catch {
      throw Error("Evaluation error")
    }
  }

  constructor(
    f: (...args: number[]) => number,
    display: (reqP?: boolean, reqL?: number) => string,
    ...args: Expression[]
  ) {
    this.args = args
    this.f = f
    this.display = display
  }
}

interface Symbol {
  pos: number
  f: (...args: number[]) => number
  display: (reqP?: boolean, reqL?: number, ...args: Expression[]) => string
}

interface FuncSymbol {
  symb: string
  f: (...args: number[]) => number
  display: (...args: Expression[]) => string
  validateInput?: (...args: number[]) => boolean
  errorMsg?: string
}

interface ConstantSymbol {
  symb: string
  value: number
  display: string
}

const constantsLib: ConstantSymbol[] = [
  {
    symb: "pi",
    value: Math.PI,
    display: "\\pi",
  },
  {
    symb: "e",
    value: Math.E,
    display: "e",
  },
]

const singleArgFunctionLib: FuncSymbol[] = [
  {
    symb: "sqrt",
    f: Math.sqrt,
    display: (arg) => `\\sqrt\{${arg.display()}\}`,
    validateInput: (x) => x >= 0,
    errorMsg: "Negative root",
  },
  {
    symb: "ln",
    f: Math.log,
    display: (arg) => `\\ln(${arg.display()})`,
    validateInput: (x) => x > 0,
    errorMsg: "Negative log",
  },
  {
    symb: "cos",
    f: Math.cos,
    display: (arg) => `\\cos\\left(${arg.display()}\\right)`,
  },
  {
    symb: "sin",
    f: Math.sin,
    display: (arg) => `\\sin\\left(${arg.display()}\\right)`,
  },
  {
    symb: "tan",
    f: Math.tan,
    display: (arg) => `\\tan\\left(${arg.display()}\\right)`,
  },
  {
    symb: "acos",
    f: Math.acos,
    display: (arg) => `\\acos\\left(${arg.display()}\\right)`,
  },
  {
    symb: "asin",
    f: Math.asin,
    display: (arg) => `\\asin\\left(${arg.display()}\\right)`,
  },
  {
    symb: "atan",
    f: Math.atan,
    display: (arg) => `\\atan\\left(${arg.display()}\\right)`,
  },
  {
    symb: "ch",
    f: Math.cosh,
    display: (arg) => `\\cosh\\left(${arg.display()}\\right)`,
  },
  {
    symb: "sh",
    f: Math.sinh,
    display: (arg) => `\\sinh\\left(${arg.display()}\\right)`,
  },
  {
    symb: "exp",
    f: Math.exp,
    display: (arg) => `\\exp\\left(${arg.display()}\\right)`,
  },
  {
    symb: "abs",
    f: Math.abs,
    display: (arg) => `\\left| ${arg.display()} \\right|`,
  },
  {
    symb: "floor",
    f: Math.floor,
    display: (arg) => `\\left\\lfloor ${arg.display()} \\right\\rfloor`,
  },
]

function fact(n: number): number {
  if (n < 0) throw new Error("Negative factorial")
  if (n != Math.floor(n)) throw new Error("Non-int factorial")
  if (n <= 1) return 1
  return n * fact(n - 1)
}

function bracketise(s: string, b: boolean) {
  return b ? `\\left(${s}\\right)` : s
}

export function parseMath(input: string): Expression {
  input = input.trim()
  if (input === "") throw Error("Empty string")

  function cutAt(s: Symbol, ignoreTrailing: boolean = true) {
    if (s.pos === input.length - 1) {
      if (!ignoreTrailing) throw new Error("Trailing symbol")
      return parseMath(input.slice(0, -1))
    }
    const args = [
      parseMath(input.slice(0, s.pos)),
      parseMath(input.slice(s.pos + 1)),
    ]
    return new Function(
      s.f,
      (reqP, reqL) => s.display(reqP, reqL, ...args),
      ...args,
    )
  }

  function readWord(at: number = 0) {
    let i = at
    while (i < input.length && input[i].match(/[a-z]/i)) i++
    return input.slice(0, i)
  }

  if (input[0] === "(" && input[input.length - 1] === ")")
    return parseMath(input.slice(1, -1))

  let i = -1
  let depth = 0
  let lastAdditive: Symbol | null = null
  let lastMultiplicative: Symbol | null = null
  let lastModulo: Symbol | null = null
  let lastPower: Symbol | null = null
  do {
    i++
    if (input[i] === "(") {
      depth++
      continue
    }
    if (input[i] === ")") {
      depth--
      continue
    }

    if (depth < 0) throw Error(`Invalid bracketting (depth = ${depth})`)
    if (depth === 0) {
      if (input[i] === "%")
        lastModulo = {
          pos: i,
          f: (a, b) => a % b,
          display: (reqP = false, reqL, a, b) =>
            bracketise(
              `${a.display(true, -1)} \\mod ${b.display(true, 1)}`,
              reqP && reqL! >= -1,
            ),
        }
      if (input[i] === "+")
        lastAdditive = {
          pos: i,
          f: (a, b) => a + b,
          display: (reqP = false, reqL, a, b) =>
            bracketise(`${a.display()} + ${b.display()}`, reqP && reqL! >= 0),
        }
      if (input[i] === "-" && i > 0) {
        lastAdditive = {
          pos: i,
          f: (a, b) => a - b,
          display: (reqP = false, reqL, a, b) =>
            bracketise(
              `${a.display()} - ${b.display(true, 0)}`,
              reqP && reqL! >= 0,
            ),
        }
      }
      if (input[i] === "*")
        lastMultiplicative = {
          pos: i,
          f: (a, b) => a * b,
          display: (reqP = false, reqL, a, b) =>
            bracketise(
              `${a.display(true, 1)} \\times ${b.display(true, 1)}`,
              reqP && reqL! > 1,
            ),
        }
      if (input[i] === "/") {
        lastMultiplicative = {
          pos: i,
          f: (a, b) => {
            if (b === 0) throw new Error("Division by 0")
            return a / b
          },
          display: (reqP = false, reqL, a, b) =>
            bracketise(
              `\\frac\{${a.display()}\}\{${b.display()}\}`,
              reqP && reqL! > 1,
            ),
        }
      }
      if (input[i] === "^")
        lastPower = {
          pos: i,
          f: (a, b) => {
            if ((a <= 0 && b != Math.floor(b)) || (a === 0 && b < 0))
              throw new Error("Invalid power")
            return Math.pow(a, b)
          },
          display: (reqP = false, reqL, a, b) =>
            bracketise(
              `\{${a.display(true, 2)}\}^\{${b.display()}\}`,
              reqP && reqL! >= 2,
            ),
        }
    }
  } while (i < input.length)

  // Check for parenthesis left open
  if (depth > 0) return parseMath(input + ")")

  // Check for symbols in order of priority
  if (lastModulo) return cutAt(lastModulo)
  if (lastAdditive) return cutAt(lastAdditive)
  if (lastMultiplicative) return cutAt(lastMultiplicative)
  if (lastPower) return cutAt(lastPower)

  // Check for functions
  if (input[0] === "-") {
    const arg = parseMath(input.slice(1))
    return new Function(
      (x) => -x,
      (reqP = false, reqL) =>
        bracketise(`-${arg.display(true, 0)}`, reqP && reqL! >= 0),
      arg,
    )
  }

  if (input[input.length - 1] === "!") {
    const arg = parseMath(input.slice(0, -1))
    return new Function(
      fact,
      (reqP = false, reqL) =>
        bracketise(`${arg.display(true, 2)}!`, reqP && reqL! >= 2),
      arg,
    )
  }

  const word0 = readWord().toLowerCase()

  for (var func of singleArgFunctionLib) {
    if (word0 === func.symb) {
      const arg = parseMath(input.slice(func.symb.length))
      return new Function(
        (x) => {
          if (func.validateInput && !func.validateInput(x))
            throw new Error(func.errorMsg)
          return func.f(x)
        },
        () => func.display(arg),
        arg,
      )
    }
  }

  // Check for known constants
  for (var c of constantsLib) {
    if (word0 === c.symb) {
      return new Number(c.value, c.display)
    }
  }

  // Read raw number
  const cleanInput = input.replaceAll(" ", "")
  const x = parseFloat(cleanInput)
  if (isNaN(x)) throw Error(`Unreadable float ${cleanInput}`)
  return new Number(x, x.toString())
}
