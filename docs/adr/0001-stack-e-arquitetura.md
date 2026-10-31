# ADR 0001 — Expo, offline-first e repositório público

- **Status:** aceito
- **Data:** 2026-10-31

## Contexto

App pessoal mobile para catalogar a biblioteca real, organizar a fila e gerar um plano de leitura diário. Uso individual, sem necessidade de servidor no MVP.

## Decisão

1. **Expo + React Native + TypeScript** como stack do app.
2. **Offline-first:** SQLite local via Drizzle ORM; backup/exportação em JSON.
3. **Sem backend no MVP.**
4. **Android primeiro**; iOS depois via EAS Build.
5. **Repositório público desde a S0**, com gitleaks, CI e dados pessoais fora do repo.
6. **Sem IA no MVP:** o plano é um algoritmo determinístico, explicável e testado.

## Consequências

**Positivas:** custo zero, privacidade por padrão, iteração rápida, build Android sem Mac, OTA via EAS Update.

**Negativas:** sem sync multi-dispositivo; iOS exige build na nuvem; disciplina contínua de segredos e dados pessoais por o repo ser público.

## Alternativas descartadas

- **Flutter:** viável, mas o autor já domina React e a iteração seria mais lenta.
- **Supabase desde o início:** adiciona login, backend, custo e 3–4 sessões antes do primeiro valor.
- **Repo privado:** decidido abrir desde o início; a higiene entra na S0.

## Revisão

Reavaliar sync e IA apenas depois do MVP (S13).
