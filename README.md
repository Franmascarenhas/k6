# k6 - Performance Lab

Repositório de estudos e portfólio com scripts de testes de performance usando **k6** (Grafana).

## Objetivo
- Aprender k6 do básico ao avançado
- Criar testes realistas com autenticação (token)
- Usar boas práticas: `stages`, `thresholds`, `checks`, `setup()` e `scenarios`

---

## Pré-requisitos
- k6 instalado
- Windows (PowerShell/CMD) ou terminal equivalente

Verificar instalação:
```bash
k6 version

Como rodar:
Smoke Básico
k6 run .\scripts\smoke\testes.js

Fluxo com Autenticação:
k6 run .\scripts\flows\dummyjson_token_flow.js

Cenários Realistas (setup + 2 cenários)
k6 run .\scripts\flows\dummyjson_scenarios.js

Como interpretar o output (mínimo):
http_req_failed: taxa de falhas (rede + 4xx/5xx)
http_req_duration p(95): 95% das respostas abaixo desse tempo
checks_failed: validações que falharam
thresholds: metas que determinam PASS/FAIL do teste

Fonte da API de treino:
Os fluxos de autenticação usam a API pública DummyJSON.

