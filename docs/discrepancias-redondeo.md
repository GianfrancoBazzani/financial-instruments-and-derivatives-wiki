# Discrepancias de redondeo

Lecturas de los gráficos interactivos que no coinciden con el número impreso en el texto, a la precisión del texto. Las lecturas usan cálculos exactos (especificación, §9.1); el texto se deja como está en la nota original. Cada fila es un caso para el propietario.

| Página | Gráfico | Valor en el texto | Valor de la lectura | Causa |
| --- | --- | --- | --- | --- |
| 00 Instrumentos de renta fija | `DurationConvexityApprox` (por defecto, Δy = +2%) | Lineal -7.180% | Lineal -7.17% (sin redondear: -7.171%) | El texto calcula -3.59 × 0.02 con la duración modificada redondeada a 3.59; la exacta es 3.5853. |
| 00 Instrumentos de renta fija | `DurationConvexityApprox` (por defecto, Δy = +2%) | Segundo orden -6.844% | Segundo orden -6.83% (sin redondear: -6.834%) | Suma -7.180 + 0.336, con el término lineal de la fila anterior. |
| 00 Instrumentos de renta fija | `DurationConvexityApprox` (Δy = +0.2%) | Lineal -0.718% | Lineal -0.72% (sin redondear: -0.717%) | La misma duración modificada redondeada a 3.59. |
| 00 Instrumentos de renta fija | `DurationConvexityApprox` (Δy = +0.2%) | Segundo orden -0.715% | Segundo orden -0.71% (sin redondear: -0.714%) | Suma -0.718 + 0.003, con el término lineal de la fila anterior. |
