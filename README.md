# Fisiologia em Ação

Simulador educacional de fisiologia do exercício. Projeto de Lucas Davanzo Botino (Educação Física, UNIRP).

- `public/`: o site (HTML, JS e imagens).
- `netlify/edge-functions/ia.js`: tutor de IA. Ele busca artigos no PubMed (revisões e meta-análises primeiro), lê os resumos e responde citando as fontes.

## Variáveis de ambiente (Netlify → Environment variables)
- `GEMINI_API_KEY`: chave grátis em https://aistudio.google.com/apikey (obrigatória, a não ser que use a do Claude).
- `GEMINI_MODEL` (opcional): padrão `gemini-flash-latest`.
- `ANTHROPIC_API_KEY` (opcional, pago): se existir, o tutor usa o Claude no lugar do Gemini. Modelo em `ANTHROPIC_MODEL` (padrão `claude-sonnet-5-5`).
- `NCBI_API_KEY` (opcional): aumenta o limite do PubMed de 3 para 10 pedidos por segundo.
