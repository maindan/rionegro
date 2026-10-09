# Rio Negro Log — site

Site institucional da Rio Negro Log (Manaus, AM), feito em HTML, CSS e JavaScript puros, sem build.

## Páginas

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Home |
| `sobre.html` | História, missão, visão, valores e galeria |
| `servicos.html` | Os 4 serviços, rotas e modais |
| `contato.html` | Canais, formulário e mapa |
| `cadastro.html` | Cadastro de clientes (CNPJ, CEP e cidades preenchidos automaticamente) |
| `obrigado.html` | Confirmação do cadastro |

`guia-de-estilo/index.html` é o guia de cores, tipografia, componentes e animações.

## Estrutura

```
assets/
  css/style.css   estilos, tema claro (padrão) e escuro
  js/main.js      tema, menu, animações, WhatsApp e formulários
  img/            fotos, logos e fundos
```

## Rodar localmente

Abra `index.html` no navegador, ou sirva a pasta:

```
python -m http.server 8000
```

## Formulários

Sem servidor configurado, os formulários de contato e cadastro abrem o WhatsApp com a mensagem pronta.
Para enviar a um servidor, preencha `endpointContato` e `endpointCadastro` no início de `assets/js/main.js`.
