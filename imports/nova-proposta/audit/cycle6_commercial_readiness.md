# Ciclo 6 - Commercial Readiness

## Classificação final
Classificação honesta: `operacional limitada`

Leitura correta desta nota:
- o produto tem base para assinatura recorrente fixa em escopo limitado
- o produto nao tem base confiável para monetização por uso
- o produto nao sustenta toda a promessa comercial presente na documentação institucional

## O que é código
- catálogo de planos com preço mensal/anual
- criação de checkout Stripe
- portal Stripe
- reconciliação de assinatura e invoices por webhook
- trial de 14 dias
- grace period e hard lock
- alguns limites e gates de feature
- export diário de invoices

## O que é documentação aspiracional
- billing por uso com Stripe Meter Events
- pipeline Redis -> `tenant_usage` -> Stripe Metering
- lead-to-cash completo
- emissão de NF-e
- limites por usuários, leads e contratos conforme narrativa comercial
- automação financeira enterprise completa

## O que parece operação real
- cobrança recorrente simples
- estado de assinatura sincronizado via eventos Stripe suportados
- visibilidade básica de invoices
- travas limitadas por plano ou inadimplência

## Matriz de prontidão comercial

| Capacidade | Situação | Leitura |
| --- | --- | --- |
| Planos e preços fixos | Implementado | Pronto apenas para catálogo básico |
| Assinatura Stripe | Implementado | Operável |
| Trial | Implementado de forma simples | Operável com pouca sofisticação |
| Upgrade/downgrade | Parcialmente implementado | Requer cuidado operacional |
| Cancelamento exposto ao produto | Parcial | Service existe, fluxo público não ficou evidente |
| Inadimplência e grace period | Implementado | Operável |
| Dunning real | Não evidenciado | Limitado |
| Metering por uso | Não confiável | Não pronto |
| Pricing coerente entre UI e backend | Parcial | Frágil |
| Promessa comercial enterprise | Acima do código | Não aderente |

## Principais razões para não classificar como comercialmente pronta
- Billing por uso não é confiável nem reconciliável.
- Quotas não derivam consistentemente do plano contratado.
- Uso exibido em billing/analytics depende de estrutura sem writer de runtime comprovado.
- A narrativa comercial promete limites e capacidades não modelados nos planos reais.
- A governança técnica é enfraquecida por uso massivo de `@ts-nocheck`.

## O que impediria um go-to-market seguro hoje
- vender overage ou cobrança variável
- vender aderência a limites de usuários, leads e contratos
- vender automação financeira completa com NF-e
- vender visibilidade precisa de consumo mensal por cliente

## O que poderia operar de forma limitada
- piloto controlado de assinatura fixa
- onboarding com plano starter
- upgrade manual/assistido para pro e enterprise
- uso de Stripe Checkout + portal + invoices com acompanhamento humano

Condições implícitas para esse uso limitado:
- escopo comercial restrito
- sem promessa de usage billing
- sem promessa de full lead-to-cash financeiro
- monitoramento manual de inconsistências de plano/quota

## Julgamento final
O produto está acima de um estágio meramente estrutural porque já cobra assinatura recorrente e reconcilia eventos centrais de Stripe. Ainda assim, a monetização está longe de ser comercialmente pronta. O estado mais fiel é `operacional limitada`: existe base para operar planos fixos com forte contenção de escopo, mas não existe base para comercialização ampla, enterprise ou usage-based sem risco elevado de inconsistência de cobrança e quebra de promessa comercial.

## Criterios objetivos para sair de `operacional limitada`
- Todo limite comercial ativo deve ser derivado do plano contratado, sem hardcodes paralelos em onboarding e reset.
- Cada evento de consumo faturavel deve gerar trilha auditavel de escrita no runtime, com agregacao reprodutivel por tenant e periodo.
- Se houver promessa de billing por uso, o produto precisa integrar consumo medido com faturamento Stripe ou mecanismo equivalente de invoice line item.
- A UI de pricing deve consumir o catalogo canônico sem aliases improvisados nem calculo local de preco anual.
- A narrativa comercial precisa ser reduzida ao que o codigo efetivamente controla ou, alternativamente, o enforcement tecnico precisa ser implementado.
- O dominio de billing e metering precisa passar em lint sem dependencia massiva de `@ts-nocheck`.

