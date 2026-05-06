import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/gerar-receita", async (req, res) => {
  try {
    const { alimentos } = req.body;

    if (!alimentos || alimentos.length === 0) {
      return res.status(400).json({ erro: "Nenhum alimento enviado" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
Crie uma receita saudável, REALISTA e saborosa com base nesses ingredientes:
${alimentos.join(", ")}

REGRAS:
- Apenas receitas possíveis na vida real
- Pode adicionar ingredientes saudáveis (azeite, alho, ervas)
- Nada industrializado
- Receita simples e gostosa

RESPONDA APENAS EM JSON:

{
  "nome": "",
  "tempo": "",
  "porcoes": "",
  "ingredientes": [],
  "modo_preparo": "",
  "beneficios": ""
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const texto = response.text();

    console.log("RESPOSTA GEMINI:", texto);

    // 🔥 extrair JSON (IMPORTANTE)
    const match = texto.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({
        erro: "JSON não encontrado",
        raw: texto
      });
    }

    let receitaJSON;

    try {
      receitaJSON = JSON.parse(match[0]);
    } catch (e) {
      return res.status(500).json({
        erro: "Erro ao converter JSON",
        raw: texto
      });
    }

    res.json(receitaJSON);

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro no Gemini" });
  }
});

app.listen(3000, () => {
  console.log("🔥 Backend Gemini rodando em http://localhost:3000");
});