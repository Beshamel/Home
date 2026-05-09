interface Expression {
  evaluate: () => number
}

class Number implements Expression {
  value: number

  constructor(value: number) {
    this.value = value
  }

  evaluate = () => {
    return this.value
  }
}

class Function implements Expression {
  args: Expression[]
  f: (...args: number[]) => number

  evaluate: () => number = () => {
    try {
      return this.f(...this.args.map((arg) => arg.evaluate()))
    } catch {
      throw Error("Evaluation error")
    }
  }

  constructor(f: (...args: number[]) => number, ...args: Expression[]) {
    this.args = args
    this.f = f
  }
}

interface Symbol {
  pos: number
  f: (...args: number[]) => number
}

interface FuncSymbol {
  symb: string
  f: (...args: number[]) => number
  validateInput?: (...args: number[]) => boolean
  errorMsg?: string
}

interface ConstantSymbol {
  symb: string
  value: number
}

const constantsLib: ConstantSymbol[] = [
  {
    symb: "pi",
    value: Math.PI,
  },
  {
    symb: "e",
    value: Math.E,
  },
]

const singleArgFunctionLib: FuncSymbol[] = [
  {
    symb: "sqrt",
    f: Math.sqrt,
    validateInput: (x) => x >= 0,
    errorMsg: "Negative root",
  },
  {
    symb: "ln",
    f: Math.log,
    validateInput: (x) => x > 0,
    errorMsg: "Negative log",
  },
  {
    symb: "cos",
    f: Math.cos,
  },
  {
    symb: "sin",
    f: Math.sin,
  },
  {
    symb: "tan",
    f: Math.tan,
  },
  {
    symb: "acos",
    f: Math.acos,
  },
  {
    symb: "asin",
    f: Math.asin,
  },
  {
    symb: "atan",
    f: Math.atan,
  },
  {
    symb: "ch",
    f: Math.cosh,
  },
  {
    symb: "sh",
    f: Math.sinh,
  },
  {
    symb: "exp",
    f: Math.exp,
  },
  {
    symb: "abs",
    f: Math.abs,
  },
  {
    symb: "floor",
    f: Math.floor,
  },
]

function fact(n: number): number {
  if (n < 0) throw new Error("Negative factorial")
  if (n != Math.floor(n)) throw new Error("Non-int factorial")
  if (n <= 1) return 1
  return n * fact(n - 1)
}

function isLetter(str: string) {
  return str.length === 1 && str.match(/[a-z]/i)
}

function parseMath(input: string): Expression {
  input = input.trim()
  if (input === "") throw Error("Empty string")

  function cutAt(s: Symbol, ignoreTrailing: boolean = true) {
    if (s.pos === input.length - 1) {
      if (!ignoreTrailing) throw new Error("Trailing symbol")
      return parseMath(input.slice(0, -1))
    }
    return new Function(
      s.f,
      parseMath(input.slice(0, s.pos)),
      parseMath(input.slice(s.pos + 1)),
    )
  }

  function readWord(at: number = 0) {
    let i = at
    while (i < input.length && isLetter(input[i])) i++
    return input.slice(0, i)
  }

  if (input[0] === "(" && input[input.length - 1] === ")")
    return parseMath(input.slice(1, -1))

  let i = -1
  let depth = 0
  let lastAdditive: Symbol | null = null
  let lastMultiplicative: Symbol | null = null
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
      if (input[i] === "+") lastAdditive = { pos: i, f: (a, b) => a + b }
      if (input[i] === "-" && i > 0) {
        lastAdditive = { pos: i, f: (a, b) => a - b }
      }
      if (input[i] === "*") lastMultiplicative = { pos: i, f: (a, b) => a * b }
      if (input[i] === "/") {
        lastMultiplicative = {
          pos: i,
          f: (a, b) => {
            if (b === 0) throw new Error("Division by 0")
            return a / b
          },
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
        }
    }
  } while (i < input.length)

  // Check for parenthesis left open
  if (input[0] === "(" && depth > 0) return parseMath(input.slice(1))

  // Check for additive symbols
  if (lastAdditive) return cutAt(lastAdditive)

  // Check for multiplicative symbols
  if (lastMultiplicative) return cutAt(lastMultiplicative)

  // Check for powers
  if (lastPower) return cutAt(lastPower)

  // Check for functions
  if (input[0] === "-")
    return new Function((x) => -x, parseMath(input.slice(1)))

  if (input[input.length - 1] === "!")
    return new Function(fact, parseMath(input.slice(0, -1)))

  for (var func of singleArgFunctionLib) {
    if (readWord().toLowerCase() === func.symb) {
      return new Function(
        (x) => {
          if (func.validateInput && !func.validateInput(x))
            throw new Error(func.errorMsg)
          return func.f(x)
        },
        parseMath(input.slice(func.symb.length)),
      )
    }
  }

  // Check for known constants
  for (var c of constantsLib) {
    if (readWord().toLowerCase() === c.symb) {
      return new Number(c.value)
    }
  }

  // Read raw number
  const cleanInput = input.replaceAll(" ", "")
  const x = parseFloat(cleanInput)
  if (isNaN(x)) throw Error(`Unreadable float ${cleanInput}`)
  return new Number(x)
}

export function evaluateString(input: string): number {
  try {
    const parsed = parseMath(input)
    const value = parsed.evaluate()
    // console.log(`${input} evaluated to ${value}`)
    return value
  } catch (e: any) {
    // console.log(`Error parsing ${input} : ${e.message}`)
    return NaN
  }
}
