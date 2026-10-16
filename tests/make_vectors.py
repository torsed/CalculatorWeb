"""Generate test vectors: expression -> (fast result, CAS-ish result).

Run with the same interpreter that runs the project's tests. Writes JSON.
"""
import json
import sys

# Этот Python-файл больше не используется для генерации векторов.
# Вместо него используется JS-скрипт: node tests/make_vectors.js
sys.path.insert(0, r"C:\CalculatorWeb")
from core.parser import ExprError, evaluate, fmt  # noqa: E402  # Python-прототип отсутствует; для документации

CASES = [
    # арифметика
    "1+1", "2*3", "7/2", "2^10", "2^0.5", "(-8)^(1/3)", "1/3",
    "5+3*2", "(5+3)*2", "2+3-4", "10-2-3", "100/5/2",
    "-5", "-5+3", "3*-2", "2*-3", "--5", "-(-5)",
    "1.5.2" if False else "1.5", "0.1+0.2", "1e3", "1e-3", "2.5e3",
    "1e308*10", "2^1024",
    # унарный плюс — опечатка, а не 8
    "5 + + 3",
    # проценты
    "10%3", "-10%3", "10%-3", "5%0",
    # факториал
    "5!", "0!", "3!+2!", "-1!", "2.5!", "20!", "171!",
    # скобки
    "((1+2))", "(1+2", "1+2)", "()", "sin()", "fact()",
    # тригонометрия в градусах
    "sin(0)", "sin(30)", "sin(90)", "sin(180)", "cos(60)", "cos(90)",
    "tan(45)", "tan(0)", "asin(1)", "asin(0.5)", "acos(0)", "acos(1)",
    "atan(1)", "atan(0)",
    # в радианах
    "sin(0)", "sin(pi)", "sin(pi/2)", "cos(pi)", "tan(pi/4)",
    "asin(1)", "atan(1)",
    # гиперболические
    "sinh(1)", "cosh(1)", "tanh(1)", "asinh(1)", "acosh(1)", "atanh(0.5)",
    # экспонента и логарифмы
    "ln(e)", "log(100)", "log(8,2)", "log2(8)", "log10(1000)",
    "exp(1)", "e^1", "sqrt(16)", "sqrt(2)", "cbrt(27)", "cbrt(-8)",
    "sqrt(-1)", "sqrt(-4)",
    # знак и модуль
    "sign(-5)", "sign(0)", "sign(5)", "abs(-5)", "abs(3+4i)", "fabs(-2.5)",
    # округление
    "floor(2.7)", "ceil(2.1)", "round(2.5)", "round(3.5)", "round(-2.5)",
    "round(2.345, 2)", "floor(-2.5)",
    # константы
    "pi", "e", "tau", "phi", "c", "g", "i", "I", "2pi", "2*pi", "pi/2",
    "2e", "e^2", "1/pi",
    # побитовые
    "12&10", "12|10", "12 xor 10", "1<<3", "16>>2", "~5", "not(5)",
    "5 and 3", "5 or 3", "5 xor 3", "1 shl 3", "16 shr 2",
    "5 & 3", "5 | 3", "2.5 & 1", "~2.5",
    # теория чисел
    "gcd(12,10)", "lcm(4,6)", "ncr(5,2)", "npr(5,2)", "fact(5)",
    "isprime(7)", "isprime(8)", "nextprime(10)", "totient(12)",
    "modpow(2,10,1000)",
    # неявное умножение
    "2pi", "3(4)", "(2)(3)", "2(3)(4)", "2sin(30)",
    # комплексные
    "i*i", "i^2", "(1+2i)+(3+4i)", "(1+2i)*(3+4i)", "(3+4i)/(1+2i)",
    "3+4i", "2i", "i+1", "sqrt(-4)", "(2+3i)*(2-3i)",
    # ошибки
    "1/0", "1.5.2", "sin()", "fact()", "2**3", "foo(2)", "unknownfunc(1)",
    "5 + + 3", "(1+2", "1+2)", "2+", "2*", "5!", "-1!", "log(8)", "log(8,2,3)",
    "0!", "-1", "1.5.2.3",
    # вложенность
    "sin(cos(tan(30)))", "sqrt(abs(-16))", "log(gcd(12,18))",
    "round(sqrt(2)*100)/100",
]

def main() -> None:
    out = []
    for expr in CASES:
        for deg in (True, False):
            try:
                res = fmt(evaluate(expr, deg=deg))
                out.append({"expr": expr, "deg": deg, "result": res, "error": None})
            except ExprError as exc:
                out.append({"expr": expr, "deg": deg, "result": None,
                            "error": str(exc)})
            except Exception as exc:  # noqa: BLE001
                out.append({"expr": expr, "deg": deg, "result": None,
                            "error": f"UNEXPECTED:{type(exc).__name__}: {exc}"})
    dest = r"C:\CalculatorWeb\tests\vectors.json"
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    ok = sum(1 for r in out if r["error"] is None)
    print(f"wrote {len(out)} vectors to {dest} ({ok} numeric, {len(out)-ok} errors)")


if __name__ == "__main__":
    main()