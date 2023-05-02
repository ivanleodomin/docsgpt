import "dotenv/config"
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';
import mdToPdf from 'md-to-pdf';
import { Readable } from "stream";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method != 'POST') {
    return res.status(405).send({ message: 'Mehtod not found' });

  }
  const { theme } = req.body;

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'Sos un asistente que tiene como objetivo realizar un informe sobre los temas que se te mensionen. La respuesta debe estar escrita en markdown, contener titulo y varios items',
      },
      {
        role: 'user',
        content: `Quiero un informe que explique sobre el tema: ${theme}`,
      },
    ],
  });

  const markdown = completion.data.choices[0].message?.content;

  if (!markdown) {
    return res.status(500).send({ message: 'no fue posible generar el documento' });
  }

  const pdf = await mdToPdf({ content: markdown }).catch((error) => {
    console.error(error);
    throw new Error('Error to generate PDF');
  });

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${theme}.pdf"`,
  );
  res.setHeader('Content-Type', 'application/pdf');
  const stream = new Readable();
  stream.push(pdf.content);
  stream.push(null);
  stream.pipe(res)
}
