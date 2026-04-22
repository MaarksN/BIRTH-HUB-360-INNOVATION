Item: GAP-003 - Output schema estrito em todos os prompts consumidos por sistemas | Data: 2026-03-20T08:57:45-03:00

Arquivos criados/alterados:
- C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\agents\ae\schemas.py
- C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\agents\sdr\schemas.py
- C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\agents\ae\main.py
- C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\agents\sdr\main.py
- C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\agents\ae\tests\test_main_output_schema.py
- C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\agents\sdr\tests\test_main_output_schema.py

Typecheck: zero erros (checagem de fronteira sem tipagem dinâmica proibida) | Testes: 6 passando / 0 falhando

Schema strict: Confirmado sem Any | [SOURCE]: Confirmado em 100% dos arquivos

Anti-drift: Nenhum rascunho encontrado

Resultado esperado atingido: Sim - fronteiras AE/SDR rejeitam payload malformado e usam schema estrito.
